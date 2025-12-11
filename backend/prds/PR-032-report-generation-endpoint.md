COMPLETED

---
id: BE-032
depends_on: [BE-028, BE-031]
blocks: [BE-033]
---

# BE-032: Report Generation Endpoint

## Scope

**In Scope:**
- POST `/api/reports/generate/{athleteId}` - Generate parent report preview
- Use Progress Agent
- Return report content (not yet sent)

**Out of Scope:**
- Report sending/email (BE-034)
- PIN generation (BE-033)

## Technical Decisions

- **Agent**: Progress Agent (BE-028)
- **Input**: Athlete history + current assessment
- **Output**: Report content preview
- **Storage**: Not saved until sent (BE-033)

## Acceptance Criteria

- [ ] Generates report using Progress Agent
- [ ] Returns preview content
- [ ] Verifies coach authorization
- [ ] Handles no-assessment case gracefully

## Files to Create/Modify

- `app/api/reports.py` (create)
- `app/main.py` (modify - include router)

## Implementation Notes

**app/api/reports.py**:
```python
from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user
from app.services.database import db, Collections
from app.services.agents.progress_agent import progress_agent
from app.services.scoring import scoring_service

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.post("/generate/{athlete_id}")
async def generate_report(
    athlete_id: str,
    user: dict = Depends(get_current_user)
):
    """Generate parent report preview"""
    # Verify athlete
    athlete = db.get(Collections.ATHLETES, athlete_id)

    if not athlete or athlete["coachId"] != user["uid"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get assessments
    assessments = db.query(
        Collections.ASSESSMENTS,
        filters=[("athleteId", "==", athlete_id)],
        order_by="createdAt"
    )

    if not assessments:
        raise HTTPException(status_code=400, detail="No assessments available")

    # Get latest assessment
    current = assessments[-1]
    historical = assessments[:-1] if len(assessments) > 1 else []

    # Get scores
    metrics = current["metrics"]
    team_rank = scoring_service.calculate_team_rank(
        metrics["stabilityScore"],
        user["uid"]
    )

    percentile = metrics.get("percentile", 50)

    # Generate report
    report_content = progress_agent.generate_report(
        current_metrics=metrics,
        historical_assessments=historical,
        athlete_name=athlete["name"],
        athlete_age=athlete["age"],
        team_rank=team_rank,
        national_percentile=percentile
    )

    return {
        "reportContent": report_content,
        "athleteName": athlete["name"],
        "parentEmail": athlete["parentEmail"]
    }
```

**app/main.py** (add):
```python
from app.api import reports

app.include_router(reports.router)
```

## Testing

Test report generation with various athlete histories.

## Estimated Complexity

**Size**: M (Medium - ~2 hours)
