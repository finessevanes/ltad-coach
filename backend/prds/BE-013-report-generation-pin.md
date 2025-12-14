---
id: BE-013
depends_on: [BE-011, BE-012]
blocks: [BE-014]
---

# BE-013: Parent Report Generation & PIN Protection

## Title
Implement parent report generation and PIN-protected access

## Scope

### In Scope
- Generate parent report endpoint
- Store report in Firestore
- Generate unique 6-digit PIN
- PIN verification endpoint
- Public report viewing endpoint (PIN-protected)
- Report preview for coach
- Get reports by athlete endpoint (for report history in FE-012)
- Resend report with new PIN endpoint (for FE-012 ReportHistory)

### Out of Scope
- Email sending (BE-014)
- Frontend report UI (FE-013, FE-014)

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| PIN Length | 6 digits | Good security/usability balance |
| PIN Storage | Hashed | Security best practice |
| Report Content | Stored as string | Simple, searchable |

## Acceptance Criteria

- [ ] `POST /reports/generate/{athleteId}` generates report preview
- [ ] Report includes AI-generated content from Progress Agent
- [ ] `POST /reports/{id}/send` creates stored report with PIN
- [ ] PIN is 6 random digits
- [ ] `GET /reports/view/{id}` requires PIN verification
- [ ] `POST /reports/view/{id}/verify` validates PIN
- [ ] Invalid PIN returns 401
- [ ] Report content only returned after PIN verification
- [ ] `GET /reports/athlete/{athleteId}` returns list of sent reports for athlete
- [ ] `POST /reports/{reportId}/resend` generates new PIN and triggers email resend

## Files to Create/Modify

```
backend/app/
├── routers/
│   └── reports.py               # Report endpoints
├── models/
│   └── report.py                # Report Pydantic models
├── repositories/
│   └── report.py                # Report repository
└── services/
    └── reports.py               # Report generation service
```

## Implementation Details

### models/report.py
```python
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class ReportGenerate(BaseModel):
    """Request to generate report preview"""
    pass  # No body needed, athlete ID from URL

class ReportPreview(BaseModel):
    """Preview response before sending"""
    athlete_id: str
    athlete_name: str
    content: str
    assessment_count: int
    latest_score: Optional[int] = None

class ReportCreate(BaseModel):
    """Store report for sending"""
    athlete_id: str
    content: str
    assessment_ids: List[str]

class Report(BaseModel):
    id: str
    athlete_id: str
    coach_id: str
    created_at: datetime
    expires_at: datetime  # 90-day expiry
    access_pin_hash: str  # Hashed PIN
    report_content: str
    assessment_ids: List[str]
    sent_at: Optional[datetime] = None

class ReportSendRequest(BaseModel):
    """Request to send report to parent"""
    pass  # No body needed

class ReportSendResponse(BaseModel):
    id: str
    pin: str  # Shown only once
    message: str

class ReportVerifyRequest(BaseModel):
    pin: str

class ReportViewResponse(BaseModel):
    athlete_name: str
    report_content: str
    created_at: datetime

class ReportListItem(BaseModel):
    """Item for report history list (FE-012)"""
    id: str
    athlete_id: str
    created_at: datetime
    sent_at: Optional[datetime] = None

class ReportResendResponse(BaseModel):
    """Response from resending a report"""
    pin: str
    message: str
```

### repositories/report.py
```python
import hashlib
from datetime import datetime, timedelta
from typing import Optional, List
from app.firebase.repository import BaseRepository
from app.models.report import Report

class ReportRepository(BaseRepository[Report]):
    def __init__(self):
        super().__init__("parent_reports", Report)

    @staticmethod
    def hash_pin(pin: str) -> str:
        """Hash PIN for storage"""
        return hashlib.sha256(pin.encode()).hexdigest()

    @staticmethod
    def verify_pin(pin: str, hash: str) -> bool:
        """Verify PIN against stored hash"""
        return hashlib.sha256(pin.encode()).hexdigest() == hash

    async def create_report(
        self,
        coach_id: str,
        athlete_id: str,
        content: str,
        assessment_ids: List[str],
        pin: str
    ) -> Report:
        """Create new report with hashed PIN and 90-day expiry"""
        report_data = {
            "athlete_id": athlete_id,
            "coach_id": coach_id,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(days=90),  # 90-day expiry
            "access_pin_hash": self.hash_pin(pin),
            "report_content": content,
            "assessment_ids": assessment_ids,
            "sent_at": None,
        }

        doc_ref = self.collection.document()
        doc_ref.set(report_data)

        return Report(id=doc_ref.id, **report_data)

    async def get_by_athlete(
        self,
        athlete_id: str,
        limit: int = 10
    ) -> List[Report]:
        """Get reports for an athlete"""
        docs = (
            self.collection
            .where("athlete_id", "==", athlete_id)
            .order_by("created_at", direction="DESCENDING")
            .limit(limit)
            .stream()
        )
        return [Report(id=doc.id, **doc.to_dict()) for doc in docs]

    async def mark_sent(self, report_id: str):
        """Mark report as sent"""
        await self.update(report_id, {"sent_at": datetime.utcnow()})
```

