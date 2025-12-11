from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user
from app.services.database import db, Collections
from app.services.email import email_service
from app.core.config import settings
from app.models.athlete import Athlete, AthleteCreate, AthleteUpdate
from typing import List
import secrets

router = APIRouter(prefix="/api/athletes", tags=["Athletes"])

MAX_ATHLETES_PER_COACH = 25


@router.get("", response_model=List[Athlete])
async def list_athletes(user: dict = Depends(get_current_user)):
    """Get all athletes for authenticated coach"""
    athletes = db.query(
        Collections.ATHLETES,
        filters=[("coachId", "==", user["uid"])],
        order_by="createdAt"
    )
    return athletes


@router.post("", response_model=Athlete)
async def create_athlete(
    athlete: AthleteCreate,
    user: dict = Depends(get_current_user)
):
    """Create new athlete and send consent email"""
    # Check athlete limit
    coach_data = db.get(Collections.USERS, user["uid"])
    if coach_data and coach_data.get("athleteCount", 0) >= MAX_ATHLETES_PER_COACH:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {MAX_ATHLETES_PER_COACH} athletes per coach"
        )

    # Generate consent token
    consent_token = secrets.token_urlsafe(32)

    athlete_data = {
        **athlete.model_dump(),
        "coachId": user["uid"],
        "consentStatus": "pending",
        "consentToken": consent_token,
        "consentTimestamp": None,
        "avatarUrl": None
    }

    athlete_id = db.create(Collections.ATHLETES, athlete_data)

    # Increment coach athlete count
    db.update(Collections.USERS, user["uid"], {
        "athleteCount": (coach_data.get("athleteCount", 0) + 1)
    })

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

    athlete_data["id"] = athlete_id
    return Athlete(**athlete_data)


@router.get("/{athlete_id}", response_model=Athlete)
async def get_athlete(athlete_id: str, user: dict = Depends(get_current_user)):
    """Get single athlete"""
    athlete = db.get(Collections.ATHLETES, athlete_id)

    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")

    if athlete["coachId"] != user["uid"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    return Athlete(**athlete)


@router.put("/{athlete_id}", response_model=Athlete)
async def update_athlete(
    athlete_id: str,
    athlete_update: AthleteUpdate,
    user: dict = Depends(get_current_user)
):
    """Update athlete"""
    athlete = db.get(Collections.ATHLETES, athlete_id)

    if not athlete or athlete["coachId"] != user["uid"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = athlete_update.model_dump(exclude_unset=True)
    if update_data:
        db.update(Collections.ATHLETES, athlete_id, update_data)
        athlete.update(update_data)

    return Athlete(**athlete)


@router.delete("/{athlete_id}")
async def delete_athlete(athlete_id: str, user: dict = Depends(get_current_user)):
    """Delete athlete"""
    athlete = db.get(Collections.ATHLETES, athlete_id)

    if not athlete or athlete["coachId"] != user["uid"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(Collections.ATHLETES, athlete_id)

    # Decrement coach athlete count
    coach_data = db.get(Collections.USERS, user["uid"])
    db.update(Collections.USERS, user["uid"], {
        "athleteCount": max(0, coach_data.get("athleteCount", 1) - 1)
    })

    return {"message": "Athlete deleted"}


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
