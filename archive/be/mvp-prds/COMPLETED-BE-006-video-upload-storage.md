---
id: BE-006
depends_on: [BE-002, BE-003, BE-004]
blocks: [BE-007]
status: completed
---

# BE-006: Video Upload Endpoint & Storage

## Title
Implement assessment analysis endpoint with video storage handling

## Scope

### In Scope
- Assessment analysis endpoint (`POST /assessments/analyze`)
- Download video from Firebase Storage URL
- Create assessment record in Firestore
- Validate athlete ownership and consent status
- Return assessment ID for polling/results

### Out of Scope
- MediaPipe analysis (BE-007)
- AI feedback generation (BE-009, BE-010)
- Results retrieval endpoint (BE-012)

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Video Source | Firebase Storage URL | Client uploads directly to Storage |
| Video Download | Stream to temp file | Process without memory constraints |
| Async Processing | Background task | Return immediately, process async |

## Acceptance Criteria

- [ ] `POST /assessments/analyze` accepts video URL and metadata
- [ ] Validates athlete belongs to authenticated coach
- [ ] Validates athlete has active consent
- [ ] Creates assessment record with `processing` status
- [ ] Returns assessment ID immediately
- [ ] Downloads video from Firebase Storage
- [ ] Handles invalid/missing video URLs gracefully
- [ ] Rate limiting prevents abuse (50 requests per hour per coach)
- [ ] Validates video duration is between 25-35 seconds
- [ ] Validates video file size is under 100MB

## Video Validation

Videos are validated for both size and duration constraints:

| Validation | Min | Max | Error |
|------------|-----|-----|-------|
| File Size | - | 100MB | "Video file size exceeds 100MB limit" |
| Recording Duration | 25s | 35s | "Recording must be between 25-35 seconds" |

### Duration Clarification

- **Test Duration**: 30 seconds (per One-Leg Balance protocol)
- **Recording Window**: 25-35 seconds (accounts for 3-second countdown + test + stop delay)
- The 5-second buffer on each side accommodates:
  - **Min (25s)**: Early stop after countdown if coach sees failure
  - **Max (35s)**: 3s countdown + 30s test + 2s stop delay

**Implementation in services/video.py:**
```python
import subprocess
import json
import os

MAX_FILE_SIZE_MB = 100
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024  # 100MB

def validate_video_file_size(file_path: str) -> None:
    """Validate video file is under 100MB. Raises ValueError if too large."""
    file_size = os.path.getsize(file_path)
    if file_size > MAX_FILE_SIZE_BYTES:
        size_mb = file_size / (1024 * 1024)
        raise ValueError(f"Video file size ({size_mb:.1f}MB) exceeds {MAX_FILE_SIZE_MB}MB limit")

def get_video_duration(file_path: str) -> float:
    """Get video duration using ffprobe"""
    result = subprocess.run(
        ['ffprobe', '-v', 'quiet', '-show_entries', 'format=duration',
         '-of', 'json', file_path],
        capture_output=True, text=True
    )
    data = json.loads(result.stdout)
    return float(data['format']['duration'])

def validate_video_duration(file_path: str) -> None:
    """Validate video is between 25-35 seconds. Raises ValueError if invalid."""
    duration = get_video_duration(file_path)
    if duration < 25 or duration > 35:
        raise ValueError(f"Video duration ({duration:.1f}s) must be between 25-35 seconds")

def validate_video(file_path: str) -> None:
    """Validate video file size and duration. Raises ValueError if invalid."""
    validate_video_file_size(file_path)
    validate_video_duration(file_path)
```

## Rate Limiting

The `/assessments/analyze` endpoint is computationally expensive (CV processing). Implement rate limiting:

| Limit | Value | Scope |
|-------|-------|-------|
| Requests | 50 | Per hour |
| Scope | Per coach | By `user.id` |
| Response | 429 | When exceeded |

**Implementation:**

