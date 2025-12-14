---
id: BE-015
depends_on: [BE-004, BE-012]
blocks: []
---

# BE-015: Dashboard Endpoint

## Title
Implement dedicated dashboard endpoint for coach overview data

## Scope

### In Scope
- Dashboard data endpoint combining stats, recent activity, and pending alerts
- Efficient single-request data fetching
- Coach-specific aggregations

### Out of Scope
- Advanced analytics
- Charts/graphs data
- Historical trends

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Endpoint | Single GET /dashboard | Reduces frontend API calls |
| Stats | Real-time counts | MVP simplicity |
| Recent Items | Last 10 | Quick overview |

## Acceptance Criteria

- [ ] `GET /dashboard` returns combined dashboard data
- [ ] Stats include total athletes, active athletes, pending consent count, total assessments
- [ ] Recent assessments limited to last 10
- [ ] Pending athletes list includes only those with pending consent
- [ ] All data scoped to authenticated coach
- [ ] Response time under 500ms

## Files to Create/Modify

```
backend/app/
├── routers/
│   └── dashboard.py            # Dashboard endpoint
├── models/
│   └── dashboard.py            # Dashboard response models
└── main.py                     # Register dashboard router (modify)
```

## Implementation Details

### models/dashboard.py
```python
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class DashboardStats(BaseModel):
    total_athletes: int
    active_athletes: int
    pending_consent: int
    total_assessments: int

class RecentAssessmentItem(BaseModel):
    id: str
    athlete_id: str
    athlete_name: str
    test_type: str
    leg_tested: str
    created_at: datetime
    status: str
    duration_seconds: Optional[float] = None
    stability_score: Optional[float] = None

class PendingAthleteItem(BaseModel):
    id: str
    name: str
    age: int
    gender: str
    parent_email: str
    consent_status: str
    created_at: datetime

class DashboardResponse(BaseModel):
    stats: DashboardStats
    recent_assessments: List[RecentAssessmentItem]
    pending_athletes: List[PendingAthleteItem]
```

### routers/dashboard.py
```python
from fastapi import APIRouter, Depends
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.dashboard import (
    DashboardResponse,
    DashboardStats,
    RecentAssessmentItem,
    PendingAthleteItem,
)
from app.repositories.athlete import AthleteRepository
from app.repositories.assessment import AssessmentRepository

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("", response_model=DashboardResponse)
async def get_dashboard(user: User = Depends(get_current_user)):
    """
    Get dashboard data for authenticated coach.
    Returns stats, recent assessments, and pending consent athletes.
    """
    athlete_repo = AthleteRepository()
    assessment_repo = AssessmentRepository()

    # Get all athletes for coach
    athletes = await athlete_repo.get_by_coach(user.id)

    # Calculate stats
    active_athletes = [a for a in athletes if a.consent_status == "active"]
    pending_athletes = [a for a in athletes if a.consent_status == "pending"]

    # Get recent assessments (last 10)
    assessments = await assessment_repo.get_by_coach(user.id, limit=10)

    # Build athlete name lookup
    athlete_names = {a.id: a.name for a in athletes}

    # Get total assessment count
    total_assessments = await assessment_repo.count_by_coach(user.id)

    stats = DashboardStats(
        total_athletes=len(athletes),
        active_athletes=len(active_athletes),
        pending_consent=len(pending_athletes),
        total_assessments=total_assessments,
    )

    recent_items = [
        RecentAssessmentItem(
            id=a.id,
            athlete_id=a.athlete_id,
            athlete_name=athlete_names.get(a.athlete_id, "Unknown"),
            test_type=a.test_type.value if hasattr(a.test_type, 'value') else a.test_type,
            leg_tested=a.leg_tested.value if hasattr(a.leg_tested, 'value') else a.leg_tested,
            created_at=a.created_at,
            status=a.status.value if hasattr(a.status, 'value') else a.status,
            duration_seconds=a.metrics.duration_seconds if a.metrics else None,
            stability_score=a.metrics.stability_score if a.metrics else None,
        )
        for a in assessments
    ]

    pending_items = [
        PendingAthleteItem(
            id=a.id,
            name=a.name,
            age=a.age,
            gender=a.gender.value if hasattr(a.gender, 'value') else a.gender,
            parent_email=a.parent_email,
            consent_status=a.consent_status.value if hasattr(a.consent_status, 'value') else a.consent_status,
            created_at=a.created_at,
        )
        for a in pending_athletes
    ]

    return DashboardResponse(
        stats=stats,
        recent_assessments=recent_items,
        pending_athletes=pending_items,
    )
```

### Repository Addition (repositories/assessment.py)
```python
# Add to AssessmentRepository class:

async def count_by_coach(self, coach_id: str) -> int:
    """Count total assessments for a coach"""
    # Note: Firestore doesn't have a native count() for MVP
    # For scalability, consider using an aggregation counter
    docs = self.collection.where("coach_id", "==", coach_id).stream()
    return sum(1 for _ in docs)
```

### main.py Addition
```python
from app.routers import dashboard

app.include_router(dashboard.router)
```

## API Specification

### GET /dashboard

**Response 200:**
```json
{
  "stats": {
    "total_athletes": 12,
    "active_athletes": 10,
    "pending_consent": 2,
    "total_assessments": 45
  },
  "recent_assessments": [
    {
      "id": "assessment_123",
      "athlete_id": "athlete_456",
      "athlete_name": "John Smith",
      "test_type": "one_leg_balance",
      "leg_tested": "left",
      "created_at": "2024-01-15T10:30:00Z",
      "status": "completed",
      "duration_seconds": 18.5,
      "stability_score": 75.2
    }
  ],
  "pending_athletes": [
    {
      "id": "athlete_789",
      "name": "Jane Doe",
      "age": 12,
      "gender": "female",
      "parent_email": "parent@example.com",
      "consent_status": "pending",
      "created_at": "2024-01-14T09:00:00Z"
    }
  ]
}
```

## Estimated Complexity
**S** (Small) - 2 hours

## Testing Instructions

1. Get dashboard data:
```bash
curl http://localhost:8000/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

2. Verify stats match actual counts
3. Verify recent assessments are ordered by date (newest first)
4. Verify only pending consent athletes are in pending list
5. Verify response time is under 500ms

## Notes
- Consider caching stats for coaches with many athletes
- Assessment count may need optimization for large datasets
- All data is coach-scoped via authentication
