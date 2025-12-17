"""User repository for Firestore operations."""

from datetime import datetime, timezone
from typing import Optional
from google.cloud.firestore_v1 import Increment

from app.repositories.base import BaseRepository
from app.models.user import User


class UserRepository(BaseRepository[User]):
    """Repository for user operations in Firestore."""

    def __init__(self):
        super().__init__("users", User)

    async def get_by_firebase_uid(self, uid: str) -> Optional[User]:
        """Get user by Firebase UID (document ID).

        Args:
            uid: Firebase user ID

        Returns:
            User instance or None if not found
        """
        return await self.get(uid)

    async def create_from_firebase(
        self,
        uid: str,
        email: str,
        name: str
    ) -> User:
        """Create new user from Firebase auth data.

        Args:
            uid: Firebase user ID (used as document ID)
            email: User email
            name: User display name

        Returns:
            Created User instance
        """
        now = datetime.now(timezone.utc)
        user_data = {
            "email": email,
            "name": name,
            "created_at": now,
            "athlete_count": 0
        }
        # Use Firebase UID as document ID
        await self.create(user_data, doc_id=uid)
        return User(id=uid, **user_data)

    async def increment_athlete_count(
        self,
        user_id: str,
        delta: int = 1
    ) -> None:
        """Increment or decrement athlete count atomically.

        Args:
            user_id: User document ID
            delta: Amount to increment (positive) or decrement (negative)
        """
        self.collection.document(user_id).update({
            "athlete_count": Increment(delta)
        })
