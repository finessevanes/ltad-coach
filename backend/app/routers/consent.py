"""Public consent workflow endpoints (no authentication required)."""

from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status
from app.models.consent import ConsentFormData, ConsentSignRequest
from app.models.athlete import ConsentStatus
from app.models.errors import AppException, ErrorCode
from app.repositories.athlete import AthleteRepository
from app.repositories.user import UserRepository
from app.services.email import send_consent_confirmed, send_consent_declined

router = APIRouter(prefix="/consent", tags=["consent"])

# Legal consent text for parental consent form
LEGAL_CONSENT_TEXT = """
**PARENTAL CONSENT FOR ATHLETIC ASSESSMENT**

I, as the parent or legal guardian of the athlete named above, hereby consent to the following:

1. **Video Recording**: I authorize the recording of video footage of my child performing fundamental movement tests and athletic assessments.

2. **Computer Vision Analysis**: I understand that recorded videos will be analyzed using computer vision technology (MediaPipe) to extract movement patterns and body position data.

3. **AI-Powered Feedback**: I consent to the use of artificial intelligence (Claude AI) to analyze movement data and provide coaching feedback based on Long-Term Athlete Development (LTAD) benchmarks for youth athletes ages 5-13.

4. **Data Storage**: I understand that:
   - Assessment videos and data will be securely stored using Firebase Cloud Storage
   - Data is associated with my child's profile and accessible only to the coach
   - Data may be retained for historical progress tracking
   - I may request deletion of my child's data at any time

5. **Privacy**: I understand that:
   - Videos and data will not be shared with third parties without my consent
   - The coach will have access to all assessment results
   - Parent reports may be shared with me via email with PIN-protected access

6. **Voluntary Participation**: I understand that participation is voluntary and I may withdraw consent at any time by contacting the coach.

7. **No Medical Advice**: I understand that CoachLens provides athletic coaching feedback only and does not constitute medical advice. Any concerns about my child's health or physical development should be discussed with a qualified healthcare professional.

By providing consent, I acknowledge that I have read and understood the above terms and agree to allow my child to participate in athletic assessments using the CoachLens platform.
""".strip()


@router.get("/{token}", response_model=ConsentFormData)
async def get_consent_form(token: str):
    """Get consent form data for a consent token (public endpoint).

    Parents access this via link in email - no authentication required.
    Token-protected for security.

    Args:
        token: Consent token (UUID4) from athlete record

    Returns:
        Consent form data (athlete name, coach name, legal text)

    Raises:
        404: Invalid or expired token
        400: Consent already provided or declined
    """
    athlete_repo = AthleteRepository()
    user_repo = UserRepository()

    # Get athlete by consent token
    athlete = await athlete_repo.get_by_consent_token(token)

    if not athlete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid consent link. Please contact the coach for a new link.",
        )

    # Check if token expired (30 days)
    now = datetime.now(timezone.utc)
    # Make expiration timezone-aware if needed
    expires = athlete.consent_token_expires
    if expires.tzinfo is None:
        from datetime import timezone as tz
        expires = expires.replace(tzinfo=tz.utc)

    if now > expires:
        raise AppException(
            code=ErrorCode.VALIDATION_ERROR,
            message="This consent link has expired (30-day limit). Please contact the coach to request a new consent link.",
            status_code=status.HTTP_410_GONE,
        )

    # Check if consent already provided/declined
    if athlete.consent_status == ConsentStatus.ACTIVE:
        raise AppException(
            code=ErrorCode.VALIDATION_ERROR,
            message="Consent has already been provided for this athlete.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    if athlete.consent_status == ConsentStatus.DECLINED:
        raise AppException(
            code=ErrorCode.VALIDATION_ERROR,
            message="Consent has already been declined for this athlete. Contact the coach if you wish to change your decision.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    # Get coach name
    coach = await user_repo.get(athlete.coach_id)
    coach_name = coach.name if coach else "Your Coach"

    return ConsentFormData(
        athlete_name=athlete.name,
        coach_name=coach_name,
        legal_text=LEGAL_CONSENT_TEXT,
    )


@router.post("/{token}/sign")
async def sign_consent(token: str, consent_data: ConsentSignRequest):
    """Parent provides consent (public endpoint).

    Updates athlete status to "active" and sends notification to coach.

    Args:
        token: Consent token
        consent_data: Must have acknowledged=true

    Returns:
        Success message

    Raises:
        400: acknowledged not true, token expired, or consent already provided
        404: Invalid token
    """
    # Validate acknowledged field
    if not consent_data.acknowledged:
        raise AppException(
            code=ErrorCode.VALIDATION_ERROR,
            message="You must acknowledge the consent terms to proceed.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    athlete_repo = AthleteRepository()
    user_repo = UserRepository()

    # Get athlete by token
    athlete = await athlete_repo.get_by_consent_token(token)

    if not athlete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid consent link.",
        )

    # Check if token expired
    now = datetime.now(timezone.utc)
    expires = athlete.consent_token_expires
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)

    if now > expires:
        raise AppException(
            code=ErrorCode.VALIDATION_ERROR,
            message="This consent link has expired.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    # Check if consent already provided
    if athlete.consent_status == ConsentStatus.ACTIVE:
        raise AppException(
            code=ErrorCode.VALIDATION_ERROR,
            message="Consent has already been provided for this athlete.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    if athlete.consent_status == ConsentStatus.DECLINED:
        raise AppException(
            code=ErrorCode.VALIDATION_ERROR,
            message="Consent was previously declined. Contact the coach to receive a new consent link.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    # Update athlete consent status
    await athlete_repo.update_consent_status(
        athlete.id, ConsentStatus.ACTIVE, now
    )

    # Send notification email to coach
    coach = await user_repo.get(athlete.coach_id)
    if coach:
        send_consent_confirmed(coach.email, athlete.name, athlete.parent_email)

    return {"message": "Consent provided successfully. The coach has been notified."}


@router.post("/{token}/decline")
async def decline_consent(token: str):
    """Parent declines consent (public endpoint).

    Updates athlete status to "declined" and sends notification to coach.

    Args:
        token: Consent token

    Returns:
        Success message

    Raises:
        400: Consent already provided or declined
        404: Invalid token
    """
    athlete_repo = AthleteRepository()
    user_repo = UserRepository()

    # Get athlete by token
    athlete = await athlete_repo.get_by_consent_token(token)

    if not athlete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid consent link.",
        )

    # Check if consent already provided or declined
    if athlete.consent_status == ConsentStatus.ACTIVE:
        raise AppException(
            code=ErrorCode.VALIDATION_ERROR,
            message="Consent has already been provided. Contact the coach if you wish to change your decision.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    if athlete.consent_status == ConsentStatus.DECLINED:
        raise AppException(
            code=ErrorCode.VALIDATION_ERROR,
            message="Consent has already been declined for this athlete.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    # Update athlete consent status
    now = datetime.now(timezone.utc)
    await athlete_repo.update_consent_status(
        athlete.id, ConsentStatus.DECLINED, now
    )

    # Send notification email to coach
    coach = await user_repo.get(athlete.coach_id)
    if coach:
        send_consent_declined(coach.email, athlete.name, athlete.parent_email)

    return {"message": "Your decision has been recorded. The coach has been notified."}
