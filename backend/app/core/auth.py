from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
from app.core.firebase import get_firebase_app
from typing import Dict

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, str]:
    """
    Validate Firebase ID token and extract user info

    Returns:
        dict with 'uid' and 'email'

    Raises:
        HTTPException 401 if token is invalid
    """
    token = credentials.credentials

    try:
        # Verify token with Firebase
        get_firebase_app()  # Ensure initialized
        decoded_token = auth.verify_id_token(token)

        return {
            "uid": decoded_token["uid"],
            "email": decoded_token.get("email", ""),
            "email_verified": decoded_token.get("email_verified", False)
        }

    except auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )
    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )


def require_auth(user: Dict[str, str] = Depends(get_current_user)) -> Dict[str, str]:
    """Alias for get_current_user for clarity in route definitions"""
    return user
