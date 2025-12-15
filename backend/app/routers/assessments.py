"""Assessment API endpoints.

This module now acts as a validated write proxy - the client calculates all metrics,
and the backend validates ownership/consent and stores the results.
"""

import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.middleware.auth import get_current_user
from app.middleware.rate_limit import analysis_rate_limiter
from app.models.user import User
from app.models.assessment import (
    AssessmentCreate,
    AssessmentResponse,
    AssessmentListResponse,
    AssessmentListItem,
    AnalyzeResponse,
    AssessmentStatus,
    LegTested,
    UpdateNotesRequest,
)
from app.repositories.assessment import AssessmentRepository
from app.repositories.athlete import AthleteRepository
from app.services.metrics import get_duration_score
from app.agents.orchestrator import get_orchestrator

router = APIRouter(prefix="/assessments", tags=["assessments"])
logger = logging.getLogger(__name__)


def _get_duration_seconds(assessment) -> Optional[float]:
    """Extract hold_time for dual-leg assessments.

    Args:
        assessment: Assessment instance from database

    Returns:
        Average hold time of both legs, or None if data unavailable
    """
    # Dual-leg: use average of both legs
    left_time = assessment.left_leg_metrics.hold_time if assessment.left_leg_metrics else None
    right_time = assessment.right_leg_metrics.hold_time if assessment.right_leg_metrics else None

    if left_time is not None and right_time is not None:
        return (left_time + right_time) / 2
    elif left_time is not None:
        return left_time
    elif right_time is not None:
        return right_time
    else:
        return None


def _build_metrics_dict(client_metrics, duration_score: int) -> Dict[str, Any]:
    """Build metrics dictionary from client metrics and duration score.

    Converts Pydantic model to dict and adds server-calculated LTAD score.
    Handles both legacy (temporal + five_second_segments) and new (segmented_metrics) formats.

    Args:
        client_metrics: Client-side metrics from MediaPipe analysis
        duration_score: Server-calculated LTAD score (1-5)

    Returns:
        Dictionary with all metrics ready for storage
    """
    metrics_dict = {
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
    }

    # Handle temporal data - prefer new format, fallback to legacy
    if client_metrics.segmented_metrics:
        # NEW: Use segmented_metrics
        metrics_dict["segmented_metrics"] = client_metrics.segmented_metrics.model_dump()
        logger.info(f"Stored {len(client_metrics.segmented_metrics.segments)} segments "
                   f"({client_metrics.segmented_metrics.segment_duration}s duration)")
    else:
        # LEGACY: Use old temporal + five_second_segments if present
        if client_metrics.temporal:
            metrics_dict["temporal"] = client_metrics.temporal.model_dump()
            logger.warning("Using legacy temporal format (first/middle/last thirds)")
        if client_metrics.five_second_segments:
            metrics_dict["five_second_segments"] = [seg.model_dump() for seg in client_metrics.five_second_segments]
            logger.warning("Using legacy five_second_segments format")

    # Events (unchanged)
    if client_metrics.events:
        metrics_dict["events"] = [event.model_dump() for event in client_metrics.events]

    return metrics_dict


