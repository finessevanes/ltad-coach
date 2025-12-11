COMPLETED

---
id: BE-010
depends_on: [BE-009, BE-007]
blocks: [BE-011]
---

# BE-010: Consent Email Trigger

## Scope

**In Scope:**
- Trigger consent email when athlete is created
- POST `/api/athletes/{id}/resend-consent` endpoint
- Email includes consent form URL with token

**Out of Scope:**
- Consent form endpoints (BE-011)
- Consent form UI (frontend)

## Technical Decisions

- **Email Trigger**: Automatic on athlete creation
- **Consent URL**: `{FRONTEND_URL}/consent/{token}`
- **Token**: Already generated in BE-009
- **Integration**: Modify BE-009 create endpoint

## Acceptance Criteria

- [ ] Email sent automatically when athlete created
- [ ] Email contains clickable consent URL
- [ ] Resend endpoint works for pending consents
- [ ] Cannot resend if already consented
- [ ] Email failures are logged but don't block athlete creation

## Files to Create/Modify

- `app/api/athletes.py` (modify - add email trigger and resend endpoint)

## Implementation Notes

**app/api/athletes.py** (modify create_athlete):
```python
from app.services.email import email_service
from app.core.config import settings

@router.post("", response_model=Athlete)
async def create_athlete(
    athlete: AthleteCreate,
    user: dict = Depends(get_current_user)
):
    """Create new athlete and send consent email"""
    # ... existing creation logic ...

    athlete_id = db.create(Collections.ATHLETES, athlete_data)
    athlete_data["id"] = athlete_id

    # Send consent email
    consent_url = f"{settings.frontend_url}/consent/{consent_token}"

    try:
        email_service.send_consent_request(
            parent_email=athlete.parentEmail,
            athlete_name=athlete.name,
            consent_url=consent_url
        )
    except Exception as e:
        # Log error but don't fail athlete creation
        print(f"Failed to send consent email: {e}")

    return Athlete(**athlete_data)

@router.post("/{athlete_id}/resend-consent")
async def resend_consent(athlete_id: str, user: dict = Depends(get_current_user)):
    """Resend consent email"""
    athlete = db.get(Collections.ATHLETES, athlete_id)

    if not athlete or athlete["coachId"] != user["uid"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    if athlete["consentStatus"] != "pending":
        raise HTTPException(
            status_code=400,
            detail="Consent already provided or declined"
        )

    consent_url = f"{settings.frontend_url}/consent/{athlete['consentToken']}"

    success = email_service.send_consent_request(
        parent_email=athlete["parentEmail"],
        athlete_name=athlete["name"],
        consent_url=consent_url
    )

    if not success:
        raise HTTPException(status_code=500, detail="Failed to send email")

    return {"message": "Consent email sent"}
```

## Testing

```bash
# Create athlete - should send email
curl -X POST http://localhost:8000/api/athletes \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Athlete",
    "age": 12,
    "gender": "male",
    "parentEmail": "parent@example.com"
  }'

# Resend consent
curl -X POST http://localhost:8000/api/athletes/{id}/resend-consent \
  -H "Authorization: Bearer <token>"
```

## Estimated Complexity

**Size**: S (Small - ~1 hour)
