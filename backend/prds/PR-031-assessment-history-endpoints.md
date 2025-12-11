---
id: BE-031
depends_on: [BE-030]
blocks: [BE-032]
---

# BE-031: Assessment History Query Endpoints

## Scope

**In Scope:**
- GET `/api/assessments/athlete/{athleteId}` - Get all assessments for athlete
- Ordered by date (newest first)
- Include summary statistics

**Out of Scope:**
- Advanced filtering (date ranges, test types)
- Aggregations (handled by agents)

## Technical Decisions

- **Ordering**: Most recent first
- **Authorization**: Verify athlete belongs to coach
- **Response**: List + summary stats

## Acceptance Criteria

- [ ] Returns all assessments for single athlete
- [ ] Verifies coach authorization
- [ ] Ordered chronologically
- [ ] Includes count and date range

## Files to Create/Modify

- `app/api/assessments.py` (modify - add athlete history endpoint)

## Implementation Notes

**app/api/assessments.py** (add endpoint):
```python
@router.get("/athlete/{athlete_id}")
async def get_athlete_assessments(
    athlete_id: str,
    user: dict = Depends(get_current_user)
):
    """Get all assessments for specific athlete"""
    # Verify athlete belongs to coach
    athlete = db.get(Collections.ATHLETES, athlete_id)

    if not athlete or athlete["coachId"] != user["uid"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get assessments
    assessments = db.query(
        Collections.ASSESSMENTS,
        filters=[("athleteId", "==", athlete_id)],
        order_by="createdAt"
    )

    # Calculate summary stats
    summary = {
        "totalAssessments": len(assessments),
        "averageDuration": 0,
        "bestDuration": 0,
        "latestScore": None
    }

    if assessments:
        durations = [a["metrics"]["durationSeconds"] for a in assessments if "metrics" in a]
        if durations:
            summary["averageDuration"] = sum(durations) / len(durations)
            summary["bestDuration"] = max(durations)

        latest = assessments[-1]  # Assuming ordered oldest to newest
        if "metrics" in latest:
            summary["latestScore"] = latest["metrics"].get("durationScore", {}).get("score")

    return {
        "athlete": athlete,
        "assessments": assessments,
        "summary": summary
    }
```

## Testing

Verify returns correct assessments and summary.

## Estimated Complexity

**Size**: S (Small - ~1 hour)
