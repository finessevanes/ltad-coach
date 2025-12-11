---
id: BE-005
depends_on: [BE-002, BE-004]
blocks: [BE-006, BE-012]
---

# BE-005: Consent Workflow & Email Sending

## Title
Implement parental consent endpoints and automated email sending

## Scope

### In Scope
- Public consent form endpoint (token-protected, no auth)
- Consent submission endpoint (sign consent)
- Consent decline endpoint (decline consent)
- Resend consent email endpoint
- Email sending via Resend API
- Consent email template
- Consent confirmation email to coach
- Update athlete consent status on submission

### Out of Scope
- Consent form UI (FE-006)

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Email Provider | Resend | PRD specifies, good DX, good deliverability |
| Email Templates | HTML strings | Simple, no external dependencies |
| Consent Token | UUID in URL | Secure, no login required |
| Token Expiration | 30 days | Balance between security and parent convenience |

## Consent Token Expiration Trade-offs

**Chosen: 30 days**

| Duration | Pros | Cons |
|----------|------|------|
| 7 days | More secure, less risk of stale links | Parents may miss email, coach must resend |
| 30 days | Good balance, parents have time | Longer exposure window |
| 90 days | Maximum convenience | Security concern, links could be forwarded |
| No expiration | Never fails | Security risk, old links remain valid forever |

**Recommendation**: 30 days provides enough time for busy parents while limiting exposure. Coach can always resend if needed.

## Acceptance Criteria

- [ ] `GET /consent/{token}` returns consent form data (athlete name, coach name)
- [ ] `POST /consent/{token}/sign` records consent and updates athlete status to `active`
- [ ] `POST /consent/{token}/decline` records decline and updates athlete status to `declined`
- [ ] Creating athlete triggers consent email to parent
- [ ] Consent email contains unique link with token
- [ ] Coach receives email when consent is provided
- [ ] Coach receives email when consent is declined
- [ ] `POST /athletes/{id}/resend-consent` sends new consent email
- [ ] Invalid/expired tokens return appropriate errors
- [ ] Consent timestamp is recorded when signed or declined

## Files to Create/Modify

```
backend/app/
├── routers/
│   ├── consent.py              # Consent endpoints
│   └── athletes.py             # Add resend endpoint (modify)
├── services/
│   ├── __init__.py
│   └── email.py                # Email sending service
├── templates/
│   ├── __init__.py
│   ├── consent_request.py      # Consent request email template
│   └── consent_confirmed.py    # Consent confirmed email template
└── repositories/
    └── athlete.py              # Add consent methods (modify)
```

## Implementation Details

