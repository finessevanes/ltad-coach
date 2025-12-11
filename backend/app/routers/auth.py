"""Authentication endpoints."""

from fastapi import APIRouter, Depends

from app.middleware.auth import get_current_user
from app.models.user import User, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/token", response_model=UserResponse)
async def validate_token(user: User = Depends(get_current_user)):
    """Validate Firebase ID token and return user data.

    This endpoint:
    1. Validates the Firebase ID token in Authorization header
    2. Creates user in Firestore if first login
    3. Returns user data

    Headers:
        Authorization: Bearer <firebase_id_token>

    Returns:
        UserResponse: User data including id, email, name, athlete_count
    """
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        athlete_count=user.athlete_count
    )


@router.post("/logout")
async def logout(user: User = Depends(get_current_user)):
    """Logout endpoint for server-side cleanup.

    Note: Actual token invalidation happens client-side with Firebase.
    This endpoint exists for:
    - Future server-side session cleanup
    - Token revocation if needed
    - Analytics/logging purposes

    Headers:
        Authorization: Bearer <firebase_id_token>

    Returns:
        dict: Success message
    """
    # Future: Could revoke refresh tokens if needed
    # auth.revoke_refresh_tokens(user.id)
    return {"message": "Logged out successfully"}
