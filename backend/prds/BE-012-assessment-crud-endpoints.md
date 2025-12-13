---
id: BE-012
depends_on: [BE-006, BE-008, BE-010]
blocks: [BE-013]
---

# BE-012: Assessment CRUD Endpoints

## Title
Implement assessment retrieval, listing, and management endpoints

## Scope

### In Scope
- Get single assessment endpoint
- List assessments by athlete endpoint
- List all assessments for coach (activity feed)
- Update coach notes endpoint
- Delete assessment endpoint
- Polling endpoint for processing status

### Out of Scope
- Analysis endpoint (BE-006)
- Report generation (BE-013)

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Pagination | Cursor-based | Better for activity feeds |
| Polling | Simple GET with status | No WebSockets for MVP |
| Notes | Separate endpoint | Simpler validation |

## Acceptance Criteria

- [ ] `GET /assessments` returns coach's recent assessments
- [ ] `GET /assessments/athlete/{athleteId}` returns athlete's assessments
- [ ] `GET /assessments/{id}` returns single assessment with full details
- [ ] `GET /assessments/{id}` supports polling for processing status
- [ ] `PUT /assessments/{id}/notes` updates coach notes
- [ ] `DELETE /assessments/{id}` removes assessment
- [ ] All endpoints validate coach ownership
- [ ] Pagination supports loading more results

## Files to Create/Modify

```
backend/app/
├── routers/
│   └── assessments.py           # Add CRUD endpoints (modify)
└── models/
    └── assessment.py            # Add list response models (modify)
```

## Implementation Details

### models/assessment.py (additions)
```python
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

class AssessmentListItem(BaseModel):
    """Lightweight assessment for list views"""
    id: str
    athlete_id: str
    athlete_name: str  # Denormalized for display
    test_type: str
    leg_tested: str
    created_at: datetime
    status: str
    duration_seconds: Optional[float] = None
    stability_score: Optional[float] = None

class AssessmentListResponse(BaseModel):
    assessments: List[AssessmentListItem]
    next_cursor: Optional[str] = None
    has_more: bool = False

class AssessmentDetailResponse(BaseModel):
    """
    Response model for single assessment.
    Note: video_url is regenerated on each request (signed URLs expire after 1 hour).
    The internal Assessment model stores video_path; this response returns a fresh signed URL.
    """
    id: str
    athlete_id: str
    athlete_name: str
    athlete_age: int
    test_type: str
    leg_tested: str
    created_at: datetime
    status: str
    video_url: Optional[str] = None  # Freshly signed URL (regenerated per request)
    metrics: Optional[MetricsData] = None
    ai_feedback: Optional[str] = None
    coach_notes: Optional[str] = None

class UpdateNotesRequest(BaseModel):
    notes: str = ""
```

