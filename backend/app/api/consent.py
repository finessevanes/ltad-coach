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