```python
# app/middleware/rate_limit.py
from datetime import datetime, timedelta
from collections import defaultdict
from fastapi import HTTPException, status

# Simple in-memory rate limiter (use Redis in production)
class RateLimiter:
    def __init__(self, max_requests: int = 50, window_hours: int = 1):
        self.max_requests = max_requests
        self.window = timedelta(hours=window_hours)
        self.requests = defaultdict(list)  # user_id -> [timestamp, ...]

    def check(self, user_id: str) -> bool:
        now = datetime.utcnow()
        cutoff = now - self.window

        # Remove old requests
        self.requests[user_id] = [
            ts for ts in self.requests[user_id] if ts > cutoff
        ]

        if len(self.requests[user_id]) >= self.max_requests:
            return False

        self.requests[user_id].append(now)
        return True

# Singleton for video analysis
video_analysis_limiter = RateLimiter(max_requests=50, window_hours=1)

def check_analysis_rate_limit(user_id: str):
    """Check rate limit for video analysis. Raises HTTPException if exceeded."""
    if not video_analysis_limiter.check(user_id):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Maximum 50 video analyses per hour."
        )
```

**Usage in endpoint (add to routers/assessments.py):**

```python
from app.middleware.rate_limit import check_analysis_rate_limit

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_video_endpoint(
    data: AnalyzeRequest,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user)
):
    # Check rate limit first
    check_analysis_rate_limit(user.id)

    # ... rest of endpoint
```

## Files to Create/Modify

```
backend/app/
├── routers/
│   └── assessments.py           # Assessment endpoints
├── models/
│   └── assessment.py            # Assessment Pydantic models
├── repositories/
│   └── assessment.py            # Assessment repository
├── services/
│   └── video.py                 # Video download service
└── main.py                      # Register assessments router (modify)
```

## Implementation Details

### models/assessment.py
```python
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Literal
from enum import Enum

class TestType(str, Enum):
    ONE_LEG_BALANCE = "one_leg_balance"

class LegTested(str, Enum):
    LEFT = "left"
    RIGHT = "right"

class AssessmentStatus(str, Enum):
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class FailureReason(str, Enum):
    TIME_COMPLETE = "time_complete"
    FOOT_TOUCHDOWN = "foot_touchdown"
    SUPPORT_FOOT_MOVED = "support_foot_moved"

class MetricsData(BaseModel):
    duration_seconds: float = 0
    stability_score: float = 0
    sway_std_x: float = 0
    sway_std_y: float = 0
    sway_path_length: float = 0
    sway_velocity: float = 0
    arm_excursion_left: float = 0
    arm_excursion_right: float = 0
    arm_asymmetry_ratio: float = 0
    corrections_count: int = 0
    failure_reason: Optional[FailureReason] = None

class AssessmentCreate(BaseModel):
    athlete_id: str
    test_type: TestType
    leg_tested: LegTested
    video_url: str
    video_path: str

class Assessment(BaseModel):
    id: str
    athlete_id: str
    coach_id: str
    test_type: TestType
    leg_tested: LegTested
    created_at: datetime
    status: AssessmentStatus = AssessmentStatus.PROCESSING
    video_url: str
    video_path: str
    raw_keypoints_url: Optional[str] = None
    metrics: Optional[MetricsData] = None
    ai_feedback: Optional[str] = None
    coach_notes: Optional[str] = None

class AssessmentResponse(BaseModel):
    id: str
    athlete_id: str
    test_type: str
    leg_tested: str
    created_at: datetime
    status: str
    metrics: Optional[MetricsData] = None
    ai_feedback: Optional[str] = None

class AnalyzeRequest(BaseModel):
    athlete_id: str
    test_type: TestType
    leg_tested: LegTested
    video_url: str
    video_path: str

class AnalyzeResponse(BaseModel):
    id: str
    status: str
    message: str
```

