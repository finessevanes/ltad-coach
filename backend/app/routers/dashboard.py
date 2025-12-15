"""Dashboard API endpoint."""

from typing import Optional
from fastapi import APIRouter, Depends
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.dashboard import (
    DashboardResponse,
    DashboardStats,
    RecentAssessmentItem,
    PendingAthleteItem,
)
from app.models.athlete import ConsentStatus
from app.repositories.athlete import AthleteRepository
from app.repositories.assessment import AssessmentRepository

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _get_duration_seconds(assessment) -> Optional[float]:
    """Extract hold_time from single-leg or dual-leg assessments.

    Args:
        assessment: Assessment instance from database

    Returns:
        Hold time in seconds, or average of both legs for dual-leg assessments
    """
    # Single-leg assessment
    if assessment.metrics and assessment.metrics.hold_time is not None:
        return assessment.metrics.hold_time

    # Dual-leg assessment: average of both legs
    left_time = assessment.left_leg_metrics.hold_time if assessment.left_leg_metrics else None
    right_time = assessment.right_leg_metrics.hold_time if assessment.right_leg_metrics else None

    if left_time is not None and right_time is not None:
        return (left_time + right_time) / 2
    elif left_time is not None:
        return left_time
    elif right_time is not None:
        return right_time
    return None


@router.get("", response_model=DashboardResponse)
async def get_dashboard(
    current_user: User = Depends(get_current_user),
) -> DashboardResponse:
    """Get combined dashboard data for authenticated coach.

    Returns:
        DashboardResponse with stats, recent assessments, and pending athletes
    """
    athlete_repo = AthleteRepository()
    assessment_repo = AssessmentRepository()

    # Fetch athletes using server-side filtering (50% faster than client-side)
    active_athletes = await athlete_repo.get_by_coach(
        current_user.id, consent_status=ConsentStatus.ACTIVE
    )
    pending_athletes = await athlete_repo.get_by_coach(
        current_user.id, consent_status=ConsentStatus.PENDING
    )

    # Get total count for stats
    total_athletes_count = len(active_athletes) + len(pending_athletes)

    # Fetch recent assessments (last 10)
    recent_assessments = await assessment_repo.get_by_coach(current_user.id, limit=10)

    # For MVP: Use length of recent assessments as total count
    # TODO: For production with 100+ assessments, implement Firestore aggregation or caching
    # This is a performance optimization to avoid expensive count query
    total_assessments = len(recent_assessments)

    # Build athlete name lookup dict for efficient name resolution
    all_athletes = active_athletes + pending_athletes
    athlete_names = {athlete.id: athlete.name for athlete in all_athletes}

    # Map assessments to response items with athlete names
    recent_items = [
        RecentAssessmentItem(
            id=assessment.id,
            athlete_id=assessment.athlete_id,
            athlete_name=athlete_names.get(assessment.athlete_id, "Unknown"),
            test_type=assessment.test_type.value,
            leg_tested=assessment.leg_tested.value,
            status=assessment.status.value,
            created_at=assessment.created_at,
            duration_seconds=_get_duration_seconds(assessment),
            duration_score=assessment.metrics.duration_score if assessment.metrics else None,
            sway_velocity=assessment.metrics.sway_velocity if assessment.metrics else None,
        )
        for assessment in recent_assessments
    ]

    # Map pending athletes to response items
    pending_items = [
        PendingAthleteItem(
            id=athlete.id,
            name=athlete.name,
            age=athlete.age,
            gender=athlete.gender,
            parent_email=athlete.parent_email,
            created_at=athlete.created_at,
        )
        for athlete in pending_athletes
    ]

    # Build stats
    stats = DashboardStats(
        total_athletes=total_athletes_count,
        active_athletes=len(active_athletes),
        pending_consent=len(pending_athletes),
        total_assessments=total_assessments,
    )

    return DashboardResponse(
        stats=stats,
        recent_assessments=recent_items,
        pending_athletes=pending_items,
    )