### services/email.py
```python
import resend
from app.config import settings

resend.api_key = settings.resend_api_key

async def send_email(
    to: str,
    subject: str,
    html: str,
    from_email: str = "AI Coach <noreply@aicoach.app>"
) -> bool:
    """Send email via Resend"""
    try:
        resend.Emails.send({
            "from": from_email,
            "to": to,
            "subject": subject,
            "html": html,
        })
        return True
    except Exception as e:
        print(f"Email send error: {e}")
        return False

async def send_consent_request(
    parent_email: str,
    athlete_name: str,
    coach_name: str,
    consent_token: str
) -> bool:
    """Send consent request email to parent"""
    consent_url = f"{settings.frontend_url}/consent/{consent_token}"

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Parental Consent Request</h2>
        <p>Hello,</p>
        <p>Coach <strong>{coach_name}</strong> would like to conduct athletic assessments
        for <strong>{athlete_name}</strong> using AI Coach.</p>

        <p>AI Coach uses video recording and computer vision to analyze athletic
        performance. The recorded videos will be stored securely and used only
        for assessment purposes.</p>

        <p>To provide consent for these assessments, please click the button below:</p>

        <p style="text-align: center; margin: 30px 0;">
            <a href="{consent_url}"
               style="background-color: #1976d2; color: white; padding: 12px 24px;
                      text-decoration: none; border-radius: 4px; display: inline-block;">
                Review & Provide Consent
            </a>
        </p>

        <p>If you have any questions, please contact the coach directly.</p>

        <p style="color: #666; font-size: 12px; margin-top: 40px;">
            This email was sent by AI Coach on behalf of {coach_name}.
            If you did not expect this email, please ignore it.
        </p>
    </div>
    """

    return await send_email(
        to=parent_email,
        subject=f"Consent Request for {athlete_name} - AI Coach",
        html=html
    )

async def send_consent_confirmed(
    coach_email: str,
    athlete_name: str,
    parent_email: str
) -> bool:
    """Notify coach that consent was provided"""
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Consent Received</h2>
        <p>Great news! Parental consent has been provided for <strong>{athlete_name}</strong>.</p>

        <p>The parent/guardian ({parent_email}) has agreed to allow athletic assessments
        using AI Coach.</p>

        <p>You can now conduct assessments for this athlete.</p>

        <p style="text-align: center; margin: 30px 0;">
            <a href="{settings.frontend_url}/athletes"
               style="background-color: #4caf50; color: white; padding: 12px 24px;
                      text-decoration: none; border-radius: 4px; display: inline-block;">
                View Athletes
            </a>
        </p>
    </div>
    """

    return await send_email(
        to=coach_email,
        subject=f"Consent Received for {athlete_name}",
        html=html
    )


async def send_consent_declined(
    coach_email: str,
    athlete_name: str,
    parent_email: str
) -> bool:
    """Notify coach that consent was declined"""
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Consent Declined</h2>
        <p>The parent/guardian ({parent_email}) has declined to provide consent
        for <strong>{athlete_name}</strong> to participate in AI Coach assessments.</p>

        <p>This athlete will remain in your roster with a "declined" status and cannot
        be assessed unless the parent changes their decision.</p>

        <p>If you believe this was done in error, please contact the parent directly.</p>

        <p style="text-align: center; margin: 30px 0;">
            <a href="{settings.frontend_url}/athletes"
               style="background-color: #666; color: white; padding: 12px 24px;
                      text-decoration: none; border-radius: 4px; display: inline-block;">
                View Athletes
            </a>
        </p>
    </div>
    """

    return await send_email(
        to=coach_email,
        subject=f"Consent Declined for {athlete_name}",
        html=html
    )
```