async def _process_single_leg_assessment(data: AssessmentCreate, coach_id: str, athlete) -> "Assessment":
    """Process single-leg assessment.

    Args:
        data: Validated assessment creation request
        coach_id: ID of the coach creating the assessment
        athlete: Athlete being assessed

    Returns:
        Created Assessment instance

    Raises:
        HTTPException 400: Missing client metrics
    """
    # Client metrics are required
    if not data.client_metrics:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Client metrics are required",
        )

    # Calculate LTAD duration score (validated by Athletics Canada LTAD framework)
    duration_score = get_duration_score(data.client_metrics.hold_time)

    # Build consolidated metrics from client data + backend calculations
    metrics = _build_metrics_dict(data.client_metrics, duration_score)

    # Create assessment as completed (no background processing needed)
    assessment_repo = AssessmentRepository()
    assessment = await assessment_repo.create_completed(
        coach_id=coach_id,
        athlete_id=data.athlete_id,
        test_type=data.test_type.value,
        leg_tested=data.leg_tested.value,
        video_url=data.left_video_url,
        video_path=data.left_video_path,
        metrics=metrics,
    )

    logger.info(f"Single-leg assessment {assessment.id} created and completed immediately")

    # Generate coach assessment feedback via orchestrator (Phase 7)
    try:
        orchestrator = get_orchestrator()
        ai_coach_assessment = await orchestrator.generate_feedback(
            request_type="assessment_feedback",
            athlete_id=data.athlete_id,
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

    return assessment


async def _process_dual_leg_assessment(data: AssessmentCreate, coach_id: str, athlete) -> "Assessment":
    """Process dual-leg assessment with bilateral comparison.

    Calculates LTAD scores for both legs, computes bilateral comparison,
    stores assessment, and triggers AI feedback generation.

    Args:
        data: Validated assessment creation request
        coach_id: ID of the coach creating the assessment
        athlete: Athlete being assessed

    Returns:
        Created Assessment instance

    Raises:
        HTTPException 400: Missing required dual-leg fields
        HTTPException 500: Processing or storage error
    """
    logger.info(f"Processing dual-leg assessment for athlete {athlete.id} ({athlete.name})")

    # Validate dual-leg fields
    if not data.dual_leg_metrics:
        logger.error(f"Missing dual_leg_metrics for athlete {athlete.id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="dual_leg_metrics required when leg_tested is 'both'"
        )

    if not data.right_video_url:
        logger.error(f"Missing right_video_url for athlete {athlete.id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="right_video_url required when leg_tested is 'both'"
        )

    # Log received metrics
    logger.info(f"Left leg metrics: hold_time={data.dual_leg_metrics.left_leg.hold_time}s, "
                f"corrections={data.dual_leg_metrics.left_leg.corrections_count}")
    logger.info(f"Right leg metrics: hold_time={data.dual_leg_metrics.right_leg.hold_time}s, "
                f"corrections={data.dual_leg_metrics.right_leg.corrections_count}")
    # Note: symmetry_analysis is calculated server-side, not sent by client

    # Calculate LTAD duration scores for both legs
    left_duration_score = get_duration_score(data.dual_leg_metrics.left_leg.hold_time)
    right_duration_score = get_duration_score(data.dual_leg_metrics.right_leg.hold_time)
    logger.info(f"LTAD scores calculated: left={left_duration_score}, right={right_duration_score}")

    # Build metrics dictionaries (includes temporal data)
    left_metrics = _build_metrics_dict(data.dual_leg_metrics.left_leg, left_duration_score)
    right_metrics = _build_metrics_dict(data.dual_leg_metrics.right_leg, right_duration_score)

    # Calculate bilateral comparison
    from app.services.bilateral_comparison import calculate_bilateral_comparison
    bilateral_comparison = calculate_bilateral_comparison(left_metrics, right_metrics)
    logger.info(f"Bilateral comparison calculated - symmetry score: {bilateral_comparison['overall_symmetry_score']}/100")

    # Create assessment in Firestore
    assessment_repo = AssessmentRepository()
    assessment = await assessment_repo.create_completed_dual_leg(
        coach_id=coach_id,
        athlete_id=athlete.id,
        test_type=data.test_type.value,
        left_leg_video_url=data.left_video_url,
        left_leg_video_path=data.left_video_path,
        left_leg_metrics=left_metrics,
        right_leg_video_url=data.right_video_url,
        right_leg_video_path=data.right_video_path,
        right_leg_metrics=right_metrics,
        bilateral_comparison=bilateral_comparison,
    )

    logger.info(f"Dual-leg assessment {assessment.id} created and completed immediately")

    # Generate bilateral AI feedback (async, non-blocking)
    try:
        logger.info(f"Generating bilateral AI feedback for assessment {assessment.id}")
        orchestrator = get_orchestrator()

        # Prepare metrics dict for orchestrator
        metrics_for_orchestrator = {
            "left_leg_metrics": left_metrics,
            "right_leg_metrics": right_metrics,
            "bilateral_comparison": bilateral_comparison,
        }
        logger.info(f"Calling orchestrator with metrics containing {len(left_metrics)} left metrics, "
                    f"{len(right_metrics)} right metrics, {len(bilateral_comparison)} comparison metrics")

        ai_assessment = await orchestrator.generate_feedback(
            request_type="bilateral_assessment",
            athlete_id=athlete.id,
            athlete_name=athlete.name,
            athlete_age=athlete.age,
            athlete_gender=athlete.gender,
            metrics=metrics_for_orchestrator,
        )

        # Update assessment with AI feedback
        await assessment_repo.update(assessment.id, {"ai_coach_assessment": ai_assessment})
        logger.info(f"Bilateral AI feedback generated for assessment {assessment.id}")

    except Exception as e:
        # Log error but don't block response
        logger.error(f"Failed to generate bilateral AI feedback for {assessment.id}: {e}", exc_info=True)
        logger.error(f"Error details - Type: {type(e).__name__}, Args: {e.args}")
        # Assessment still valid without AI feedback

    return assessment


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_video_endpoint(
    data: AssessmentCreate,
    current_user: User = Depends(get_current_user),
):
    """Create assessment from client-side analysis (single-leg or dual-leg).

    Routes to appropriate handler based on leg_tested value:
    - "left" or "right" → single-leg processing (existing)
    - "both" → dual-leg processing (NEW)

    Args:
        data: Assessment creation payload (validated by Pydantic)
        current_user: Authenticated user from Firebase token

    Returns:
        AnalyzeResponse with assessment ID and status

    Raises:
        HTTPException 400: Invalid athlete, missing consent, or validation error
        HTTPException 403: User doesn't own athlete
        HTTPException 500: Server error during processing
    """
    # Check rate limit
    analysis_rate_limiter.check_or_raise(current_user.id)

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

    # Route based on leg_tested
    try:
        if data.leg_tested in [LegTested.LEFT, LegTested.RIGHT]:
            # Single-leg mode (existing logic)
            assessment = await _process_single_leg_assessment(data, current_user.id, athlete)
        elif data.leg_tested == LegTested.BOTH:
            # Dual-leg mode (NEW)
            assessment = await _process_dual_leg_assessment(data, current_user.id, athlete)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid leg_tested value: {data.leg_tested}"
            )

        return AnalyzeResponse(
            id=assessment.id,
            status=assessment.status,
            message="Assessment completed successfully"
        )

    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        logger.error(f"Failed to create assessment: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create assessment"
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

    # Convert to list items (using new lightweight model)
    items = [
        AssessmentListItem(
            id=a.id,
            athlete_id=a.athlete_id,
            athlete_name=athlete.name,
            test_type=a.test_type,
            leg_tested=a.leg_tested,
            created_at=a.created_at,
            status=a.status,
            duration_seconds=_get_duration_seconds(a),
        )
        for a in assessments
    ]

    return AssessmentListResponse(
        assessments=items,
        next_cursor=None,
        has_more=False,
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
        # Single-leg video fields
        video_url=assessment.video_url,
        video_path=assessment.video_path,
        # Single-leg metrics
        metrics=assessment.metrics,
        # Dual-leg video fields
        left_leg_video_url=assessment.left_leg_video_url,
        left_leg_video_path=assessment.left_leg_video_path,
        right_leg_video_url=assessment.right_leg_video_url,
        right_leg_video_path=assessment.right_leg_video_path,
        # Dual-leg metrics
        left_leg_metrics=assessment.left_leg_metrics,
        right_leg_metrics=assessment.right_leg_metrics,
        bilateral_comparison=assessment.bilateral_comparison,
        # Common fields
        ai_coach_assessment=assessment.ai_coach_assessment,
        error_message=assessment.error_message,
    )


@router.get("/test-progress/{athlete_id}")
async def test_progress(
    athlete_id: str,
):
    """Test endpoint to view progress agent output.

    This is a development-only endpoint to see the progress agent's
    parent-friendly report generation. It prints to console and returns JSON.

    NOTE: Auth disabled for testing purposes.

    Args:
        athlete_id: Athlete ID to generate progress report for

    Returns:
        Progress report text and metadata

    Raises:
        404: Athlete not found
    """
    athlete_repo = AthleteRepository()
    assessment_repo = AssessmentRepository()

    # Get athlete (no ownership check for testing)
    athlete = await athlete_repo.get(athlete_id)
    if not athlete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete not found",
        )

    # Get assessments for context
    assessments = await assessment_repo.get_by_athlete(athlete_id, limit=12)
    assessment_count = len(assessments)

    if assessment_count == 0:
        return {
            "athlete_name": athlete.name,
            "assessment_count": 0,
            "report": "No assessments found for this athlete. Complete at least one assessment to generate a progress report.",
        }

    # Get latest assessment metrics (convert Pydantic model to dict)
    latest_assessment = assessments[0] if assessments else None
    current_metrics = latest_assessment.metrics.model_dump() if (latest_assessment and latest_assessment.metrics) else {}

    # Use orchestrator to generate progress report
    orchestrator = get_orchestrator()
    report = await orchestrator.generate_feedback(
        request_type="progress_trends",
        athlete_id=athlete_id,
        athlete_name=athlete.name,
        athlete_age=athlete.age,
        metrics=current_metrics,
    )

    # Print to console with nice formatting
    print("\n" + "="*80)
    print(f"PROGRESS REPORT FOR {athlete.name} (Age {athlete.age})")
    print("="*80)
    print(f"Assessment Count: {assessment_count}")
    print("-"*80)
    print(report)
    print("="*80 + "\n")

    return {
        "athlete_name": athlete.name,
        "athlete_age": athlete.age,
        "assessment_count": assessment_count,
        "report": report,
    }