### repositories/assessment.py
```python
from datetime import datetime
from typing import Optional, List
from app.firebase.repository import BaseRepository
from app.models.assessment import Assessment, AssessmentCreate, AssessmentStatus

class AssessmentRepository(BaseRepository[Assessment]):
    def __init__(self):
        super().__init__("assessments", Assessment)

    async def create_for_analysis(
        self,
        coach_id: str,
        data: AssessmentCreate
    ) -> Assessment:
        """Create new assessment in processing state"""
        assessment_data = {
            "athlete_id": data.athlete_id,
            "coach_id": coach_id,
            "test_type": data.test_type.value,
            "leg_tested": data.leg_tested.value,
            "created_at": datetime.utcnow(),
            "status": AssessmentStatus.PROCESSING.value,
            "video_url": data.video_url,
            "video_path": data.video_path,
            "raw_keypoints_url": None,
            "metrics": None,
            "ai_feedback": None,
            "coach_notes": None,
        }

        doc_ref = self.collection.document()
        doc_ref.set(assessment_data)

        return Assessment(id=doc_ref.id, **assessment_data)

    async def get_by_athlete(
        self,
        athlete_id: str,
        limit: int = 50
    ) -> List[Assessment]:
        """Get assessments for an athlete"""
        docs = (
            self.collection
            .where("athlete_id", "==", athlete_id)
            .order_by("created_at", direction="DESCENDING")
            .limit(limit)
            .stream()
        )
        return [Assessment(id=doc.id, **doc.to_dict()) for doc in docs]

    async def get_by_coach(
        self,
        coach_id: str,
        limit: int = 50
    ) -> List[Assessment]:
        """Get recent assessments for a coach"""
        docs = (
            self.collection
            .where("coach_id", "==", coach_id)
            .order_by("created_at", direction="DESCENDING")
            .limit(limit)
            .stream()
        )
        return [Assessment(id=doc.id, **doc.to_dict()) for doc in docs]

    async def update_with_results(
        self,
        assessment_id: str,
        metrics: dict,
        raw_keypoints_url: str,
        ai_feedback: str
    ):
        """Update assessment with analysis results"""
        await self.update(assessment_id, {
            "status": AssessmentStatus.COMPLETED.value,
            "metrics": metrics,
            "raw_keypoints_url": raw_keypoints_url,
            "ai_feedback": ai_feedback,
        })

    async def mark_failed(self, assessment_id: str, reason: str):
        """Mark assessment as failed"""
        await self.update(assessment_id, {
            "status": AssessmentStatus.FAILED.value,
            "ai_feedback": f"Analysis failed: {reason}",
        })
```

### services/video.py
```python
import tempfile
import os
from urllib.parse import urlparse
from firebase_admin import storage
import httpx

async def download_video_from_storage(
    video_url: str,
    video_path: str
) -> str:
    """
    Download video from Firebase Storage to temp file.
    Returns path to temp file.
    """
    # Create temp file
    suffix = os.path.splitext(video_path)[1] or '.webm'
    temp_file = tempfile.NamedTemporaryFile(suffix=suffix, delete=False)

    try:
        # Download from Firebase Storage
        bucket = storage.bucket()
        blob = bucket.blob(video_path)

        if not blob.exists():
            raise ValueError(f"Video not found at path: {video_path}")

        blob.download_to_filename(temp_file.name)
        return temp_file.name

    except Exception as e:
        # Clean up temp file on error
        if os.path.exists(temp_file.name):
            os.unlink(temp_file.name)
        raise e

def cleanup_temp_file(file_path: str):
    """Remove temporary file"""
    if file_path and os.path.exists(file_path):
        os.unlink(file_path)
```

### routers/assessments.py
```python
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.athlete import ConsentStatus
from app.models.assessment import (
    AnalyzeRequest,
    AnalyzeResponse,
    AssessmentResponse,
)
from app.repositories.athlete import AthleteRepository
from app.repositories.assessment import AssessmentRepository
from app.services.video import download_video_from_storage, cleanup_temp_file

router = APIRouter(prefix="/assessments", tags=["assessments"])

async def process_assessment(assessment_id: str, video_path: str):
    """Background task to process assessment"""
    # This will be implemented in BE-007
    from app.services.analysis import analyze_video

    assessment_repo = AssessmentRepository()
    temp_file = None

    try:
        # Download video
        temp_file = await download_video_from_storage("", video_path)

        # Run analysis (BE-007)
        results = await analyze_video(assessment_id, temp_file)

        # Update assessment with results
        await assessment_repo.update_with_results(
            assessment_id,
            metrics=results["metrics"],
            raw_keypoints_url=results["raw_keypoints_url"],
            ai_feedback=results["ai_feedback"],
        )

    except Exception as e:
        await assessment_repo.mark_failed(assessment_id, str(e))

    finally:
        if temp_file:
            cleanup_temp_file(temp_file)

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_video_endpoint(
    data: AnalyzeRequest,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user)
):
    """
    Submit video for analysis.
    Returns immediately with assessment ID.
    Analysis runs in background.
    """
    athlete_repo = AthleteRepository()
    assessment_repo = AssessmentRepository()

    # Validate athlete ownership
    athlete = await athlete_repo.get_if_owned(data.athlete_id, user.id)
    if not athlete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete not found"
        )

    # Validate consent status
    if athlete.consent_status != ConsentStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Parental consent required before assessment"
        )

    # Create assessment record
    assessment = await assessment_repo.create_for_analysis(user.id, data)

    # Queue background processing
    background_tasks.add_task(
        process_assessment,
        assessment.id,
        data.video_path
    )

    return AnalyzeResponse(
        id=assessment.id,
        status="processing",
        message="Video analysis started"
    )
```

