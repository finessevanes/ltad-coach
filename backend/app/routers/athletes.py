"""Athletes API endpoints."""

import asyncio
from typing import Optional
from datetime import datetime, timedelta, timezone
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.athlete import (
    AthleteCreate,
    AthleteUpdate,
    AthleteResponse,
    AthletesListResponse,
    ConsentStatus,
)
from app.models.errors import AppException, ErrorCode
from app.repositories.athlete import AthleteRepository
from app.repositories.user import UserRepository

router = APIRouter(prefix="/athletes", tags=["athletes"])


# In-memory rate limiter for consent email resend (MVP only)
# TODO: Migrate to Redis for production multi-instance deployment
class ResendRateLimiter:
    """Rate limiter for consent email resend (in-memory, single-instance only)."""

    def __init__(self, max_per_day: int = 3):
        """Initialize rate limiter.

        Args:
            max_per_day: Maximum resends per athlete per 24 hours
        """
        self.max_per_day = max_per_day
        self.resends: dict[str, list[datetime]] = defaultdict(list)

    def check_and_record(self, athlete_id: str) -> bool:
        """Check if resend is allowed and record attempt.

        Args:
            athlete_id: Athlete ID to check

        Returns:
            True if allowed (and recorded), False if rate limited
        """
        now = datetime.now(timezone.utc)
        cutoff = now - timedelta(days=1)

        # Remove entries older than 24 hours
        self.resends[athlete_id] = [
            ts for ts in self.resends[athlete_id] if ts > cutoff
        ]

        # Check if limit reached
        if len(self.resends[athlete_id]) >= self.max_per_day:
            return False

        # Record new attempt
        self.resends[athlete_id].append(now)
        return True


# Global rate limiter instance
resend_rate_limiter = ResendRateLimiter(max_per_day=3)


@router.post("", response_model=AthleteResponse, status_code=status.HTTP_201_CREATED)
async def create_athlete(
    athlete_data: AthleteCreate,
    current_user: User = Depends(get_current_user),
):
    """Create a new athlete for the authenticated coach.

    Enforces 25-athlete soft limit per coach.
    Generates consent token and sets status to pending.
    Triggers consent email to parent (handled in BE-2.6).

    Args:
        athlete_data: Athlete creation data
        current_user: Authenticated coach

    Returns:
        Created athlete (without sensitive fields)

    Raises:
        400: Athlete limit reached (25 athletes)
    """
    user_repo = UserRepository()
    athlete_repo = AthleteRepository()

    # Check 25-athlete soft limit
    if current_user.athlete_count >= 25:
        raise AppException(
            code=ErrorCode.VALIDATION_ERROR,
            message="Athlete limit reached. Maximum 25 athletes per coach.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    # Create athlete with consent workflow setup
    athlete = await athlete_repo.create_for_coach(current_user.id, athlete_data)

    # Increment coach's athlete count atomically
    await user_repo.increment_athlete_count(current_user.id, delta=1)

    # Send consent email to parent (fire-and-forget, don't block response)
    async def send_consent_email_async():
        """Send consent email in background."""
        import logging
        from app.services.email import send_consent_request

        logger = logging.getLogger(__name__)
        email_sent = send_consent_request(
            parent_email=athlete.parent_email,
            athlete_name=athlete.name,
            coach_name=current_user.name,
            consent_token=athlete.consent_token,
        )

        if not email_sent:
            logger.error(
                f"Failed to send consent email for athlete {athlete.id} to {athlete.parent_email}"
            )

    asyncio.create_task(send_consent_email_async())

    # Return response (excluding sensitive fields)
    return AthleteResponse(
        id=athlete.id,
        name=athlete.name,
        age=athlete.age,
        gender=athlete.gender,
        parent_email=athlete.parent_email,
        consent_status=athlete.consent_status,
        created_at=athlete.created_at,
        avatar_url=athlete.avatar_url,
    )


@router.get("", response_model=AthletesListResponse)
async def list_athletes(
    response: Response,
    status: Optional[str] = Query(None, description="Filter by consent status: pending|active|declined"),
    current_user: User = Depends(get_current_user),
):
    """List all athletes for the authenticated coach.

    Optionally filter by consent status.

    Args:
        response: FastAPI response for setting headers
        status: Optional consent status filter
        current_user: Authenticated coach

    Returns:
        List of athletes with count

    Raises:
        400: Invalid status value
    """
    # Cache for 60 seconds - athlete list changes infrequently
    response.headers["Cache-Control"] = "private, max-age=60"

    athlete_repo = AthleteRepository()

    # Validate status parameter if provided
    consent_status_filter = None
    if status:
        try:
            consent_status_filter = ConsentStatus(status)
        except ValueError:
            raise AppException(
                code=ErrorCode.VALIDATION_ERROR,
                message=f"Invalid status value. Must be one of: pending, active, declined",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

    # Get athletes for coach
    athletes = await athlete_repo.get_by_coach(current_user.id, consent_status_filter)

    # Convert to response models
    athlete_responses = [
        AthleteResponse(
            id=athlete.id,
            name=athlete.name,
            age=athlete.age,
            gender=athlete.gender,
            parent_email=athlete.parent_email,
            consent_status=athlete.consent_status,
            created_at=athlete.created_at,
            avatar_url=athlete.avatar_url,
        )
        for athlete in athletes
    ]

    return AthletesListResponse(athletes=athlete_responses, count=len(athlete_responses))


@router.get("/{athlete_id}", response_model=AthleteResponse)
async def get_athlete(
    athlete_id: str,
    current_user: User = Depends(get_current_user),
):
    """Get a single athlete by ID.

    Enforces ownership check - returns 404 if not owned by coach.

    Args:
        athlete_id: Athlete ID
        current_user: Authenticated coach

    Returns:
        Athlete data

    Raises:
        404: Athlete not found or not owned by coach
    """
    athlete_repo = AthleteRepository()

    # Get athlete if owned by coach
    athlete = await athlete_repo.get_if_owned(athlete_id, current_user.id)

    if not athlete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete not found",
        )

    return AthleteResponse(
        id=athlete.id,
        name=athlete.name,
        age=athlete.age,
        gender=athlete.gender,
        parent_email=athlete.parent_email,
        consent_status=athlete.consent_status,
        created_at=athlete.created_at,
        avatar_url=athlete.avatar_url,
    )


@router.put("/{athlete_id}", response_model=AthleteResponse)
async def update_athlete(
    athlete_id: str,
    athlete_data: AthleteUpdate,
    current_user: User = Depends(get_current_user),
):
    """Update an athlete's information.

    Supports partial updates (all fields optional).
    Enforces ownership check.

    Args:
        athlete_id: Athlete ID
        athlete_data: Fields to update
        current_user: Authenticated coach

    Returns:
        Updated athlete data

    Raises:
        404: Athlete not found or not owned by coach
    """
    athlete_repo = AthleteRepository()

    # Check ownership
    athlete = await athlete_repo.get_if_owned(athlete_id, current_user.id)
    if not athlete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete not found",
        )

    # Build update dict (only include provided fields)
    update_data = {}
    if athlete_data.name is not None:
        update_data["name"] = athlete_data.name
    if athlete_data.age is not None:
        update_data["age"] = athlete_data.age
    if athlete_data.gender is not None:
        update_data["gender"] = athlete_data.gender.value
    if athlete_data.parent_email is not None:
        update_data["parent_email"] = athlete_data.parent_email

    # Update athlete
    if update_data:
        await athlete_repo.update(athlete_id, update_data)

        # Apply updates to in-memory object to avoid re-fetching
        for key, value in update_data.items():
            setattr(athlete, key, value)

    return AthleteResponse(
        id=athlete.id,
        name=athlete.name,
        age=athlete.age,
        gender=athlete.gender,
        parent_email=athlete.parent_email,
        consent_status=athlete.consent_status,
        created_at=athlete.created_at,
        avatar_url=athlete.avatar_url,
    )