@router.get("", response_model=AssessmentListResponse)
async def list_assessments(
    limit: int = Query(20, ge=1, le=50),
    cursor: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
):
    """List all assessments for authenticated coach (activity feed).

    Ordered by most recent first with cursor-based pagination.

    Args:
        limit: Maximum number of assessments to return (1-50, default 20)
        cursor: Cursor for next page (optional)
        current_user: Authenticated user

    Returns:
        List of assessments with pagination info
    """
    assessment_repo = AssessmentRepository()
    athlete_repo = AthleteRepository()

    # Get assessments (fetch limit + 1 to check if there are more)
    assessments = await assessment_repo.get_by_coach(current_user.id, limit=limit + 1)

    # Check if there are more results
    has_more = len(assessments) > limit
    if has_more:
        assessments = assessments[:limit]

    # Get athlete names for display (denormalized) - batch fetch to avoid N+1
    unique_athlete_ids = list(set(a.athlete_id for a in assessments))
    athletes = await athlete_repo.batch_get(unique_athlete_ids)
    athlete_names = {
        athlete_id: (athlete.name if athlete else "Unknown")
        for athlete_id, athlete in athletes.items()
    }

    # Build response items
    items = [
        AssessmentListItem(
            id=a.id,
            athlete_id=a.athlete_id,
            athlete_name=athlete_names.get(a.athlete_id, "Unknown"),
            test_type=a.test_type,
            leg_tested=a.leg_tested,
            created_at=a.created_at,
            status=a.status,
            duration_seconds=_get_duration_seconds(a),
        )
        for a in assessments
    ]

    # Generate next cursor
    next_cursor = None
    if has_more and assessments:
        next_cursor = assessments[-1].id

    return AssessmentListResponse(
        assessments=items,
        next_cursor=next_cursor,
        has_more=has_more,
    )


