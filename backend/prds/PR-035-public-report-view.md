---
id: BE-035
depends_on: [BE-033]
blocks: []
---

# BE-035: Public Report View Endpoints

## Scope

**In Scope:**
- POST `/api/reports/view/{id}/verify` - Verify PIN
- GET `/api/reports/view/{id}` - Get report content (after PIN verify)

**Out of Scope:**
- Report generation
- Email sending

## Technical Decisions

- **Security**: PIN required for access (no auth)
- **Session**: Simple PIN verification per request (stateless)
- **Public**: No authentication needed

## Acceptance Criteria

- [ ] Verify PIN matches report
- [ ] Return report content on success
- [ ] Return 401 on incorrect PIN
- [ ] Public endpoints (no auth)

## Files to Create/Modify

- `app/api/reports.py` (modify - add public endpoints)

## Implementation Notes

**app/api/reports.py** (add endpoints):
```python
from pydantic import BaseModel

class VerifyPinRequest(BaseModel):
    pin: str

@router.post("/view/{report_id}/verify")
async def verify_pin(report_id: str, request: VerifyPinRequest):
    """Verify PIN for report access (public endpoint)"""
    report = db.get(Collections.PARENT_REPORTS, report_id)

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if report["accessPin"] != request.pin:
        raise HTTPException(status_code=401, detail="Invalid PIN")

    # Get athlete name for display
    athlete = db.get(Collections.ATHLETES, report["athleteId"])

    return {
        "verified": True,
        "athleteName": athlete["name"] if athlete else "Athlete"
    }

@router.get("/view/{report_id}")
async def get_report(report_id: str, pin: str):
    """
    Get report content (public endpoint)

    Requires PIN as query parameter
    """
    report = db.get(Collections.PARENT_REPORTS, report_id)

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if report["accessPin"] != pin:
        raise HTTPException(status_code=401, detail="Invalid PIN")

    # Get athlete
    athlete = db.get(Collections.ATHLETES, report["athleteId"])

    return {
        "reportContent": report["reportContent"],
        "athleteName": athlete["name"] if athlete else "Athlete",
        "createdAt": report.get("createdAt"),
        "sentAt": report.get("sentAt")
    }
```

## Testing

Test PIN verification and content retrieval.

## Estimated Complexity

**Size**: S (Small - ~1 hour)