### services/reports.py
```python
import random
import string
from typing import Tuple
from app.agents.orchestrator import orchestrator
from app.agents.progress import generate_progress_report
from app.repositories.athlete import AthleteRepository
from app.repositories.assessment import AssessmentRepository
from app.services.metrics import get_duration_score

def generate_pin() -> str:
    """Generate 6-digit PIN"""
    return ''.join(random.choices(string.digits, k=6))

async def generate_report_content(
    coach_id: str,
    athlete_id: str,
) -> Tuple[str, dict]:
    """
    Generate parent report content.

    Returns:
        (content, metadata) tuple
    """
    athlete_repo = AthleteRepository()
    assessment_repo = AssessmentRepository()

    # Get athlete
    athlete = await athlete_repo.get(athlete_id)
    if not athlete:
        raise ValueError("Athlete not found")

    # Get assessments
    assessments = await assessment_repo.get_by_athlete(athlete_id, limit=12)
    if not assessments:
        raise ValueError("No assessments found")

    # Get latest metrics
    latest = assessments[0]
    current_metrics = latest.metrics.model_dump() if latest.metrics else None

    # Get compressed history via orchestrator
    routing = await orchestrator.route(
        request_type="parent_report",
        athlete_id=athlete_id,
        athlete_name=athlete.name,
        athlete_age=athlete.age,
        current_metrics=current_metrics,
        coach_id=coach_id,
    )

    # Generate report content
    content = await generate_progress_report(
        athlete_name=athlete.name,
        athlete_age=athlete.age,
        compressed_history=routing["compressed_history"],
        current_metrics=current_metrics,
        assessment_count=routing["assessment_count"],
    )

    # Calculate latest score
    latest_score = None
    if current_metrics:
        score, _ = get_duration_score(current_metrics.get("duration_seconds", 0))
        latest_score = score

    metadata = {
        "assessment_count": routing["assessment_count"],
        "latest_score": latest_score,
        "assessment_ids": [a.id for a in assessments],
    }

    return content, metadata
```