## API Specification

### POST /assessments/analyze

**Request:**
```json
{
  "athlete_id": "athlete_123",
  "test_type": "one_leg_balance",
  "leg_tested": "left",
  "video_url": "https://storage.googleapis.com/...",
  "video_path": "assessments/athlete_123/1704067200.webm"
}
```

**Response 200:**
```json
{
  "id": "assessment_456",
  "status": "processing",
  "message": "Video analysis started"
}
```

**Response 400:**
```json
{
  "detail": "Parental consent required before assessment"
}
```

**Response 404:**
```json
{
  "detail": "Athlete not found"
}
```

## Video URL Expiration Convention

Video URLs stored in Firestore should use signed URLs with expiration:

| URL Type | Expiration | Usage |
|----------|------------|-------|
| video_url | 1 hour | For playback in assessment results |
| raw_keypoints_url | 1 hour | For debugging/analysis |

**Implementation**: When returning assessment data, regenerate signed URLs:

```python
from firebase_admin import storage

def get_signed_url(video_path: str, expiration_hours: int = 1) -> str:
    """Generate signed URL for Firebase Storage file"""
    bucket = storage.bucket()
    blob = bucket.blob(video_path)
    return blob.generate_signed_url(
        expiration=timedelta(hours=expiration_hours),
        method='GET'
    )
```

## Firestore Security Rules

```javascript
match /assessments/{assessmentId} {
  // Coach can read their own assessments
  allow read: if request.auth != null &&
    resource.data.coach_id == request.auth.uid;

  // Only server can write (using Admin SDK)
  allow write: if false;
}
```

## Firebase Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Assessment videos - only authenticated users can read/write
    match /assessments/{athleteId}/{filename} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // Raw keypoints JSON files
    match /keypoints/{assessmentId}/{filename} {
      allow read: if request.auth != null;
      allow write: if false;  // Only server writes via Admin SDK
    }
  }
}
```

> **Note**: Storage rules allow any authenticated user to upload videos. For production, consider adding coach-athlete ownership validation.

## Estimated Complexity
**M** (Medium) - 3-4 hours

## Testing Instructions

1. Upload a video via client
2. Call analyze endpoint:
```bash
curl -X POST http://localhost:8000/assessments/analyze \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "athlete_id": "athlete_123",
    "test_type": "one_leg_balance",
    "leg_tested": "left",
    "video_url": "https://...",
    "video_path": "assessments/athlete_123/123.webm"
  }'
```

3. Verify response contains assessment ID
4. Verify assessment record created in Firestore with "processing" status
5. Test with non-existent athlete - should return 404
6. Test with pending-consent athlete - should return 400

## Notes
- Background task processing requires BE-007 for actual analysis
- Consider using Celery or similar for production task queue
- Video download timeout should be reasonable for large files
- Temp files must be cleaned up to avoid disk space issues

## Post-MVP: Redis for Rate Limiting

The current in-memory rate limiter (50 requests/hour/coach) works for single-instance deployment but will **not work** for multi-instance deployments.

See [BE-005](BE-005-consent-workflow.md#post-mvp-redis-for-rate-limiting) for Redis migration pattern. Use the same `RedisRateLimiter` class with:
- `max_requests=50`
- `window_seconds=3600` (1 hour)
- Key format: `rate:analysis:{user_id}`
