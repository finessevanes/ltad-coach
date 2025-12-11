COMPLETED

---
id: BE-009
depends_on: [BE-006, BE-004]
blocks: [BE-010, BE-029, BE-031]
---

# BE-009: Athlete CRUD Endpoints

## Scope

**In Scope:**
- GET `/api/athletes` - List all athletes for coach
- POST `/api/athletes` - Create new athlete
- GET `/api/athletes/{id}` - Get single athlete
- PUT `/api/athletes/{id}` - Update athlete
- DELETE `/api/athletes/{id}` - Delete athlete
- Enforce 25 athlete limit per coach

**Out of Scope:**
- Consent workflow (BE-010)
- Assessment retrieval (BE-031)

## Technical Decisions

- **Authorization**: Athletes belong to coach (filter by coachId)
- **Soft Limit**: 25 athletes per coach (configurable)
- **Default Status**: New athletes start with `consentStatus: 'pending'`
- **Validation**: Pydantic models for request/response

## Acceptance Criteria

- [ ] All CRUD operations work correctly
- [ ] Athletes filtered by authenticated coach ID
- [ ] Cannot create >25 athletes (returns 400)
- [ ] Cannot access other coach's athletes (returns 403)
- [ ] Deleting athlete doesn't cascade to assessments (soft delete via query)
- [ ] Input validation on all fields

## Files to Create/Modify

- `app/api/athletes.py` (create)
- `app/models/athlete.py` (create)
- `app/main.py` (modify - include router)

## Implementation Notes

**app/models/athlete.py**:
```python
from pydantic import BaseModel, EmailStr
from typing import Optional, Literal
from app.models.base import FirestoreDocument

class AthleteCreate(BaseModel):
    name: str
    age: int
    gender: Literal['male', 'female', 'other']
    parentEmail: EmailStr

class AthleteUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[Literal['male', 'female', 'other']] = None
    parentEmail: Optional[EmailStr] = None

class Athlete(FirestoreDocument):
    coachId: str
    name: str
    age: int
    gender: str
    parentEmail: str
    consentStatus: Literal['pending', 'active', 'declined'] = 'pending'
    consentToken: Optional[str] = None
    consentTimestamp: Optional[str] = None
    avatarUrl: Optional[str] = None
```

**app/api/athletes.py**:
```python
from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user
from app.services.database import db, Collections
from app.models.athlete import Athlete, AthleteCreate, AthleteUpdate
from typing import List
import secrets

router = APIRouter(prefix="/api/athletes", tags=["Athletes"])

MAX_ATHLETES_PER_COACH = 25

@router.get("", response_model=List[Athlete])
async def list_athletes(user: dict = Depends(get_current_user)):
    """Get all athletes for authenticated coach"""
    athletes = db.query(
        Collections.ATHLETES,
        filters=[("coachId", "==", user["uid"])],
        order_by="createdAt"
    )
    return athletes

@router.post("", response_model=Athlete)
async def create_athlete(
    athlete: AthleteCreate,
    user: dict = Depends(get_current_user)
):
    """Create new athlete"""
    # Check athlete limit
    coach_data = db.get(Collections.USERS, user["uid"])
    if coach_data and coach_data.get("athleteCount", 0) >= MAX_ATHLETES_PER_COACH:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {MAX_ATHLETES_PER_COACH} athletes per coach"
        )

    # Generate consent token
    consent_token = secrets.token_urlsafe(32)

    athlete_data = {
        **athlete.model_dump(),
        "coachId": user["uid"],
        "consentStatus": "pending",
        "consentToken": consent_token,
        "consentTimestamp": None,
        "avatarUrl": None
    }

    athlete_id = db.create(Collections.ATHLETES, athlete_data)

    # Increment coach athlete count
    db.update(Collections.USERS, user["uid"], {
        "athleteCount": (coach_data.get("athleteCount", 0) + 1)
    })

    # Note: Consent email sent in BE-010
    athlete_data["id"] = athlete_id
    return Athlete(**athlete_data)

@router.get("/{athlete_id}", response_model=Athlete)
async def get_athlete(athlete_id: str, user: dict = Depends(get_current_user)):
    """Get single athlete"""
    athlete = db.get(Collections.ATHLETES, athlete_id)

    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")

    if athlete["coachId"] != user["uid"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    return Athlete(**athlete)

@router.put("/{athlete_id}", response_model=Athlete)
async def update_athlete(
    athlete_id: str,
    athlete_update: AthleteUpdate,
    user: dict = Depends(get_current_user)
):
    """Update athlete"""
    athlete = db.get(Collections.ATHLETES, athlete_id)

    if not athlete or athlete["coachId"] != user["uid"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = athlete_update.model_dump(exclude_unset=True)
    if update_data:
        db.update(Collections.ATHLETES, athlete_id, update_data)
        athlete.update(update_data)

    return Athlete(**athlete)

@router.delete("/{athlete_id}")
async def delete_athlete(athlete_id: str, user: dict = Depends(get_current_user)):
    """Delete athlete"""
    athlete = db.get(Collections.ATHLETES, athlete_id)

    if not athlete or athlete["coachId"] != user["uid"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(Collections.ATHLETES, athlete_id)

    # Decrement coach athlete count
    coach_data = db.get(Collections.USERS, user["uid"])
    db.update(Collections.USERS, user["uid"], {
        "athleteCount": max(0, coach_data.get("athleteCount", 1) - 1)
    })

    return {"message": "Athlete deleted"}
```

**app/main.py** (add):
```python
from app.api import athletes

app.include_router(athletes.router)
```

## Testing

Test with authenticated requests (use token from BE-008).

## Estimated Complexity

**Size**: M (Medium - ~3 hours)
