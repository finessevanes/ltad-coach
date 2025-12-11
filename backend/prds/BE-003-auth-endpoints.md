---
id: BE-003
depends_on: [BE-001, BE-002]
blocks: [BE-004, BE-005, BE-006, BE-012, BE-013]
---

# BE-003: Authentication Endpoints

## Title
Implement Firebase JWT token validation and auth middleware

## Scope

### In Scope
- Firebase ID token verification endpoint
- JWT validation middleware/dependency
- User creation in Firestore on first login
- Protected route decorator/dependency
- Logout endpoint (client-side, but endpoint for any cleanup)

### Out of Scope
- Firebase Auth configuration (handled in Firebase Console)
- Frontend auth UI (FE-002, FE-003)
- OAuth provider setup (Firebase Console)

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Token Location | Authorization: Bearer header | Standard JWT practice |
| User Storage | Firestore `users` collection | Consistent with PRD data model |
| Session | Stateless JWT | Firebase handles token refresh |

## Acceptance Criteria

- [ ] `POST /auth/token` validates Firebase ID token and returns user data
- [ ] Invalid/expired tokens return 401 Unauthorized
- [ ] First-time users are created in Firestore `users` collection
- [ ] Returning users have their data fetched from Firestore
- [ ] Protected routes reject requests without valid Bearer token
- [ ] User object includes `id`, `email`, `name`, `createdAt`, `athleteCount`
- [ ] `POST /auth/logout` endpoint exists (for future session cleanup)

## Files to Create/Modify

```
backend/app/
├── routers/
│   └── auth.py                 # Auth endpoints
├── models/
│   ├── __init__.py
│   └── user.py                 # User Pydantic models
├── repositories/
│   ├── __init__.py
│   └── user.py                 # User repository
├── middleware/
│   ├── __init__.py
│   └── auth.py                 # Auth dependency
└── main.py                     # Register auth router (modify)
```

## Implementation Details

### models/user.py
```python
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: str
    created_at: datetime
    athlete_count: int = 0

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    athlete_count: int
```

### middleware/auth.py
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
from app.models.user import User
from app.repositories.user import UserRepository

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """Validate Firebase ID token and return user"""
    token = credentials.credentials

    try:
        decoded_token = auth.verify_id_token(token)
    except auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )
    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )

    uid = decoded_token["uid"]
    email = decoded_token.get("email")
    name = decoded_token.get("name", email.split("@")[0] if email else "User")

    # Get or create user in Firestore
    user_repo = UserRepository()
    user = await user_repo.get_by_firebase_uid(uid)

    if not user:
        user = await user_repo.create_from_firebase(uid, email, name)

    return user
```

### routers/auth.py
```python
from fastapi import APIRouter, Depends, HTTPException, status
from app.middleware.auth import get_current_user
from app.models.user import User, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/token", response_model=UserResponse)
async def validate_token(user: User = Depends(get_current_user)):
    """
    Validate Firebase ID token and return user data.
    Creates user in Firestore if first login.
    """
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        athlete_count=user.athlete_count
    )

@router.post("/logout")
async def logout(user: User = Depends(get_current_user)):
    """
    Logout endpoint for any server-side cleanup.
    Actual token invalidation happens client-side with Firebase.
    """
    # Future: Could revoke refresh tokens if needed
    # auth.revoke_refresh_tokens(user.firebase_uid)
    return {"message": "Logged out successfully"}
```

### repositories/user.py
```python
from datetime import datetime
from typing import Optional
from app.firebase.repository import BaseRepository
from app.models.user import User

class UserRepository(BaseRepository[User]):
    def __init__(self):
        super().__init__("users", User)

    async def get_by_firebase_uid(self, uid: str) -> Optional[User]:
        """Get user by Firebase UID (document ID)"""
        return await self.get(uid)

    async def create_from_firebase(
        self, uid: str, email: str, name: str
    ) -> User:
        """Create new user from Firebase auth data"""
        user_data = {
            "email": email,
            "name": name,
            "created_at": datetime.utcnow(),
            "athlete_count": 0
        }
        # Use Firebase UID as document ID
        self.collection.document(uid).set(user_data)
        return User(id=uid, **user_data)

    async def increment_athlete_count(self, user_id: str, delta: int = 1):
        """Increment or decrement athlete count"""
        from google.cloud.firestore import Increment
        self.collection.document(user_id).update({
            "athlete_count": Increment(delta)
        })
```

### Firestore Security Rules (Reference)
```javascript
// Add to Firebase Console > Firestore > Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## API Specification

### POST /auth/token

**Request Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response 200:**
```json
{
  "id": "firebase_uid_123",
  "email": "coach@example.com",
  "name": "John Coach",
  "athlete_count": 5
}
```

**Response 401:**
```json
{
  "detail": "Invalid authentication token"
}
```

### POST /auth/logout

**Request Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response 200:**
```json
{
  "message": "Logged out successfully"
}
```

## Estimated Complexity
**S** (Small) - 2-3 hours

## Testing Instructions

1. Get a Firebase ID token:
   - Use Firebase Auth REST API or client SDK
   - Or use Firebase Auth emulator for testing

2. Test token validation:
```bash
TOKEN="<firebase_id_token>"
curl -X POST http://localhost:8000/auth/token \
  -H "Authorization: Bearer $TOKEN"
```

3. Test invalid token:
```bash
curl -X POST http://localhost:8000/auth/token \
  -H "Authorization: Bearer invalid_token"
# Should return 401
```

4. Verify user creation:
   - Check Firestore `users` collection
   - User document ID should match Firebase UID

## Notes
- Firebase ID tokens expire after 1 hour; client must refresh
- Consider adding rate limiting to prevent brute force attempts
- User's `name` defaults to email prefix if not provided by OAuth