### routers/reports.py
```python
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.report import (
    ReportPreview,
    ReportSendResponse,
    ReportVerifyRequest,
    ReportViewResponse,
)
from app.repositories.athlete import AthleteRepository
from app.repositories.report import ReportRepository
from app.services.reports import generate_report_content, generate_pin

router = APIRouter(prefix="/reports", tags=["reports"])

@router.post("/generate/{athlete_id}", response_model=ReportPreview)
async def generate_report(
    athlete_id: str,
    user: User = Depends(get_current_user)
):
    """
    Generate parent report preview.
    Does not store or send - just preview.
    """
    athlete_repo = AthleteRepository()

    # Validate ownership
    athlete = await athlete_repo.get_if_owned(athlete_id, user.id)
    if not athlete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete not found"
        )

    try:
        content, metadata = await generate_report_content(user.id, athlete_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    return ReportPreview(
        athlete_id=athlete_id,
        athlete_name=athlete.name,
        content=content,
        assessment_count=metadata["assessment_count"],
        latest_score=metadata["latest_score"],
    )

@router.post("/{athlete_id}/send", response_model=ReportSendResponse)
async def send_report(
    athlete_id: str,
    user: User = Depends(get_current_user)
):
    """
    Generate report, store with PIN, and prepare for sending.
    Returns PIN for coach reference.
    Email sending handled separately (BE-014).
    """
    athlete_repo = AthleteRepository()
    report_repo = ReportRepository()

    # Validate ownership
    athlete = await athlete_repo.get_if_owned(athlete_id, user.id)
    if not athlete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete not found"
        )

    try:
        content, metadata = await generate_report_content(user.id, athlete_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    # Generate PIN and create report
    pin = generate_pin()
    report = await report_repo.create_report(
        coach_id=user.id,
        athlete_id=athlete_id,
        content=content,
        assessment_ids=metadata["assessment_ids"],
        pin=pin,
    )

    # Note: Email sending done in BE-014 after this returns

    return ReportSendResponse(
        id=report.id,
        pin=pin,  # Show to coach once
        message="Report created. PIN generated for parent access.",
    )

@router.get("/view/{report_id}")
async def get_report_info(report_id: str):
    """
    Get basic report info (public endpoint).
    Actual content requires PIN verification.
    """
    report_repo = ReportRepository()
    athlete_repo = AthleteRepository()

    report = await report_repo.get(report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )

    athlete = await athlete_repo.get(report.athlete_id)

    return {
        "report_id": report_id,
        "athlete_name": athlete.name if athlete else "Unknown",
        "created_at": report.created_at.isoformat(),
        "requires_pin": True,
    }

@router.post("/view/{report_id}/verify", response_model=ReportViewResponse)
async def verify_and_view_report(
    report_id: str,
    data: ReportVerifyRequest
):
    """
    Verify PIN and return report content (public endpoint).
    """
    report_repo = ReportRepository()
    athlete_repo = AthleteRepository()

    report = await report_repo.get(report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )

    # Check report expiration (90-day limit)
    if report.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This report has expired. Please contact the coach for a new report."
        )

    # Verify PIN
    if not report_repo.verify_pin(data.pin, report.access_pin_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid PIN"
        )

    athlete = await athlete_repo.get(report.athlete_id)

    return ReportViewResponse(
        athlete_name=athlete.name if athlete else "Unknown",
        report_content=report.report_content,
        created_at=report.created_at,
    )

@router.get("/athlete/{athlete_id}", response_model=List[ReportListItem])
async def get_reports_by_athlete(
    athlete_id: str,
    user: User = Depends(get_current_user)
):
    """
    Get list of reports for an athlete (for report history in FE-012).
    Coach must own the athlete.
    """
    athlete_repo = AthleteRepository()
    report_repo = ReportRepository()

    # Validate ownership
    athlete = await athlete_repo.get_if_owned(athlete_id, user.id)
    if not athlete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete not found"
        )

    reports = await report_repo.get_by_athlete(athlete_id)

    return [
        ReportListItem(
            id=r.id,
            athlete_id=r.athlete_id,
            created_at=r.created_at,
            sent_at=r.sent_at,
        )
        for r in reports
    ]

@router.post("/{report_id}/resend", response_model=ReportResendResponse)
async def resend_report(
    report_id: str,
    user: User = Depends(get_current_user)
):
    """
    Resend report with new PIN.
    Invalidates old PIN, generates new one, and triggers email.
    Used from FE-012 ReportHistory component.
    """
    report_repo = ReportRepository()
    athlete_repo = AthleteRepository()

    report = await report_repo.get(report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )

    # Verify coach owns the athlete
    athlete = await athlete_repo.get_if_owned(report.athlete_id, user.id)
    if not athlete:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to resend this report"
        )

    # Generate new PIN
    new_pin = generate_pin()
    new_pin_hash = report_repo.hash_pin(new_pin)

    # Update report with new PIN hash
    await report_repo.update(report_id, {
        "access_pin_hash": new_pin_hash,
    })

    # Reset rate limiter for this report
    pin_limiter.failed_counts[report_id] = 0

    # Email sending handled by BE-014 (import and call send_report_email)
    # For now, just return the new PIN
    # TODO: Call BE-014 email service here

    return ReportResendResponse(
        pin=new_pin,
        message="Report resent with new PIN. Previous PIN is now invalid.",
    )
```

## API Specification

### POST /reports/generate/{athleteId}

**Response 200:**
```json
{
  "athlete_id": "athlete_123",
  "athlete_name": "John Smith",
  "content": "Dear Parent,\n\nWe're pleased to share...",
  "assessment_count": 5,
  "latest_score": 4
}
```

### POST /reports/{athleteId}/send

**Response 200:**
```json
{
  "id": "report_456",
  "pin": "482957",
  "message": "Report created. PIN generated for parent access."
}
```

### GET /reports/view/{reportId}

**Response 200:**
```json
{
  "report_id": "report_456",
  "athlete_name": "John Smith",
  "created_at": "2024-01-15T10:30:00Z",
  "requires_pin": true
}
```

### POST /reports/view/{reportId}/verify

**Request:**
```json
{
  "pin": "482957"
}
```

**Response 200:**
```json
{
  "athlete_name": "John Smith",
  "report_content": "Dear Parent,\n\nWe're pleased to share...",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Response 401:**
```json
{
  "detail": "Invalid PIN"
}
```

### GET /reports/athlete/{athleteId}

**Response 200:**
```json
[
  {
    "id": "report_456",
    "athlete_id": "athlete_123",
    "created_at": "2024-01-15T10:30:00Z",
    "sent_at": "2024-01-15T10:31:00Z"
  },
  {
    "id": "report_123",
    "athlete_id": "athlete_123",
    "created_at": "2024-01-01T08:00:00Z",
    "sent_at": "2024-01-01T08:01:00Z"
  }
]
```

### POST /reports/{reportId}/resend

**Response 200:**
```json
{
  "pin": "739284",
  "message": "Report resent with new PIN. Previous PIN is now invalid."
}
```

**Response 403:**
```json
{
  "detail": "Not authorized to resend this report"
}
```

## Estimated Complexity
**M** (Medium) - 4 hours

## Testing Instructions

1. Generate report preview:
```bash
curl -X POST http://localhost:8000/reports/generate/athlete_123 \
  -H "Authorization: Bearer $TOKEN"
