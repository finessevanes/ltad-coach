---
id: BE-011
depends_on: [BE-010, BE-004]
blocks: []
---

# BE-011: Consent Form Endpoints (Public)

## Scope

**In Scope:**
- GET `/api/consent/{token}` - Get consent form data (public)
- POST `/api/consent/{token}/sign` - Submit consent (public)
- Send confirmation email to coach

**Out of Scope:**
- Consent form UI (frontend)
- Legal language content (provided by frontend)

## Technical Decisions

- **Public Endpoints**: No authentication required (token-based access)
- **Token Validation**: Check token exists and status is 'pending'
- **Status Update**: Change `consentStatus` to 'active' on sign
- **Timestamp**: Record `consentTimestamp` on sign

## Acceptance Criteria

- [ ] GET returns athlete name and parent email (not full athlete data)
- [ ] GET returns 404 if token invalid
- [ ] GET returns 400 if already signed
- [ ] POST updates athlete status to 'active'
- [ ] POST records timestamp
- [ ] POST sends confirmation email to coach
- [ ] POST is idempotent (can't sign twice)

## Files to Create/Modify

- `app/api/consent.py` (create)
- `app/main.py` (modify - include router)

## Implementation Notes

**app/api/consent.py**:
```python
from fastapi import APIRouter, HTTPException
from app.services.database import db, Collections
from app.services.email import email_service
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/consent", tags=["Consent"])

class ConsentResponse(BaseModel):
    athleteName: str
    parentEmail: str
    coachName: str
    consentStatus: str

@router.get("/{token}", response_model=ConsentResponse)
async def get_consent_form(token: str):
    """Get consent form details (public endpoint)"""
    # Find athlete by consent token
    athletes = db.query(
        Collections.ATHLETES,
        filters=[("consentToken", "==", token)]
    )

    if not athletes:
        raise HTTPException(status_code=404, detail="Invalid consent link")

    athlete = athletes[0]

    if athlete["consentStatus"] != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"Consent already {athlete['consentStatus']}"
        )

    # Get coach name
    coach = db.get(Collections.USERS, athlete["coachId"])

    return ConsentResponse(
        athleteName=athlete["name"],
        parentEmail=athlete["parentEmail"],
        coachName=coach.get("name", "Your coach") if coach else "Your coach",
        consentStatus=athlete["consentStatus"]
    )

@router.post("/{token}/sign")
async def sign_consent(token: str):
    """Submit signed consent (public endpoint)"""
    athletes = db.query(
        Collections.ATHLETES,
        filters=[("consentToken", "==", token)]
    )

    if not athletes:
        raise HTTPException(status_code=404, detail="Invalid consent link")

    athlete = athletes[0]

    if athlete["consentStatus"] != "pending":
        # Idempotent - return success if already signed
        if athlete["consentStatus"] == "active":
            return {"message": "Consent already provided"}
        raise HTTPException(status_code=400, detail="Consent was declined")

    # Update athlete status
    db.update(Collections.ATHLETES, athlete["id"], {
        "consentStatus": "active",
        "consentTimestamp": datetime.utcnow().isoformat()
    })

    # Send confirmation email to coach
    coach = db.get(Collections.USERS, athlete["coachId"])
    if coach:
        try:
            email_service.send_consent_confirmed(
                coach_email=coach["email"],
                athlete_name=athlete["name"]
            )
        except Exception as e:
            print(f"Failed to send coach notification: {e}")

    return {"message": "Consent provided successfully"}
```

**app/main.py** (add):
```python
from app.api import consent

app.include_router(consent.router)
```

## Testing

```bash
# 1. Create athlete (get token from database or response)
# 2. Get consent form
curl http://localhost:8000/api/consent/<token>

# 3. Sign consent
curl -X POST http://localhost:8000/api/consent/<token>/sign

# 4. Verify athlete status updated to 'active'
```

## Estimated Complexity

**Size**: M (Medium - ~2 hours)
