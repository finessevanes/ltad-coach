"""Dashboard API endpoint."""

from fastapi import APIRouter, Depends
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.dashboard import (
    DashboardResponse,
    DashboardStats,
    RecentAssessmentItem,
    PendingAthleteItem,
)
from app.repositories.athlete import AthleteRepository
from app.repositories.assessment import AssessmentRepository

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


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

    # Fetch all athletes for the coach
    all_athletes = await athlete_repo.get_by_coach(current_user.id)

    # Separate athletes by consent status
    active_athletes = [a for a in all_athletes if a.consent_status == "active"]
    pending_athletes = [a for a in all_athletes if a.consent_status == "pending"]

    # Fetch recent assessments (last 10)
    recent_assessments = await assessment_repo.get_by_coach(current_user.id, limit=10)

    # For MVP: Use length of recent assessments as total count
    # TODO: For production with 100+ assessments, implement Firestore aggregation or caching
    # This is a performance optimization to avoid expensive count query
    total_assessments = len(recent_assessments)

    # Build athlete name lookup dict for efficient name resolution
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
            hold_time=assessment.metrics.hold_time if assessment.metrics else None,
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
            gender=athlete.gender.value,
            parent_email=athlete.parent_email,
            created_at=athlete.created_at,
        )
        for athlete in pending_athletes
    ]

    # Build stats
    stats = DashboardStats(
        total_athletes=len(all_athletes),
        active_athletes=len(active_athletes),
        pending_consent=len(pending_athletes),
        total_assessments=total_assessments,
    )

    return DashboardResponse(
        stats=stats,
        recent_assessments=recent_items,
        pending_athletes=pending_items,
    )