### routers/consent.py
```python
from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from app.repositories.athlete import AthleteRepository
from app.repositories.user import UserRepository
from app.services.email import send_consent_confirmed
from app.models.athlete import ConsentStatus

router = APIRouter(prefix="/consent", tags=["consent"])

class ConsentFormData(BaseModel):
    athlete_name: str
    coach_name: str
    legal_text: str

class ConsentSignRequest(BaseModel):
    acknowledged: bool

@router.get("/{token}", response_model=ConsentFormData)
async def get_consent_form(token: str):
    """
    Get consent form data (public endpoint, token-protected).
    No authentication required.
    """
    athlete_repo = AthleteRepository()
    user_repo = UserRepository()

    athlete = await athlete_repo.get_by_consent_token(token)

    if not athlete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid or expired consent link"
        )

    # Check token expiration (30-day limit from BE-004)
    if athlete.consent_token_expires and athlete.consent_token_expires < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This consent link has expired. Please ask the coach to send a new one."
        )

    if athlete.consent_status == ConsentStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Consent has already been provided"
        )

    coach = await user_repo.get(athlete.coach_id)
    if not coach:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coach not found"
        )

    legal_text = """
    By providing consent, you agree to the following:

    1. VIDEO RECORDING: Athletic assessment sessions will be recorded using a camera or webcam.

    2. DATA STORAGE: Recorded videos and assessment data will be stored securely in the cloud
       and associated with your child's profile.

    3. AI ANALYSIS: Computer vision technology will analyze the video to measure athletic
       performance metrics such as balance, coordination, and movement quality.

    4. DATA USE: Assessment data will be used solely for:
       - Providing feedback to coaches
       - Tracking athletic development over time
       - Generating progress reports

    5. DATA SHARING: Assessment results may be shared with you (the parent/guardian) via
       secure, PIN-protected links.

    6. DATA RETENTION: Videos and data will be retained indefinitely unless you request deletion.

    7. WITHDRAWAL: You may withdraw consent at any time by contacting the coach.

    This consent is specific to the AI Coach platform operated by the coach listed above.
    """

    return ConsentFormData(
        athlete_name=athlete.name,
        coach_name=coach.name,
        legal_text=legal_text
    )

@router.post("/{token}/sign")
async def sign_consent(token: str, data: ConsentSignRequest):
    """
    Submit signed consent (public endpoint, token-protected).
    """
    if not data.acknowledged:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must acknowledge the consent terms"
        )

    athlete_repo = AthleteRepository()
    user_repo = UserRepository()

    athlete = await athlete_repo.get_by_consent_token(token)

    if not athlete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid or expired consent link"
        )

    # Check token expiration (30-day limit from BE-004)
    if athlete.consent_token_expires and athlete.consent_token_expires < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This consent link has expired. Please ask the coach to send a new one."
        )

    if athlete.consent_status == ConsentStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Consent has already been provided"
        )

    if athlete.consent_status == ConsentStatus.DECLINED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Consent was previously declined"
        )

    # Update athlete consent status
    await athlete_repo.update(athlete.id, {
        "consent_status": ConsentStatus.ACTIVE.value,
        "consent_timestamp": datetime.utcnow(),
    })

    # Notify coach
    coach = await user_repo.get(athlete.coach_id)
    if coach:
        await send_consent_confirmed(
            coach_email=coach.email,
            athlete_name=athlete.name,
            parent_email=athlete.parent_email
        )

    return {"message": "Consent provided successfully"}


@router.post("/{token}/decline")
async def decline_consent(token: str):
    """
    Decline consent (public endpoint, token-protected).
    Parent chooses not to allow assessments.
    """
    athlete_repo = AthleteRepository()
    user_repo = UserRepository()

    athlete = await athlete_repo.get_by_consent_token(token)

    if not athlete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid or expired consent link"
        )

    if athlete.consent_status == ConsentStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Consent has already been provided"
        )

    if athlete.consent_status == ConsentStatus.DECLINED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Consent was already declined"
        )

    # Update athlete consent status to declined
    await athlete_repo.update(athlete.id, {
        "consent_status": ConsentStatus.DECLINED.value,
        "consent_timestamp": datetime.utcnow(),
    })

    # Notify coach of declined consent
    coach = await user_repo.get(athlete.coach_id)
    if coach:
        await send_consent_declined(
            coach_email=coach.email,
            athlete_name=athlete.name,
            parent_email=athlete.parent_email
        )

    return {"message": "Consent declined"}
```

### routers/athletes.py (additions)
```python
from app.services.email import send_consent_request

# Add to existing router:

@router.post("/{athlete_id}/resend-consent")
async def resend_consent_email(
    athlete_id: str,
    user: User = Depends(get_current_user)
):
    """Resend consent email to parent"""
    athlete_repo = AthleteRepository()
    athlete = await athlete_repo.get_if_owned(athlete_id, user.id)

    if not athlete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete not found"
        )

    if athlete.consent_status == ConsentStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Consent already provided"
        )

    success = await send_consent_request(
        parent_email=athlete.parent_email,
        athlete_name=athlete.name,
        coach_name=user.name,
        consent_token=athlete.consent_token
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send email"
        )

    return {"message": "Consent email sent"}

# Modify create_athlete to send consent email:
@router.post("", response_model=AthleteResponse, status_code=status.HTTP_201_CREATED)
async def create_athlete(
    data: AthleteCreate,
    user: User = Depends(get_current_user)
):
    # ... existing creation logic ...

    # Send consent email
    await send_consent_request(
        parent_email=data.parent_email,
        athlete_name=data.name,
        coach_name=user.name,
        consent_token=athlete.consent_token
    )

    return AthleteResponse(...)
```

## Dependencies to Add

```toml
# pyproject.toml
resend = "^0.7.0"
```

## API Specification

### GET /consent/{token}

**Response 200:**
```json
{
  "athlete_name": "John Smith",
  "coach_name": "Coach Davis",
  "legal_text": "By providing consent, you agree to..."
}
```

