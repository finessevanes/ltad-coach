COMPLETED

---
id: BE-006
depends_on: [BE-002, BE-004]
blocks: [BE-008, BE-009, BE-012, BE-030]
---

# BE-006: Authentication Middleware

## Scope

**In Scope:**
- Firebase JWT token validation
- FastAPI dependency for protected routes
- Extract user ID from token
- Handle expired/invalid tokens

**Out of Scope:**
- Token generation (handled by Firebase client SDK)
- User registration logic (BE-008)
- Password reset flows

## Technical Decisions

- **Auth Method**: Firebase ID tokens (JWT) sent in Authorization header
- **Header Format**: `Authorization: Bearer <token>`
- **Dependency Pattern**: FastAPI dependency injection
- **User Context**: Attach `user_id` and `email` to request
- **Location**: `app/core/auth.py`

## Acceptance Criteria

- [ ] Firebase Auth initialized
- [ ] `get_current_user()` dependency extracts and validates token
- [ ] Returns user info (uid, email) on success
- [ ] Returns 401 with clear error message on failure
- [ ] Works with `Depends()` in route handlers
- [ ] Handles missing Authorization header gracefully

## Files to Create/Modify

- `app/core/auth.py` (create)
- `app/models/user.py` (create - user model)

## Implementation Notes

**app/core/auth.py**:
```python
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
```

**app/models/user.py**:
```python
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.base import FirestoreDocument

class User(FirestoreDocument):
    email: EmailStr
    name: str
    athleteCount: int = 0

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    athleteCount: int
```

## Testing

Add protected test endpoint:
```python
from app.core.auth import get_current_user

@app.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Test endpoint - requires authentication"""
    return {
        "message": "Authenticated successfully",
        "user": user
    }
```

Test with curl:
```bash
# This should return 401
curl http://localhost:8000/me

# This should return user data (get token from Firebase Auth)
curl -H "Authorization: Bearer <firebase-token>" http://localhost:8000/me
```

## Estimated Complexity

**Size**: M (Medium - ~2 hours)

## Notes

- Tokens are generated on the frontend using Firebase Client SDK
- Token verification happens server-side for security
- Firebase handles token expiration (default: 1 hour)
- No need to store sessions - tokens are stateless
- For testing, can generate tokens using Firebase Admin SDK or Firebase Console
