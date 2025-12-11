"""Authentication middleware and dependencies."""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
from firebase_admin.auth import InvalidIdTokenError, ExpiredIdTokenError

from app.models.user import User
from app.repositories.user import UserRepository

# Security scheme for Bearer token
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """Validate Firebase ID token and return user.

    This dependency:
    1. Extracts Bearer token from Authorization header
    2. Verifies token with Firebase Admin SDK
    3. Gets or creates user in Firestore
    4. Returns User model instance

    Args:
        credentials: HTTP Bearer credentials from header

    Returns:
        User: Authenticated user instance

    Raises:
        HTTPException: 401 if token is invalid or expired
    """
    token = credentials.credentials

    try:
        decoded_token = auth.verify_id_token(token)
    except InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )
    except ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )

    # Extract user info from token
    uid = decoded_token["uid"]
    email = decoded_token.get("email", "")
    name = decoded_token.get("name")

    # Default name to email prefix if not provided
    if not name and email:
        name = email.split("@")[0]
    elif not name:
        name = "User"

    # Get or create user in Firestore
    user_repo = UserRepository()
    user = await user_repo.get_by_firebase_uid(uid)

    if not user:
        # First-time login - create user
        user = await user_repo.create_from_firebase(uid, email, name)

    return user


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        HTTPBearer(auto_error=False)
    )
) -> User | None:
    """Optionally get current user if token is provided.

    Useful for endpoints that work with or without authentication.

    Returns:
        User if authenticated, None otherwise
    """
    if credentials is None:
        return None

    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None
