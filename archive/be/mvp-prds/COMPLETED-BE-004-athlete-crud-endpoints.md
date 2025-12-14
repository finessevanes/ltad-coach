---
id: BE-004
depends_on: [BE-002, BE-003]
blocks: [BE-005, BE-006, BE-012]
---

# BE-004: Athlete CRUD Endpoints

## Title
Implement athlete roster management endpoints

## Scope

### In Scope
- Create athlete endpoint (without consent email - that's BE-005)
- Get all athletes for coach
- Get single athlete by ID
- Update athlete information
- Delete athlete
- Athlete count enforcement (soft limit 25)
- Firestore security rules for athletes collection

### Out of Scope
- Consent workflow (BE-005)
- Email sending (BE-005)
- Assessment relationships

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Athlete ID | Firestore auto-generated | Simpler than custom IDs |
| Consent Token | UUID4 | Standard, cryptographically random |
| Count Limit | Soft limit with warning | Allow override in future |

## Acceptance Criteria

- [x] `POST /athletes` creates new athlete with `pending` consent status
- [x] Creating athlete generates unique consent token
- [x] Creating athlete increments coach's `athleteCount`
- [x] `GET /athletes` returns all athletes for authenticated coach
- [x] `GET /athletes` supports filtering by consent status
- [x] `GET /athletes/{id}` returns single athlete (only if owned by coach)
- [x] `PUT /athletes/{id}` updates athlete fields (only if owned by coach)
- [x] `DELETE /athletes/{id}` removes athlete and decrements `athleteCount`
- [x] 403 returned when accessing another coach's athlete
- [x] 400 returned when coach has 25 athletes (soft limit)

## Files to Create/Modify

```
backend/app/
├── models/
│   └── athlete.py             # Athlete Pydantic models
├── repositories/
│   └── athlete.py             # Athlete repository
├── routers/
│   └── athletes.py            # Athlete endpoints
└── main.py                    # Register athletes router (modify)
```

## Implementation Details

### models/athlete.py
```python
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, Literal
from enum import Enum

class ConsentStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    DECLINED = "declined"

class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

class AthleteCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    age: int = Field(..., ge=5, le=13)  # Ages 5-13 based on Jeremy Frisch LTAD benchmarks
    gender: Gender
    parent_email: EmailStr

class AthleteUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    age: Optional[int] = Field(None, ge=5, le=13)
    gender: Optional[Gender] = None
    parent_email: Optional[EmailStr] = None

class Athlete(BaseModel):
    id: str
    coach_id: str
    name: str
    age: int
    gender: Gender
    parent_email: str
    consent_status: ConsentStatus = ConsentStatus.PENDING
    consent_token: str
    consent_token_expires: Optional[datetime] = None  # 30-day expiry
    consent_timestamp: Optional[datetime] = None
    created_at: datetime
    avatar_url: Optional[str] = None

class AthleteResponse(BaseModel):
    id: str
    name: str
    age: int
    gender: str
    parent_email: str
    consent_status: str
    created_at: datetime
    avatar_url: Optional[str] = None
```

### repositories/athlete.py
```python
import uuid
from datetime import datetime, timedelta
from typing import Optional, List
from app.firebase.repository import BaseRepository
from app.models.athlete import Athlete, AthleteCreate, ConsentStatus

class AthleteRepository(BaseRepository[Athlete]):
    def __init__(self):
        super().__init__("athletes", Athlete)

    async def create_for_coach(
        self, coach_id: str, data: AthleteCreate
    ) -> Athlete:
        """Create new athlete for coach"""
        consent_token = str(uuid.uuid4())
        consent_token_expires = datetime.utcnow() + timedelta(days=30)  # 30-day expiry

        athlete_data = {
            "coach_id": coach_id,
            "name": data.name,
            "age": data.age,
            "gender": data.gender.value,
            "parent_email": data.parent_email,
            "consent_status": ConsentStatus.PENDING.value,
            "consent_token": consent_token,
            "consent_token_expires": consent_token_expires,
            "consent_timestamp": None,
            "created_at": datetime.utcnow(),
            "avatar_url": None,
        }

        doc_ref = self.collection.document()
        doc_ref.set(athlete_data)

        return Athlete(id=doc_ref.id, **athlete_data)

    async def get_by_coach(
        self,
        coach_id: str,
        consent_status: Optional[ConsentStatus] = None
    ) -> List[Athlete]:
        """Get all athletes for a coach, optionally filtered by consent status"""
        query = self.collection.where("coach_id", "==", coach_id)

        if consent_status:
            query = query.where("consent_status", "==", consent_status.value)

        docs = query.order_by("created_at", direction="DESCENDING").stream()
        return [Athlete(id=doc.id, **doc.to_dict()) for doc in docs]

    async def get_if_owned(
        self, athlete_id: str, coach_id: str
    ) -> Optional[Athlete]:
        """Get athlete only if owned by coach"""
        athlete = await self.get(athlete_id)
        if athlete and athlete.coach_id == coach_id:
            return athlete
        return None

    async def get_by_consent_token(self, token: str) -> Optional[Athlete]:
        """Get athlete by consent token (for public consent form)"""
        docs = self.collection.where("consent_token", "==", token).limit(1).stream()
        for doc in docs:
            return Athlete(id=doc.id, **doc.to_dict())
        return None
```

### routers/athletes.py
```python
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.athlete import (
    AthleteCreate, AthleteUpdate, AthleteResponse, ConsentStatus
)
from app.repositories.athlete import AthleteRepository
from app.repositories.user import UserRepository

router = APIRouter(prefix="/athletes", tags=["athletes"])

ATHLETE_LIMIT = 25

@router.post("", response_model=AthleteResponse, status_code=status.HTTP_201_CREATED)
async def create_athlete(
    data: AthleteCreate,
    user: User = Depends(get_current_user)
):
    """Create new athlete. Triggers consent email (handled separately)."""
    # Check athlete limit
    if user.athlete_count >= ATHLETE_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum of {ATHLETE_LIMIT} athletes reached"
        )

    athlete_repo = AthleteRepository()
    user_repo = UserRepository()

    athlete = await athlete_repo.create_for_coach(user.id, data)

    # Increment athlete count
    await user_repo.increment_athlete_count(user.id, 1)

    return AthleteResponse(
        id=athlete.id,
        name=athlete.name,
        age=athlete.age,
        gender=athlete.gender.value,
        parent_email=athlete.parent_email,
        consent_status=athlete.consent_status.value,
        created_at=athlete.created_at,
        avatar_url=athlete.avatar_url,
    )

class AthletesListResponse(BaseModel):
    athletes: List[AthleteResponse]
    count: int

@router.get("", response_model=AthletesListResponse)
async def get_athletes(
    status: Optional[ConsentStatus] = Query(None),
    user: User = Depends(get_current_user)
):
    """Get all athletes for authenticated coach"""
    athlete_repo = AthleteRepository()
    athletes = await athlete_repo.get_by_coach(user.id, status)

    athlete_responses = [
        AthleteResponse(
            id=a.id,
            name=a.name,
            age=a.age,
            gender=a.gender.value if hasattr(a.gender, 'value') else a.gender,
            parent_email=a.parent_email,
            consent_status=a.consent_status.value if hasattr(a.consent_status, 'value') else a.consent_status,
            created_at=a.created_at,
            avatar_url=a.avatar_url,
        )
        for a in athletes
    ]

    return AthletesListResponse(athletes=athlete_responses, count=len(athlete_responses))

@router.get("/{athlete_id}", response_model=AthleteResponse)
async def get_athlete(
    athlete_id: str,
    user: User = Depends(get_current_user)
):
    """Get single athlete by ID"""
    athlete_repo = AthleteRepository()
    athlete = await athlete_repo.get_if_owned(athlete_id, user.id)

    if not athlete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete not found"
        )

    return AthleteResponse(
        id=athlete.id,
        name=athlete.name,
        age=athlete.age,
        gender=athlete.gender.value if hasattr(athlete.gender, 'value') else athlete.gender,
        parent_email=athlete.parent_email,
        consent_status=athlete.consent_status.value if hasattr(athlete.consent_status, 'value') else athlete.consent_status,
        created_at=athlete.created_at,
        avatar_url=athlete.avatar_url,
    )

@router.put("/{athlete_id}", response_model=AthleteResponse)
async def update_athlete(
    athlete_id: str,
    data: AthleteUpdate,
    user: User = Depends(get_current_user)
):
    """Update athlete information"""
    athlete_repo = AthleteRepository()
    athlete = await athlete_repo.get_if_owned(athlete_id, user.id)

    if not athlete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete not found"
        )

    update_data = data.model_dump(exclude_unset=True)
    if update_data:
        await athlete_repo.update(athlete_id, update_data)
        # Refresh athlete data
        athlete = await athlete_repo.get(athlete_id)

    return AthleteResponse(
        id=athlete.id,
        name=athlete.name,
        age=athlete.age,
        gender=athlete.gender.value if hasattr(athlete.gender, 'value') else athlete.gender,
        parent_email=athlete.parent_email,
        consent_status=athlete.consent_status.value if hasattr(athlete.consent_status, 'value') else athlete.consent_status,
        created_at=athlete.created_at,
        avatar_url=athlete.avatar_url,
    )

@router.delete("/{athlete_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_athlete(
    athlete_id: str,
    user: User = Depends(get_current_user)
):
    """
    Delete athlete from roster.

    CASCADE DELETE: Also deletes all associated data:
    - Assessments (and their videos/keypoints from Storage)
    - Reports

    This is a destructive operation and cannot be undone.
    """
    athlete_repo = AthleteRepository()
    user_repo = UserRepository()
    assessment_repo = AssessmentRepository()
    report_repo = ReportRepository()

    athlete = await athlete_repo.get_if_owned(athlete_id, user.id)

    if not athlete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete not found"
        )

    # CASCADE DELETE: Delete all assessments for this athlete
    # This also deletes videos and keypoints from Firebase Storage
    assessments = await assessment_repo.get_by_athlete(athlete_id, limit=1000)
    for assessment in assessments:
        await delete_assessment_with_files(assessment)

    # CASCADE DELETE: Delete all reports for this athlete
    reports = await report_repo.get_by_athlete(athlete_id, limit=1000)
    for report in reports:
        await report_repo.delete(report.id)

    # Finally delete the athlete
    await athlete_repo.delete(athlete_id)
    await user_repo.increment_athlete_count(user.id, -1)


async def delete_assessment_with_files(assessment):
    """
    Helper to delete assessment and its associated files from Storage.
    Extracted for reuse from BE-012 delete endpoint.
    """
    from firebase_admin import storage
    assessment_repo = AssessmentRepository()

    # Delete video from Storage
    if assessment.video_path:
        try:
            bucket = storage.bucket()
            video_blob = bucket.blob(assessment.video_path)
            video_blob.delete()
        except Exception as e:
            print(f"Failed to delete video: {e}")  # Log but don't fail

    # Delete keypoints from Storage
    if assessment.raw_keypoints_url:
        try:
            bucket = storage.bucket()
            keypoints_blob = bucket.blob(f"keypoints/{assessment.id}/raw_keypoints.json")
            keypoints_blob.delete()
        except Exception as e:
            print(f"Failed to delete keypoints: {e}")  # Log but don't fail

    # Delete assessment document
    await assessment_repo.delete(assessment.id)
```

## API Specification

### POST /athletes

**Request:**
```json
{
  "name": "John Smith",
  "age": 12,
  "gender": "male",
  "parent_email": "parent@example.com"
}
```

**Response 201:**
```json
{
  "id": "abc123",
  "name": "John Smith",
  "age": 12,
  "gender": "male",
  "parent_email": "parent@example.com",
  "consent_status": "pending",
  "created_at": "2024-01-15T10:30:00Z",
  "avatar_url": null
}
```

### GET /athletes?status=pending

**Response 200:**
```json
{
  "athletes": [
    {
      "id": "abc123",
      "name": "John Smith",
      "age": 12,
      "gender": "male",
      "parent_email": "parent@example.com",
      "consent_status": "pending",
      "created_at": "2024-01-15T10:30:00Z",
      "avatar_url": null
    }
  ],
  "count": 1
}
```

## Firestore Security Rules

```javascript
match /athletes/{athleteId} {
  // Coach can read/write their own athletes
  allow read, write: if request.auth != null &&
    resource.data.coach_id == request.auth.uid;

  // Allow create if user sets coach_id to their own ID
  allow create: if request.auth != null &&
    request.resource.data.coach_id == request.auth.uid;
}
```

## Estimated Complexity
**M** (Medium) - 3-4 hours

## Testing Instructions

1. Create athlete:
```bash
curl -X POST http://localhost:8000/athletes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Athlete", "age": 12, "gender": "male", "parent_email": "parent@test.com"}'
```

2. List athletes:
```bash
curl http://localhost:8000/athletes \
  -H "Authorization: Bearer $TOKEN"
```

3. Filter by status:
```bash
curl "http://localhost:8000/athletes?status=pending" \
  -H "Authorization: Bearer $TOKEN"
```

4. Test ownership:
   - Try to access another coach's athlete ID
   - Should return 404

5. Test limit:
   - Create 25 athletes
   - 26th should return 400 error

## Edit Lock (NOT IMPLEMENTED)

> **Note**: The edit lock feature described in the original PRD was not implemented for MVP. For single-coach usage, concurrent editing conflicts are rare. This may be reconsidered for post-MVP if multi-device editing becomes a user need.