@router.delete("/{athlete_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_athlete(
    athlete_id: str,
    current_user: User = Depends(get_current_user),
):
    """Delete an athlete.

    Includes cascade deletion of related data (assessments, reports, files).
    Decrements coach's athlete count.
    Enforces ownership check.

    Args:
        athlete_id: Athlete ID
        current_user: Authenticated coach

    Returns:
        204 No Content

    Raises:
        404: Athlete not found or not owned by coach
    """
    athlete_repo = AthleteRepository()
    user_repo = UserRepository()

    # Check ownership
    athlete = await athlete_repo.get_if_owned(athlete_id, current_user.id)
    if not athlete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete not found",
        )

    # TODO (Phase 6+): Cascade delete assessments and reports
    # For now, just delete the athlete document

    # Delete athlete
    await athlete_repo.delete(athlete_id)

    # Decrement coach's athlete count atomically
    await user_repo.increment_athlete_count(current_user.id, delta=-1)

    return None


@router.post("/{athlete_id}/resend-consent")
async def resend_consent_email(
    athlete_id: str,
    current_user: User = Depends(get_current_user),
):
    """Resend consent email to parent/guardian.

    Rate limited to 3 resends per athlete per 24 hours.
    Only allowed if consent status is "pending".

    Args:
        athlete_id: Athlete ID
        current_user: Authenticated coach

    Returns:
        Success message

    Raises:
        404: Athlete not found or not owned by coach
        400: Consent already active
        429: Rate limit exceeded (3 per 24 hours)
    """
    from app.services.email import send_consent_request

    athlete_repo = AthleteRepository()

    # Check ownership
    athlete = await athlete_repo.get_if_owned(athlete_id, current_user.id)
    if not athlete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete not found",
        )

    # Check consent status is pending
    if athlete.consent_status == ConsentStatus.ACTIVE:
        raise AppException(
            code=ErrorCode.VALIDATION_ERROR,
            message="Consent has already been provided. Cannot resend email.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    if athlete.consent_status == ConsentStatus.DECLINED:
        raise AppException(
            code=ErrorCode.VALIDATION_ERROR,
            message="Consent was declined. Contact the parent directly to discuss.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    # Check rate limit
    if not resend_rate_limiter.check_and_record(athlete_id):
        raise AppException(
            code=ErrorCode.RATE_LIMITED,
            message="Too many resend attempts. Maximum 3 per athlete per 24 hours.",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    # Send consent email
    email_sent = send_consent_request(
        parent_email=athlete.parent_email,
        athlete_name=athlete.name,
        coach_name=current_user.name,
        consent_token=athlete.consent_token,
    )

    if not email_sent:
        raise AppException(
            code=ErrorCode.SERVER_ERROR,
            message=f"Failed to send consent email to {athlete.parent_email}. Please check server logs or try again later.",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return {"message": f"Consent email resent to {athlete.parent_email}"}

