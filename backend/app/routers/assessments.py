"""Assessment API endpoints."""

import asyncio
import logging
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from app.middleware.auth import get_current_user
from app.middleware.rate_limit import analysis_rate_limiter
from app.models.user import User
from app.models.assessment import (
    AssessmentCreate,
    AssessmentResponse,
    AnalyzeResponse,
)
from app.repositories.assessment import AssessmentRepository
from app.repositories.athlete import AthleteRepository
from app.services.video import download_video_from_storage, validate_video, cleanup_temp_file
from app.services.analysis import analyze_video
from app.services.metrics import MetricsCalculator

router = APIRouter(prefix="/assessments", tags=["assessments"])
logger = logging.getLogger(__name__)


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_video_endpoint(
    data: AssessmentCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
):
    """Trigger video analysis (non-blocking).

    Creates assessment in processing state and queues background task.

    Args:
        data: Assessment creation data
        background_tasks: FastAPI background tasks
        current_user: Authenticated user

    Returns:
        Assessment ID and status

    Raises:
        400: Athlete not found or invalid consent
        404: Athlete not found or not owned by coach
        429: Rate limit exceeded
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

    # Create assessment in processing state
    assessment_repo = AssessmentRepository()
    assessment = await assessment_repo.create_for_analysis(
        coach_id=current_user.id,
        athlete_id=data.athlete_id,
        test_type=data.test_type.value,
        leg_tested=data.leg_tested.value,
        video_url=data.video_url,
        video_path=data.video_path,
        client_metrics=data.client_metrics.model_dump() if data.client_metrics else None,
    )

    # Queue background task
    background_tasks.add_task(
        process_assessment,
        assessment.id,
        data.video_path,
        data.leg_tested.value,
        data.duration,
    )

    logger.info(f"Assessment {assessment.id} created and queued for processing")

    return AnalyzeResponse(
        id=assessment.id,
        status=assessment.status,
    )


@router.get("/{assessment_id}", response_model=AssessmentResponse)
async def get_assessment(
    assessment_id: str,
    current_user: User = Depends(get_current_user),
):
    """Get assessment by ID (for polling).

    Args:
        assessment_id: Assessment ID
        current_user: Authenticated user

    Returns:
        Assessment with current status

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


async def process_assessment(
    assessment_id: str,
    video_path: str,
    leg_tested: str,
    client_duration: float,
):
    """Background task to process assessment.

    Args:
        assessment_id: Assessment ID
        video_path: Firebase Storage path to video
        leg_tested: Which leg was tested
        client_duration: Client-measured video duration in seconds
    """
    assessment_repo = AssessmentRepository()
    temp_file = None

    try:
        logger.info(f"Processing assessment {assessment_id}")

        # Download video from Firebase Storage
        temp_file = await download_video_from_storage(video_path)

        # Validate video
        is_valid, error = await validate_video(temp_file)
        if not is_valid:
            await assessment_repo.mark_failed(assessment_id, error)
            logger.error(f"Assessment {assessment_id} validation failed: {error}")
            return

        # Analyze video with MediaPipe
        results = await analyze_video(assessment_id, temp_file, leg_tested, client_duration)

        # Calculate metrics
        calculator = MetricsCalculator(
            filtered_landmarks=results["filtered_landmarks"],
            timestamps=results["timestamps"],
            duration=results["duration"],
            failure_reason=results["failure_reason"],
            leg_tested=leg_tested,
        )
        metrics = calculator.calculate_all()

        # Update assessment with results
        await assessment_repo.update_with_results(
            assessment_id,
            metrics=metrics,
            raw_keypoints_url=results["raw_keypoints_url"],
            ai_feedback="",  # Populated in Phase 7
        )

        logger.info(f"Assessment {assessment_id} completed successfully")

    except ValueError as e:
        # Known errors (validation, no pose detected, etc.)
        await assessment_repo.mark_failed(assessment_id, str(e))
        logger.error(f"Assessment {assessment_id} failed: {e}")

    except Exception as e:
        # Unexpected errors
        await assessment_repo.mark_failed(assessment_id, "Processing failed")
        logger.error(f"Assessment {assessment_id} failed unexpectedly: {e}", exc_info=True)

    finally:
        # Cleanup temp file
        if temp_file:
            cleanup_temp_file(temp_file)
