"""Repository for athlete data management."""

import uuid
from datetime import datetime, timedelta
from typing import Optional
from app.repositories.base import BaseRepository
from app.models.athlete import Athlete, AthleteCreate, ConsentStatus


class AthleteRepository(BaseRepository[Athlete]):
    """Repository for managing athlete data in Firestore."""

    def __init__(self):
        """Initialize athlete repository."""
        super().__init__("athletes", Athlete)

    async def create_for_coach(self, coach_id: str, athlete_data: AthleteCreate) -> Athlete:
        """Create a new athlete for a coach with consent workflow setup.

        Args:
            coach_id: ID of the coach creating the athlete
            athlete_data: Athlete creation data

        Returns:
            Created athlete with consent_token and defaults
        """
        now = datetime.utcnow()
        consent_token = str(uuid.uuid4())
        consent_token_expires = now + timedelta(days=30)

        data = {
            "coach_id": coach_id,
            "name": athlete_data.name,
            "age": athlete_data.age,
            "gender": athlete_data.gender.value,
            "parent_email": athlete_data.parent_email,
            "consent_status": ConsentStatus.PENDING.value,
            "consent_token": consent_token,
            "consent_token_expires": consent_token_expires,
            "consent_timestamp": None,
            "created_at": now,
            "avatar_url": None,
            "edit_lock": None,
        }

        athlete_id = await self.create(data)

        # Return created athlete
        return Athlete(id=athlete_id, **data)

    async def get_by_coach(
        self, coach_id: str, consent_status: Optional[ConsentStatus] = None
    ) -> list[Athlete]:
        """Get all athletes for a coach, optionally filtered by consent status.

        Args:
            coach_id: Coach ID to filter by
            consent_status: Optional consent status filter

        Returns:
            List of athletes owned by coach
        """
        if consent_status:
            # Filter by both coach_id and consent_status
            query = self.collection.where("coach_id", "==", coach_id).where(
                "consent_status", "==", consent_status.value
            )
        else:
            # Filter by coach_id only
            query = self.collection.where("coach_id", "==", coach_id)

        docs = query.stream()
        athletes = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            athletes.append(Athlete(**data))

        return athletes

    async def get_if_owned(self, athlete_id: str, coach_id: str) -> Optional[Athlete]:
        """Get athlete if owned by the specified coach.

        Args:
            athlete_id: Athlete ID to retrieve
            coach_id: Coach ID to verify ownership

        Returns:
            Athlete if owned by coach, None otherwise (prevents enumeration)
        """
        athlete = await self.get(athlete_id)
        if athlete and athlete.coach_id == coach_id:
            return athlete
        return None

    async def get_by_consent_token(self, token: str) -> Optional[Athlete]:
        """Get athlete by consent token (for public consent endpoints).

        Args:
            token: Consent token (UUID4)

        Returns:
            Athlete with matching token, or None
        """
        query = self.collection.where("consent_token", "==", token)
        docs = list(query.stream())

        if not docs:
            return None

        doc = docs[0]
        data = doc.to_dict()
        data["id"] = doc.id
        return Athlete(**data)

    async def update_consent_status(
        self, athlete_id: str, status: ConsentStatus, timestamp: datetime
    ) -> bool:
        """Update athlete's consent status and timestamp.

        Args:
            athlete_id: Athlete to update
            status: New consent status
            timestamp: When consent was provided/declined

        Returns:
            True if updated successfully
        """
        return await self.update(
            athlete_id,
            {"consent_status": status.value, "consent_timestamp": timestamp},
        )
