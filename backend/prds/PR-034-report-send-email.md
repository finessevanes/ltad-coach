---
id: BE-034
depends_on: [BE-033, BE-007]
blocks: []
---

# BE-034: Report Send Email Endpoint

## Scope

**In Scope:**
- POST `/api/reports/{id}/send` - Send report email
- Update sentAt timestamp
- Send email with link + PIN

**Out of Scope:**
- Report generation (BE-032)
- PIN storage (BE-033)

## Technical Decisions

- **Email Service**: Resend (BE-007)
- **Link Format**: `{FRONTEND_URL}/report/{reportId}`
- **Email Content**: Link + PIN + athlete name

## Acceptance Criteria

- [ ] Sends email to parent
- [ ] Updates sentAt timestamp
- [ ] Returns confirmation
- [ ] Handles email failures gracefully

## Files to Create/Modify

- `app/api/reports.py` (modify - add send endpoint)

## Implementation Notes

**app/api/reports.py** (add endpoint):
```python
from app.services.email import email_service
from app.core.config import settings

@router.post("/{report_id}/send")
async def send_report(
    report_id: str,
    user: dict = Depends(get_current_user)
):
    """Send parent report via email"""
    # Get report
    report = db.get(Collections.PARENT_REPORTS, report_id)

    if not report or report["coachId"] != user["uid"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get athlete
    athlete = db.get(Collections.ATHLETES, report["athleteId"])

    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")

    # Send email
    report_url = f"{settings.frontend_url}/report/{report_id}"

    success = email_service.send_parent_report(
        parent_email=athlete["parentEmail"],
        athlete_name=athlete["name"],
        report_url=report_url,
        access_pin=report["accessPin"]
    )

    if not success:
        raise HTTPException(status_code=500, detail="Failed to send email")

    # Update sentAt
    db.update(Collections.PARENT_REPORTS, report_id, {
        "sentAt": datetime.utcnow().isoformat()
    })

    return {
        "message": "Report sent successfully",
        "sentTo": athlete["parentEmail"]
    }
```

## Testing

Verify email sent and timestamp updated.

## Estimated Complexity

**Size**: S (Small - ~1 hour)
