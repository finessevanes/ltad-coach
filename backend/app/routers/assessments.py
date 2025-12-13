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
from app.services.metrics import get_duration_score, get_age_expectation

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
    2. Calculates backend-only scores (duration_score, age_expectation)
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

    # Calculate backend-only scores from client metrics
    client_metrics = data.client_metrics
    duration_score, duration_score_label = get_duration_score(client_metrics.hold_time)
    age_expectation = get_age_expectation(athlete.age, duration_score) if athlete.age else None

    # Build full metrics from client data + backend calculations
    metrics = {
        "hold_time": client_metrics.hold_time,
        "stability_score": client_metrics.stability_score,
        "sway_std_x": client_metrics.sway_std_x,
        "sway_std_y": client_metrics.sway_std_y,
        "sway_path_length": client_metrics.sway_path_length,
        "sway_velocity": client_metrics.sway_velocity,
        "arm_deviation_left": client_metrics.arm_deviation_left,
        "arm_deviation_right": client_metrics.arm_deviation_right,
        "arm_asymmetry_ratio": client_metrics.arm_asymmetry_ratio,
        "corrections_count": client_metrics.corrections_count,
        "duration_score": duration_score,
        "duration_score_label": duration_score_label,
        "age_expectation": age_expectation,
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
        client_metrics=client_metrics.model_dump(),
        failure_reason=client_metrics.failure_reason,
    )

    logger.info(f"Assessment {assessment.id} created and completed immediately")

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
            client_metrics=a.client_metrics,
            ai_feedback=a.ai_feedback,
            failure_reason=a.failure_reason,
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
        client_metrics=assessment.client_metrics,
        ai_feedback=assessment.ai_feedback,
        failure_reason=assessment.failure_reason,
        error_message=assessment.error_message,
    )