@router.put("/{assessment_id}/notes")
async def update_notes(
    assessment_id: str,
    data: UpdateNotesRequest,
    current_user: User = Depends(get_current_user),
):
    """Update coach notes for an assessment.

    Args:
        assessment_id: Assessment ID
        data: Request with notes
        current_user: Authenticated user

    Returns:
        Success message

    Raises:
        404: Assessment not found
        403: Access denied (not owned by coach)
    """
    assessment_repo = AssessmentRepository()
    athlete_repo = AthleteRepository()

    # Get assessment
    assessment = await assessment_repo.get(assessment_id)
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found",
        )

    # Validate ownership via athlete
    athlete = await athlete_repo.get_if_owned(assessment.athlete_id, current_user.id)
    if not athlete:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    # Update notes
    await assessment_repo.update(assessment_id, {"coach_notes": data.notes})

    return {"message": "Notes updated"}


@router.delete("/{assessment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assessment(
    assessment_id: str,
    current_user: User = Depends(get_current_user),
):
    """Delete an assessment and its associated files.

    Args:
        assessment_id: Assessment ID
        current_user: Authenticated user

    Raises:
        404: Assessment not found
        403: Access denied (not owned by coach)
    """
    from firebase_admin import storage

    assessment_repo = AssessmentRepository()
    athlete_repo = AthleteRepository()

    # Get assessment
    assessment = await assessment_repo.get(assessment_id)
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found",
        )

    # Validate ownership via athlete
    athlete = await athlete_repo.get_if_owned(assessment.athlete_id, current_user.id)
    if not athlete:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    # Delete video from Firebase Storage
    if assessment.video_path:
        try:
            bucket = storage.bucket()
            video_blob = bucket.blob(assessment.video_path)
            video_blob.delete()
            logger.info(f"Deleted video: {assessment.video_path}")
        except Exception as e:
            logger.error(f"Failed to delete video {assessment.video_path}: {e}")
            # Continue - don't fail delete if storage cleanup fails

    # Delete assessment document
    await assessment_repo.delete(assessment_id)
    logger.info(f"Deleted assessment: {assessment_id}")

    return None