```

2. Create and send report:
```bash
curl -X POST http://localhost:8000/reports/athlete_123/send \
  -H "Authorization: Bearer $TOKEN"
# Returns PIN
```

3. View report info (public):
```bash
curl http://localhost:8000/reports/view/report_456
```

4. Verify PIN and view content:
```bash
curl -X POST http://localhost:8000/reports/view/report_456/verify \
  -H "Content-Type: application/json" \
  -d '{"pin": "482957"}'
```

5. Test invalid PIN:
```bash
curl -X POST http://localhost:8000/reports/view/report_456/verify \
  -H "Content-Type: application/json" \
  -d '{"pin": "000000"}'
# Should return 401
```

## PIN Brute Force Protection

Since 6-digit PINs have only 1 million combinations, implement rate limiting on PIN verification:

| Limit | Value | Scope |
|-------|-------|-------|
| Attempts | 5 | Per minute per report |
| Lockout | 10 failed attempts | Per report |
| Response | 429 | When rate limited |
| Lockout Response | 403 | When locked out |

**Implementation (add to repositories/report.py):**

```python
from datetime import datetime, timedelta
from collections import defaultdict

class PINVerificationLimiter:
    """Track PIN verification attempts per report"""

    def __init__(self):
        self.attempts = defaultdict(list)  # report_id -> [timestamp, ...]
        self.failed_counts = defaultdict(int)  # report_id -> total failures

    def check_rate_limit(self, report_id: str) -> bool:
        """Check if rate limited (5 attempts per minute)"""
        now = datetime.utcnow()
        cutoff = now - timedelta(minutes=1)

        # Remove old attempts
        self.attempts[report_id] = [
            ts for ts in self.attempts[report_id] if ts > cutoff
        ]

        return len(self.attempts[report_id]) < 5

    def is_locked_out(self, report_id: str) -> bool:
        """Check if locked out (10+ total failures)"""
        return self.failed_counts[report_id] >= 10

    def record_attempt(self, report_id: str, success: bool):
        """Record a verification attempt"""
        self.attempts[report_id].append(datetime.utcnow())
        if not success:
            self.failed_counts[report_id] += 1

    def reset_on_success(self, report_id: str):
        """Reset failure count on successful verification"""
        self.failed_counts[report_id] = 0

# Singleton
pin_limiter = PINVerificationLimiter()
```

**Update routers/reports.py verify endpoint:**

```python
from app.repositories.report import pin_limiter

@router.post("/view/{report_id}/verify", response_model=ReportViewResponse)
async def verify_and_view_report(
    report_id: str,
    data: ReportVerifyRequest
):
    """
    Verify PIN and return report content (public endpoint).
    """
    # Check lockout first
    if pin_limiter.is_locked_out(report_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This report has been locked due to too many failed attempts. Contact the coach."
        )

    # Check rate limit
    if not pin_limiter.check_rate_limit(report_id):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many attempts. Please wait a minute before trying again."
        )

    report_repo = ReportRepository()
    athlete_repo = AthleteRepository()

    report = await report_repo.get(report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )

    # Verify PIN
    if not report_repo.verify_pin(data.pin, report.access_pin_hash):
        pin_limiter.record_attempt(report_id, success=False)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid PIN"
        )

    # Success - reset failure count
    pin_limiter.record_attempt(report_id, success=True)
    pin_limiter.reset_on_success(report_id)

    athlete = await athlete_repo.get(report.athlete_id)

    return ReportViewResponse(
        athlete_name=athlete.name if athlete else "Unknown",
        report_content=report.report_content,
        created_at=report.created_at,
    )
```

**Updated Error Responses:**

```json
// 429 Rate Limited
{
  "code": "RATE_LIMITED",
  "message": "Too many attempts. Please wait a minute before trying again."
}

// 403 Locked Out
{
  "code": "FORBIDDEN",
  "message": "This report has been locked due to too many failed attempts. Contact the coach."
}
```

## Notes
- PIN is shown to coach once; stored hashed
- PIN verification is rate limited (5 attempts/min) and locks out after 10 failures
- Report content is stored for consistency; not regenerated on view
- In production, use Redis for rate limiting state instead of in-memory