### routers/assessments.py (complete)
```python
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional
from datetime import datetime
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.assessment import (
    AssessmentListItem,
    AssessmentListResponse,
    AssessmentDetailResponse,
    UpdateNotesRequest,
    AnalyzeRequest,
    AnalyzeResponse,
)
from app.repositories.assessment import AssessmentRepository
from app.repositories.athlete import AthleteRepository

router = APIRouter(prefix="/assessments", tags=["assessments"])

# ... existing analyze endpoint from BE-006 ...

@router.get("", response_model=AssessmentListResponse)
async def list_assessments(
    limit: int = Query(20, ge=1, le=50),
    cursor: Optional[str] = Query(None),
    user: User = Depends(get_current_user)
):
    """
    List all assessments for authenticated coach (activity feed).
    Ordered by most recent first.
    """
    assessment_repo = AssessmentRepository()
    athlete_repo = AthleteRepository()

    # Get assessments
    assessments = await assessment_repo.get_by_coach(user.id, limit=limit + 1)

    # Check if there are more results
    has_more = len(assessments) > limit
    if has_more:
        assessments = assessments[:limit]

    # Get athlete names for display
    athlete_names = {}
    for assessment in assessments:
        if assessment.athlete_id not in athlete_names:
            athlete = await athlete_repo.get(assessment.athlete_id)
            athlete_names[assessment.athlete_id] = athlete.name if athlete else "Unknown"

    # Build response
    items = [
        AssessmentListItem(
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

    next_cursor = None
    if has_more and assessments:
        next_cursor = assessments[-1].id

    return AssessmentListResponse(
        assessments=items,
        next_cursor=next_cursor,
        has_more=has_more,
    )

@router.get("/athlete/{athlete_id}", response_model=AssessmentListResponse)
async def list_athlete_assessments(
    athlete_id: str,
    limit: int = Query(20, ge=1, le=50),
    user: User = Depends(get_current_user)
):
    """
    List assessments for a specific athlete.
    """
    athlete_repo = AthleteRepository()
    assessment_repo = AssessmentRepository()

    # Validate athlete ownership
    athlete = await athlete_repo.get_if_owned(athlete_id, user.id)
    if not athlete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete not found"
        )

    # Get assessments
    assessments = await assessment_repo.get_by_athlete(athlete_id, limit=limit)

    items = [
        AssessmentListItem(
            id=a.id,
            athlete_id=a.athlete_id,
            athlete_name=athlete.name,
            test_type=a.test_type.value if hasattr(a.test_type, 'value') else a.test_type,
            leg_tested=a.leg_tested.value if hasattr(a.leg_tested, 'value') else a.leg_tested,
            created_at=a.created_at,
            status=a.status.value if hasattr(a.status, 'value') else a.status,
            duration_seconds=a.metrics.duration_seconds if a.metrics else None,
            stability_score=a.metrics.stability_score if a.metrics else None,
        )
        for a in assessments
    ]

    return AssessmentListResponse(
        assessments=items,
        next_cursor=None,
        has_more=False,
    )

@router.get("/{assessment_id}", response_model=AssessmentDetailResponse)
async def get_assessment(
    assessment_id: str,
    user: User = Depends(get_current_user)
):
    """
    Get single assessment with full details.
    Also used for polling during processing.
    """
    assessment_repo = AssessmentRepository()
    athlete_repo = AthleteRepository()

    # Get assessment
    assessment = await assessment_repo.get(assessment_id)
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )

    # Validate ownership
    if assessment.coach_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    # Get athlete info
    athlete = await athlete_repo.get(assessment.athlete_id)
    if not athlete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete not found"
        )

    # Regenerate video signed URL if video exists (URLs expire after 1 hour)
    # This ensures returning to an old assessment shows playable video
    # See BE-006 generate_signed_url() for implementation
    video_url = None
    if assessment.video_path:
        from app.services.video import generate_signed_url
        video_url = generate_signed_url(assessment.video_path, expiration_hours=1)

    return AssessmentDetailResponse(
        id=assessment.id,
        athlete_id=assessment.athlete_id,
        athlete_name=athlete.name,
        athlete_age=athlete.age,
        test_type=assessment.test_type.value if hasattr(assessment.test_type, 'value') else assessment.test_type,
        leg_tested=assessment.leg_tested.value if hasattr(assessment.leg_tested, 'value') else assessment.leg_tested,
        created_at=assessment.created_at,
        status=assessment.status.value if hasattr(assessment.status, 'value') else assessment.status,
        video_url=video_url,  # Freshly signed URL, always playable
        metrics=assessment.metrics,
        ai_feedback=assessment.ai_feedback,
        coach_notes=assessment.coach_notes,
    )

@router.put("/{assessment_id}/notes")
async def update_notes(
    assessment_id: str,
    data: UpdateNotesRequest,
    user: User = Depends(get_current_user)
):
    """
    Update coach notes for an assessment.
    """
    assessment_repo = AssessmentRepository()

    # Get assessment
    assessment = await assessment_repo.get(assessment_id)
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )

    # Validate ownership
    if assessment.coach_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    # Update notes
    await assessment_repo.update(assessment_id, {"coach_notes": data.notes})

    return {"message": "Notes updated"}

@router.delete("/{assessment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assessment(
    assessment_id: str,
    user: User = Depends(get_current_user)
):
    """
    Delete an assessment.
    """
    assessment_repo = AssessmentRepository()

    # Get assessment
    assessment = await assessment_repo.get(assessment_id)
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )

    # Validate ownership
    if assessment.coach_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    # Delete video and keypoints from storage
    from firebase_admin import storage

    if assessment.video_url:
        try:
            bucket = storage.bucket()
            # Extract blob path from URL
            video_path = assessment.video_url.split("/")[-1]
            video_blob = bucket.blob(f"videos/{video_path}")
            video_blob.delete()
        except Exception as e:
            print(f"Failed to delete video: {e}")  # Log but don't fail

    if assessment.raw_keypoints_url:
        try:
            bucket = storage.bucket()
            keypoints_blob = bucket.blob(f"assessments/{assessment_id}/raw_keypoints.json")
            keypoints_blob.delete()
        except Exception as e:
            print(f"Failed to delete keypoints: {e}")  # Log but don't fail

    # Delete assessment document
    await assessment_repo.delete(assessment_id)
```