### POST /consent/{token}/sign

**Request:**
```json
{
  "acknowledged": true
}
```

**Response 200:**
```json
{
  "message": "Consent provided successfully"
}
```

### POST /consent/{token}/decline

**Response 200:**
```json
{
  "message": "Consent declined"
}
```

**Response 400 (already processed):**
```json
{
  "detail": "Consent has already been provided"
}
```

### POST /athletes/{id}/resend-consent

**Response 200:**
```json
{
  "message": "Consent email sent"
}
```

## Estimated Complexity
**M** (Medium) - 3-4 hours

## Testing Instructions

1. Create athlete and verify consent email is sent:
```bash
curl -X POST http://localhost:8000/athletes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "age": 12, "gender": "male", "parent_email": "your@email.com"}'
# Check email inbox for consent request
```

2. Get consent form (extract token from email):
```bash
curl http://localhost:8000/consent/<token>
```

3. Sign consent:
```bash
curl -X POST http://localhost:8000/consent/<token>/sign \
  -H "Content-Type: application/json" \
  -d '{"acknowledged": true}'
```

4. Verify athlete status changed to "active"

5. Verify coach receives confirmation email

## Rate Limiting

The `/athletes/{id}/resend-consent` endpoint is rate limited to prevent email abuse:

| Limit | Value | Scope |
|-------|-------|-------|
| Requests | 3 | Per athlete per 24 hours |
| Response | 429 | When exceeded |

**Implementation (add to routers/athletes.py):**

```python
from datetime import datetime, timedelta
from collections import defaultdict

class ResendRateLimiter:
    """Rate limit consent resends per athlete"""

    def __init__(self, max_per_day: int = 3):
        self.max_per_day = max_per_day
        self.resends = defaultdict(list)  # athlete_id -> [timestamp, ...]

    def check(self, athlete_id: str) -> bool:
        now = datetime.utcnow()
        cutoff = now - timedelta(hours=24)

        # Remove old resends
        self.resends[athlete_id] = [
            ts for ts in self.resends[athlete_id] if ts > cutoff
        ]

        if len(self.resends[athlete_id]) >= self.max_per_day:
            return False

        self.resends[athlete_id].append(now)
        return True

# Singleton
consent_resend_limiter = ResendRateLimiter(max_per_day=3)
```

**Updated endpoint:**

```python
from app.middleware.rate_limit import consent_resend_limiter

@router.post("/{athlete_id}/resend-consent")
async def resend_consent_email(
    athlete_id: str,
    user: User = Depends(get_current_user)
):
    """Resend consent email to parent (rate limited: 3 per day per athlete)"""
    # Check rate limit first
    if not consent_resend_limiter.check(athlete_id):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Maximum 3 consent emails per athlete per day. Please try again tomorrow."
        )

    # ... rest of implementation ...
```

## Notes
- Resend requires domain verification for production
- Rate limiting prevents email abuse (3 per athlete per 24 hours)
- Email templates should be tested with different email clients

## Post-MVP: Redis for Rate Limiting

The current in-memory rate limiter works for single-instance deployment but will **not work** for multi-instance deployments (e.g., Render auto-scaling).

**Post-MVP migration to Redis:**

```python
# Example Redis-based rate limiter
import redis
from datetime import datetime, timedelta

class RedisRateLimiter:
    def __init__(self, redis_url: str, max_per_day: int = 3):
        self.redis = redis.from_url(redis_url)
        self.max_per_day = max_per_day
        self.window_seconds = 24 * 60 * 60  # 24 hours

    def check(self, key: str) -> bool:
        """Check if rate limited using Redis sorted set"""
        now = datetime.utcnow().timestamp()
        cutoff = now - self.window_seconds

        # Remove old entries
        self.redis.zremrangebyscore(key, 0, cutoff)

        # Count recent entries
        count = self.redis.zcard(key)

        if count >= self.max_per_day:
            return False

        # Add new entry with TTL
        self.redis.zadd(key, {str(now): now})
        self.redis.expire(key, self.window_seconds)
        return True
```

**Environment variable required**: `REDIS_URL`
