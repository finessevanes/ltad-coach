---
id: BE-030
depends_on: [BE-029, BE-006]
blocks: [BE-031]
---

# BE-030: Assessment CRUD Endpoints

## Scope

**In Scope:**
- GET `/api/assessments` - List all assessments for coach
- GET `/api/assessments/{id}` - Get single assessment
- PUT `/api/assessments/{id}/notes` - Update coach notes
- DELETE `/api/assessments/{id}` - Delete assessment

**Out of Scope:**
- Assessment creation (BE-029 - analyze endpoint)
- History queries (BE-031)

## Technical Decisions

- **Authorization**: Filter by coach ID
- **Ordering**: Most recent first
- **Pagination**: Limit 50 per page (optional for MVP)
- **Soft Delete**: Keep video/data, just remove document

## Acceptance Criteria

- [ ] List returns assessments for authenticated coach only
- [ ] Get returns single assessment with full details
- [ ] Update notes works correctly
- [ ] Delete removes assessment document
- [ ] Cannot access other coach's assessments

## Files to Create/Modify

- `app/api/assessments.py` (modify - add CRUD endpoints)

## Implementation Notes

**app/api/assessments.py** (add endpoints):
```python
from pydantic import BaseModel

class UpdateNotesRequest(BaseModel):
    notes: str

@router.get("")
async def list_assessments(
    user: dict = Depends(get_current_user),
    limit: int = 50
):
    """Get all assessments for authenticated coach"""
    assessments = db.query(
        Collections.ASSESSMENTS,
        filters=[("coachId", "==", user["uid"])],
        order_by="createdAt",
        limit=limit
    )

    # Optionally enrich with athlete names
    for assessment in assessments:
        athlete = db.get(Collections.ATHLETES, assessment["athleteId"])
        if athlete:
            assessment["athleteName"] = athlete["name"]

    return {"assessments": assessments}

@router.get("/{assessment_id}")
async def get_assessment(
    assessment_id: str,
    user: dict = Depends(get_current_user)
):
    """Get single assessment"""
    assessment = db.get(Collections.ASSESSMENTS, assessment_id)

    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    if assessment["coachId"] != user["uid"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Enrich with athlete data
    athlete = db.get(Collections.ATHLETES, assessment["athleteId"])
    if athlete:
        assessment["athlete"] = athlete

    return assessment

@router.put("/{assessment_id}/notes")
async def update_notes(
    assessment_id: str,
    request: UpdateNotesRequest,
    user: dict = Depends(get_current_user)
):
    """Update coach notes on assessment"""
    assessment = db.get(Collections.ASSESSMENTS, assessment_id)

    if not assessment or assessment["coachId"] != user["uid"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.update(Collections.ASSESSMENTS, assessment_id, {
        "coachNotes": request.notes
    })

    return {"message": "Notes updated"}

@router.delete("/{assessment_id}")
async def delete_assessment(
    assessment_id: str,
    user: dict = Depends(get_current_user)
):
    """Delete assessment"""
    assessment = db.get(Collections.ASSESSMENTS, assessment_id)

    if not assessment or assessment["coachId"] != user["uid"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Optionally delete video and keypoints from storage
    # For MVP, keep files (storage is cheap)

    db.delete(Collections.ASSESSMENTS, assessment_id)

    return {"message": "Assessment deleted"}
```

## Testing

Test with authenticated requests.

## Estimated Complexity

**Size**: M (Medium - ~2 hours)