## API Specification

### GET /assessments

**Query Parameters:**
- `limit` (int, 1-50, default 20)
- `cursor` (string, optional)

**Response 200:**
```json
{
  "assessments": [
    {
      "id": "abc123",
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
  "next_cursor": "xyz789",
  "has_more": true
}
```

### GET /assessments/{id}

**Response 200:**
```json
{
  "id": "abc123",
  "athlete_id": "athlete_456",
  "athlete_name": "John Smith",
  "athlete_age": 12,
  "test_type": "one_leg_balance",
  "leg_tested": "left",
  "created_at": "2024-01-15T10:30:00Z",
  "status": "completed",
  "video_url": "https://storage.googleapis.com/...",
  "metrics": {
    "duration_seconds": 18.5,
    "stability_score": 75.2,
    "sway_std_x": 1.23,
    "sway_std_y": 0.98,
    "sway_path_length": 45.6,
    "sway_velocity": 2.46,
    "arm_excursion_left": 15.2,
    "arm_excursion_right": 12.8,
    "arm_asymmetry_ratio": 1.19,
    "corrections_count": 3,
    "failure_reason": "time_complete"
  },
  "ai_feedback": "**Score Summary**\nJohn achieved...",
  "coach_notes": "Good focus today"
}
```

### PUT /assessments/{id}/notes

**Request:**
```json
{
  "notes": "Showed great improvement. Need to work on arm control."
}
```

**Response 200:**
```json
{
  "message": "Notes updated"
}
```

## Estimated Complexity
**S** (Small) - 3 hours

## Testing Instructions

1. List all assessments:
```bash
curl http://localhost:8000/assessments \
  -H "Authorization: Bearer $TOKEN"
```

2. List athlete assessments:
```bash
curl http://localhost:8000/assessments/athlete/athlete_123 \
  -H "Authorization: Bearer $TOKEN"
```

3. Get single assessment:
```bash
curl http://localhost:8000/assessments/assessment_456 \
  -H "Authorization: Bearer $TOKEN"
```

4. Poll for processing status:
```bash
# Same endpoint, check status field
curl http://localhost:8000/assessments/assessment_456 \
  -H "Authorization: Bearer $TOKEN"
# Returns status: "processing" or "completed" or "failed"
```

5. Update notes:
```bash
curl -X PUT http://localhost:8000/assessments/assessment_456/notes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Great session!"}'
```

6. Delete assessment:
```bash
curl -X DELETE http://localhost:8000/assessments/assessment_456 \
  -H "Authorization: Bearer $TOKEN"
```

## Notes
- Activity feed shows assessments across all athletes
- Team ranking recalculated on each detail request
- Consider caching team rankings for performance
- Video and keypoints are deleted from Firebase Storage when assessment is deleted
