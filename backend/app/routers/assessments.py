"""Assessment API endpoints.

This module now acts as a validated write proxy - the client calculates all metrics,
and the backend validates ownership/consent and stores the results.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from app.middleware.auth import get_current_user
from app.middleware.rate_limit import analysis_rate_limiter
from app.models.user import User
from app.models.assessment import (
    AssessmentCreate,
    AssessmentResponse,
    AssessmentListResponse,
    AnalyzeResponse,
    AssessmentStatus,
)
from app.repositories.assessment import AssessmentRepository
from app.repositories.athlete import AthleteRepository
from app.services.metrics import get_duration_score
from app.agents.assessment import generate_assessment_feedback

router = APIRouter(prefix="/assessments", tags=["assessments"])
logger = logging.getLogger(__name__)


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_video_endpoint(
    data: AssessmentCreate,
    current_user: User = Depends(get_current_user),
):
    """Store assessment with client-calculated metrics.

    The client is now the source of truth for all metrics. This endpoint:
    1. Validates athlete ownership and consent
    2. Calculates LTAD duration score (1-5, validated by Athletics Canada)
    3. Stores the assessment as completed immediately

    Args:
        data: Assessment creation data with required client_metrics

    Returns:
        Assessment ID and completed status

    Raises:
        400: Client metrics not provided or athlete consent invalid
        404: Athlete not found or not owned by coach
        429: Rate limit exceeded
    """
    # Check rate limit
    analysis_rate_limiter.check_or_raise(current_user.id)

    # Client metrics are now required
    if not data.client_metrics:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Client metrics are required",
        )

    # Validate athlete ownership and consent
    athlete_repo = AthleteRepository()
    athlete = await athlete_repo.get_if_owned(data.athlete_id, current_user.id)

    if not athlete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete not found",
        )

    if athlete.consent_status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Athlete consent is {athlete.consent_status}. Active consent required.",
        )

    # Calculate LTAD duration score (validated by Athletics Canada LTAD framework)
    client_metrics = data.client_metrics
    duration_score = get_duration_score(client_metrics.hold_time)

    # Build consolidated metrics from client data + backend calculations
    # All metrics in real-world units (cm, degrees)
    metrics = {
        # Test result
        "success": client_metrics.success,
        "hold_time": client_metrics.hold_time,
        "failure_reason": client_metrics.failure_reason,
        # Sway metrics (cm)
        "sway_std_x": client_metrics.sway_std_x,
        "sway_std_y": client_metrics.sway_std_y,
        "sway_path_length": client_metrics.sway_path_length,
        "sway_velocity": client_metrics.sway_velocity,
        "corrections_count": client_metrics.corrections_count,
        # Arm metrics (degrees)
        "arm_angle_left": client_metrics.arm_angle_left,
        "arm_angle_right": client_metrics.arm_angle_right,
        "arm_asymmetry_ratio": client_metrics.arm_asymmetry_ratio,
        # LTAD Score (validated by Athletics Canada)
        "duration_score": duration_score,
        # Temporal analysis
        "temporal": client_metrics.temporal.model_dump() if client_metrics.temporal else None,
        # Enhanced temporal data for LLM
        "five_second_segments": [seg.model_dump() for seg in client_metrics.five_second_segments] if client_metrics.five_second_segments else None,
        "events": [event.model_dump() for event in client_metrics.events] if client_metrics.events else None,
    }

    # Create assessment as completed (no background processing needed)
    assessment_repo = AssessmentRepository()
    assessment = await assessment_repo.create_completed(
        coach_id=current_user.id,
        athlete_id=data.athlete_id,
        test_type=data.test_type.value,
        leg_tested=data.leg_tested.value,
        video_url=data.video_url,
        video_path=data.video_path,
        metrics=metrics,
    )

    logger.info(f"Assessment {assessment.id} created and completed immediately")

    # Generate coach assessment feedback (Phase 7)
    ai_coach_assessment = ""
    try:
        ai_coach_assessment = await generate_assessment_feedback(
            athlete_name=athlete.name,
            athlete_age=athlete.age,
            leg_tested=data.leg_tested.value,
            metrics=metrics,
        )

        # Update assessment with coach feedback
        await assessment_repo.update(
            assessment.id,
            {"ai_coach_assessment": ai_coach_assessment}
        )
        logger.info(f"Coach assessment feedback generated for assessment {assessment.id}")

    except Exception as e:
        logger.error(f"Failed to generate coach assessment for {assessment.id}: {e}")
        # Continue without coach assessment - assessment is still valid

    return AnalyzeResponse(
        id=assessment.id,
        status=assessment.status,
        message="Assessment completed",
    )


@router.get("/athlete/{athlete_id}", response_model=AssessmentListResponse)
async def get_assessments_for_athlete(
    athlete_id: str,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
):
    """Get all assessments for a specific athlete.

    Args:
        athlete_id: Athlete ID
        limit: Maximum number of assessments to return (default 50, max 100)
        current_user: Authenticated user

    Returns:
        List of assessments for the athlete

    Raises:
        404: Athlete not found or not owned by coach
    """
    # Cap limit at 100
    if limit > 100:
        limit = 100

    athlete_repo = AthleteRepository()
    assessment_repo = AssessmentRepository()

    # Verify athlete ownership
    athlete = await athlete_repo.get_if_owned(athlete_id, current_user.id)
    if not athlete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete not found",
        )

    assessments = await assessment_repo.get_by_athlete(athlete_id, limit=limit)

    # Convert to response objects
    assessment_responses = [
        AssessmentResponse(
            id=a.id,
            athlete_id=a.athlete_id,
            test_type=a.test_type,
            leg_tested=a.leg_tested,
            status=a.status,
            created_at=a.created_at,
            metrics=a.metrics,
            ai_coach_assessment=a.ai_coach_assessment,
            error_message=a.error_message,
        )
        for a in assessments
    ]

    return AssessmentListResponse(
        assessments=assessment_responses,
        total=len(assessment_responses),
    )


@router.get("/{assessment_id}", response_model=AssessmentResponse)
async def get_assessment(
    assessment_id: str,
    current_user: User = Depends(get_current_user),
):
    """Get assessment by ID.

    Args:
        assessment_id: Assessment ID
        current_user: Authenticated user

    Returns:
        Assessment with metrics

    Raises:
        404: Assessment not found or not owned by coach
    """
    assessment_repo = AssessmentRepository()
    athlete_repo = AthleteRepository()

    assessment = await assessment_repo.get(assessment_id)

    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found",
        )

    # Verify ownership via athlete
    athlete = await athlete_repo.get_if_owned(assessment.athlete_id, current_user.id)
    if not athlete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found",
        )

    return AssessmentResponse(
        id=assessment.id,
        athlete_id=assessment.athlete_id,
        test_type=assessment.test_type,
        leg_tested=assessment.leg_tested,
        status=assessment.status,
        created_at=assessment.created_at,
        metrics=assessment.metrics,
        ai_coach_assessment=assessment.ai_coach_assessment,
        error_message=assessment.error_message,
    )
