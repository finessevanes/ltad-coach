COMPLETED

---
id: BE-008
depends_on: [BE-006]
blocks: []
---

# BE-008: Authentication Endpoints

## Scope

**In Scope:**
- POST `/auth/token` - Validate Firebase token and create session
- POST `/auth/logout` - Invalidate session (optional for stateless)
- GET `/auth/me` - Get current user info

**Out of Scope:**
- User registration (handled by Firebase Client SDK)
- Password reset (handled by Firebase Client SDK)
- Session storage (using stateless JWT)

## Technical Decisions

- **Auth Flow**: Frontend gets token from Firebase Auth, backend validates it
- **Session**: Stateless (no server-side session storage)
- **User Creation**: Auto-create user document in Firestore on first login
- **Router**: `/api/auth` router group

## Acceptance Criteria

- [ ] POST `/api/auth/token` validates token and returns user data
- [ ] Auto-creates user document in Firestore if doesn't exist
- [ ] GET `/api/auth/me` returns current user info
- [ ] POST `/api/auth/logout` returns success (stateless, no server action needed)
- [ ] All endpoints have proper error handling

## Files to Create/Modify

- `app/api/auth.py` (create)
- `app/main.py` (modify - include auth router)

## Implementation Notes

**app/api/auth.py**:
```python
from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user
from app.services.database import db, Collections
from app.models.user import User, UserResponse
from pydantic import BaseModel

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class TokenRequest(BaseModel):
    token: str

@router.post("/token")
async def validate_token(request: TokenRequest):
    """
    Validate Firebase token and create/get user

    This endpoint is called after Firebase Client SDK authentication.
    It ensures a user document exists in Firestore.
    """
    from firebase_admin import auth
    from app.core.firebase import get_firebase_app

    try:
        get_firebase_app()
        decoded = auth.verify_id_token(request.token)

        uid = decoded["uid"]
        email = decoded.get("email", "")

        # Check if user exists
        user_data = db.get(Collections.USERS, uid)

        if not user_data:
            # Create new user document
            user_data = {
                "email": email,
                "name": decoded.get("name", email.split("@")[0]),
                "athleteCount": 0
            }
            db.create(Collections.USERS, user_data, doc_id=uid)
            user_data["id"] = uid

        return {
            "user": UserResponse(**user_data),
            "token": request.token
        }

    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.get("/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    """Get current authenticated user info"""
    user_data = db.get(Collections.USERS, user["uid"])

    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")

    return UserResponse(**user_data)

@router.post("/logout")
async def logout():
    """Logout (stateless - no server action needed)"""
    return {"message": "Logged out successfully"}
```

**app/main.py** (add):
```python
from app.api import auth

app.include_router(auth.router)
```

## Testing

```bash
# 1. Get Firebase token (from frontend or Firebase Console)
# 2. Test token validation
curl -X POST http://localhost:8000/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"token": "<firebase-token>"}'

# 3. Test /me endpoint
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer <firebase-token>"
```

## Estimated Complexity

**Size**: S (Small - ~1.5 hours)
