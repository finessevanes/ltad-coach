# AI Coach - Backend

> Python + FastAPI REST API with Firebase and Claude AI

This is the backend API for the AI Coach platform. It validates assessments with client-calculated metrics, manages data in Firebase, and serves the frontend application.

> **Note**: The architecture has evolved from the original PRD. Video analysis (MediaPipe) now runs client-side, with the backend serving as a validated write proxy. AI agents (Phase 7) are not yet implemented.

[← Back to Project Overview](../README.md)

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.11 | Programming language |
| FastAPI | Latest | REST API framework |
| pip + requirements.txt | - | Dependency management |
| Firebase Admin SDK | Latest | Auth, Firestore, Storage |
| OpenRouter | API | Claude access (Phase 7 - not yet implemented) |
| Resend | API | Transactional emails |
| Uvicorn | Latest | ASGI server |
| Pydantic | v2 | Data validation |

---

## Prerequisites

- **Python** 3.11+
- **pip** for package management
- **Firebase** project with Admin SDK credentials
- **Resend** API key for sending emails
- **Frontend** running (see [../client/README.md](../client/README.md))
- **OpenRouter** API key (optional - for Phase 7 AI agents)

---

## Getting Started

### 1. Create Virtual Environment

```bash
cd backend
python -m venv venv

# Activate (macOS/Linux)
source venv/bin/activate

# Activate (Windows)
.\venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Firebase Service Account Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Project Settings** (gear icon)
4. Go to **Service accounts** tab
5. Click **Generate new private key**
6. Download the JSON file
7. Save it as `backend/ltad-coach-firebase-adminsdk-*.json`
8. **DO NOT commit to git** (already in `.gitignore`)

### 4. Environment Configuration

Create `backend/.env` file:

```bash
# Frontend URL (for CORS and email links)
FRONTEND_URL=http://localhost:5173

# Backend URL (for self-reference)
API_BASE_URL=http://localhost:8000

# Firebase Admin SDK
GOOGLE_APPLICATION_CREDENTIALS=./ltad-coach-firebase-adminsdk-xxxxx.json
FIREBASE_PROJECT_ID=ltad-coach
FIREBASE_STORAGE_BUCKET=ltad-coach.firebasestorage.app

# OpenRouter API (for Claude)
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1  # Optional (has default)

# Resend API (for emails)
RESEND_API_KEY=re_...

# CORS (optional, has default)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

See [Environment Variables](#environment-variables) section for details.

### 5. Run Development Server

```bash
uvicorn app.main:app --reload
```

Server will be available at:
- **API**: http://localhost:8000
- **Interactive Docs (Swagger)**: http://localhost:8000/docs
- **Alternative Docs (ReDoc)**: http://localhost:8000/redoc

The `--reload` flag enables hot-reload (server restarts on code changes).

### 6. Verify Setup

Visit http://localhost:8000/docs - you should see the interactive API documentation.

Try the health check endpoint:
```bash
curl http://localhost:8000/health
# Expected: {"status": "healthy"}
```

---

## Available Commands

| Command | Description |
|---------|-------------|
| `uvicorn app.main:app --reload` | Start dev server with hot-reload |
| `pytest` | Run all tests |
| `pytest --cov=app tests/` | Run tests with coverage report |
| `pytest tests/test_metrics.py` | Run specific test file |
| `black .` | Format code with Black |
| `isort .` | Sort imports |
| `mypy .` | Type checking |
| `ruff check .` | Lint with Ruff |

---

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app initialization
│   ├── config.py            # Environment configuration
│   ├── firebase.py          # Firebase Admin SDK initialization
│   │
│   ├── routers/             # API endpoints
│   │   ├── __init__.py
│   │   ├── auth.py          # Authentication endpoints
│   │   ├── athletes.py      # Athlete CRUD
│   │   ├── consent.py       # Consent workflow (public)
│   │   └── assessments.py   # Assessment storage (client-calculated metrics)
│   │
│   ├── services/            # Business logic
│   │   ├── email.py         # Email sending via Resend
│   │   ├── video.py         # Video validation utilities
│   │   └── metrics.py       # Duration scoring (LTAD benchmarks)
│   │
│   ├── repositories/        # Data access layer
│   │   ├── base.py          # Generic Firestore CRUD
│   │   ├── user.py          # User operations
│   │   ├── athlete.py       # Athlete operations
│   │   └── assessment.py    # Assessment operations
│   │
│   ├── models/              # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── athlete.py       # Athlete models
│   │   ├── assessment.py    # Assessment + metrics models
│   │   ├── consent.py       # Consent form models
│   │   ├── user.py          # User models
│   │   └── errors.py        # Error response models
│   │
│   ├── middleware/          # Request middleware
│   │   ├── auth.py          # Firebase token validation
│   │   └── rate_limit.py    # In-memory rate limiting
│   │
│   ├── constants/           # Application constants
│   │   └── scoring.py       # LTAD scoring thresholds
│   │
│   ├── agents/              # AI agents (Phase 7 - NOT YET IMPLEMENTED)
│   │   └── (empty)
│   │
│   └── prompts/             # AI prompts (Phase 7 - NOT YET IMPLEMENTED)
│       └── (empty)
│
├── tests/                   # Test suite (empty - tests not yet written)
│
├── prds/                    # Backend PRD specifications
│   ├── BE-001-project-setup.md
│   ├── BE-002-firebase-integration.md
│   ├── ...
│   └── BE-015-dashboard-endpoint.md
│
├── requirements.txt         # Python dependencies
├── render.yaml              # Render deployment config
├── runtime.txt              # Python version (3.11.9)
├── .env                     # Environment variables (not committed)
├── .gitignore
└── README.md                # This file
```

---

## API Endpoints

Interactive documentation with request/response examples available at http://localhost:8000/docs

### Health Check

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Server status and Firebase connection check | No |

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/token` | Validate Firebase JWT and return user data | Yes (Firebase ID token) |
| POST | `/auth/logout` | Logout (server-side cleanup) | Yes |

### Athletes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/athletes` | List all athletes for coach (optional consent status filter) | Yes |
| POST | `/athletes` | Create athlete (triggers consent email) | Yes |
| GET | `/athletes/{id}` | Get single athlete details | Yes |
| PUT | `/athletes/{id}` | Update athlete information | Yes |
| DELETE | `/athletes/{id}` | Delete athlete from roster | Yes |
| POST | `/athletes/{id}/resend-consent` | Resend consent email (rate limited) | Yes |

### Consent (Public - No Auth)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/consent/{token}` | Get consent form data | No |
| POST | `/consent/{token}/sign` | Parent provides consent | No |
| POST | `/consent/{token}/decline` | Parent declines consent | No |

### Assessments

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/assessments/analyze` | Store assessment with client-calculated metrics | Yes |
| GET | `/assessments/{id}` | Get single assessment details | Yes |
| GET | `/assessments/athlete/{athlete_id}` | Get all assessments for an athlete | Yes |

> **Note**: The `/assessments/analyze` endpoint now expects client-calculated metrics. The client is the source of truth for all CV metrics. The backend validates ownership/consent and calculates LTAD duration scores.

### Not Yet Implemented (Phase 7+)

The following endpoints are documented in PRDs but not yet implemented:

| Endpoint | PRD | Status |
|----------|-----|--------|
| `/reports/*` | BE-013, BE-014 | Phase 9 |
| `/dashboard` | BE-015 | Phase 10 |
| `/assessments/{id}/notes` | BE-012 | Phase 8 |

---

## Key Features

### Assessment Storage (Current Implementation)

> **Architecture Change**: The original PRD specified server-side MediaPipe analysis. The current implementation uses client-side MediaPipe, with the backend serving as a validated write proxy.

**Current Flow**:
1. Client records video and calculates all metrics using MediaPipe.js
2. Client uploads video to Firebase Storage
3. Client sends metrics + video URL to backend via `/assessments/analyze`
4. Backend validates:
   - Coach authentication
   - Athlete ownership
   - Consent status (must be "active")
5. Backend calculates LTAD duration score from hold time
6. Backend stores assessment as "completed" immediately
7. Returns assessment ID to client

**Example** (actual implementation):
```python
@router.post("/assessments/analyze", response_model=AnalyzeResponse)
async def analyze_video_endpoint(
    data: AssessmentCreate,
    current_user: User = Depends(get_current_user),
):
    """Store assessment with client-calculated metrics.

    The client is now the source of truth for all metrics. This endpoint:
    1. Validates athlete ownership and consent
    2. Calculates backend-only scores (duration_score, age_expectation)
    3. Stores the assessment as completed immediately
    """
    # Client metrics are required
    if not data.client_metrics:
        raise HTTPException(status_code=400, detail="Client metrics are required")

    # Validate athlete ownership and consent
    athlete = await athlete_repo.get_if_owned(data.athlete_id, current_user.id)
    if athlete.consent_status != "active":
        raise HTTPException(status_code=400, detail="Active consent required")

    # Calculate backend-only scores
    duration_score, label = get_duration_score(data.client_metrics.hold_time)
    age_expectation = get_age_expectation(athlete.age, duration_score)

    # Create assessment as completed (no background processing)
    assessment = await assessment_repo.create_completed(...)

    return AnalyzeResponse(id=assessment.id, status="completed")
```

### LTAD Duration Scoring (Backend Calculation)

The backend calculates duration-based scores using LTAD benchmarks:

| Score | Label | Duration | Ages 5-6 | Age 7 | Ages 8-9 | Ages 10-11 | Ages 12-13 |
|-------|-------|----------|----------|-------|----------|------------|------------|
| 1 | Beginning | 1-9 sec | Expected | Below | Below | Below | Below |
| 2 | Developing | 10-14 sec | Above | Expected | Below | Below | Below |
| 3 | Competent | 15-19 sec | Above | Above | Expected | Below | Below |
| 4 | Proficient | 20-24 sec | Above | Above | Above | Expected | Below |
| 5 | Advanced | 25-30 sec | Above | Above | Above | Above | Expected |

**Implementation** (`app/services/metrics.py`):
```python
def get_duration_score(duration: float) -> tuple[int, str]:
    """Map duration to LTAD score (1-5) and label."""
    if duration >= 25:
        return 5, "Advanced"
    elif duration >= 20:
        return 4, "Proficient"
    elif duration >= 15:
        return 3, "Competent"
    elif duration >= 10:
        return 2, "Developing"
    else:
        return 1, "Beginning"

def get_age_expectation(age: int, score: int) -> str:
    """Compare score to age-based expectation."""
    expected = AGE_EXPECTED_SCORES.get(age, 3)
    if score > expected:
        return "above"
    elif score < expected:
        return "below"
    return "meets"
```

### AI Agent System (Phase 7 - NOT YET IMPLEMENTED)

The following AI agent architecture is planned but not yet implemented:

| Agent | Model | Purpose | Status |
|-------|-------|---------|--------|
| **Orchestrator** | Python logic | Route requests | ❌ Not implemented |
| **Compression** | Claude Haiku | Summarize history | ❌ Not implemented |
| **Assessment** | Claude Sonnet | Single test feedback | ❌ Not implemented |
| **Progress** | Claude Sonnet | Trend analysis | ❌ Not implemented |

See PRDs BE-009, BE-010, BE-011 for planned implementation.

### Client-Side Metrics (Source of Truth)

All CV metrics are now calculated client-side. The client sends these metrics:

| Metric | Type | Description |
|--------|------|-------------|
| `hold_time` | float | Duration athlete maintained balance (0-30s) |
| `stability_score` | float | Composite stability score (0-100) |
| `sway_std_x` | float | Std dev of lateral hip movement |
| `sway_std_y` | float | Std dev of vertical hip movement |
| `sway_path_length` | float | Total hip trajectory distance |
| `sway_velocity` | float | Average hip movement speed |
| `arm_deviation_left` | float | Left arm deviation from starting position |
| `arm_deviation_right` | float | Right arm deviation from starting position |
| `arm_asymmetry_ratio` | float | Left/right arm ratio |
| `corrections_count` | int | Number of balance corrections |
| `failure_reason` | string | "time_complete", "foot_touchdown", or "support_foot_moved" |

See [client/README.md](../client/README.md) for metric calculation details.

---

## Code Patterns

### FastAPI Route with Authentication

```python
from fastapi import APIRouter, Depends, HTTPException, status
from app.middleware.auth import get_current_user
from app.models.user import User
from app.repositories.athlete import AthleteRepository

router = APIRouter(prefix="/athletes", tags=["athletes"])

@router.get("/")
async def list_athletes(
    consent_status: str | None = None,
    current_user: User = Depends(get_current_user)
):
    """Get all athletes for authenticated coach"""
    athlete_repo = AthleteRepository()
    athletes = await athlete_repo.get_by_coach(
        current_user.id,
        consent_status=consent_status
    )
    return {"athletes": athletes, "total": len(athletes)}

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_athlete(
    data: AthleteCreate,
    current_user: User = Depends(get_current_user)
):
    """Create new athlete and send consent email"""
    athlete_repo = AthleteRepository()
    athlete = await athlete_repo.create_for_coach(
        coach_id=current_user.id,
        data=data.model_dump()
    )

    # Send consent email asynchronously
    asyncio.create_task(
        send_consent_request(
            parent_email=data.parent_email,
            athlete_name=data.name,
            consent_token=athlete.consent_token
        )
    )

    return athlete
```

### Repository Pattern

```python
from app.repositories.base import BaseRepository
from app.models.athlete import Athlete

class AthleteRepository(BaseRepository[Athlete]):
    """Data access layer for athletes"""

    def __init__(self):
        super().__init__("athletes", Athlete)

    async def get_by_coach(
        self,
        coach_id: str,
        consent_status: str | None = None
    ) -> list[Athlete]:
        """Get all athletes for a coach"""
        query = self.collection.where("coach_id", "==", coach_id)
        if consent_status:
            query = query.where("consent_status", "==", consent_status)
        docs = query.stream()
        return [self._doc_to_model(doc) for doc in docs]

    async def get_if_owned(
        self,
        athlete_id: str,
        coach_id: str
    ) -> Athlete | None:
        """Get athlete only if owned by coach (security check)"""
        athlete = await self.get(athlete_id)
        if athlete and athlete.coach_id == coach_id:
            return athlete
        return None
```

### Pydantic Models

```python
from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from typing import Optional, Literal
from enum import Enum

class ConsentStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    DECLINED = "declined"

class AthleteCreate(BaseModel):
    """Schema for creating new athlete"""
    name: str = Field(..., min_length=1, max_length=100)
    age: int = Field(..., ge=5, le=13)
    gender: Literal["male", "female", "other"]
    parent_email: EmailStr

class Athlete(BaseModel):
    """Schema for athlete with DB fields"""
    id: str
    coach_id: str
    name: str
    age: int
    gender: str
    parent_email: str
    consent_status: ConsentStatus = ConsentStatus.PENDING
    consent_token: str
    consent_timestamp: Optional[datetime] = None
    created_at: datetime

class ClientMetricsData(BaseModel):
    """Schema for client-calculated metrics (source of truth)"""
    hold_time: float = Field(..., ge=0, le=30)
    stability_score: float = Field(..., ge=0, le=100)
    sway_std_x: float = Field(..., ge=0)
    sway_std_y: float = Field(..., ge=0)
    sway_path_length: float = Field(..., ge=0)
    sway_velocity: float = Field(..., ge=0)
    arm_deviation_left: float = Field(..., ge=0)
    arm_deviation_right: float = Field(..., ge=0)
    arm_asymmetry_ratio: float = Field(..., ge=0)
    corrections_count: int = Field(..., ge=0)
    failure_reason: Literal[
        "time_complete",
        "foot_touchdown",
        "support_foot_moved"
    ]
```

---

## Environment Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `FRONTEND_URL` | Frontend URL for CORS and email links | `http://localhost:5173` | Yes |
| `API_BASE_URL` | Backend's own URL for self-reference | `http://localhost:8000` | Yes |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to Firebase service account JSON | `./ltad-coach-firebase-adminsdk-xxxxx.json` | Yes |
| `FIREBASE_PROJECT_ID` | Firebase project identifier | `ltad-coach` | Yes |
| `FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket name | `ltad-coach.firebasestorage.app` | Yes |
| `OPENROUTER_API_KEY` | OpenRouter API key for Claude access | `sk-or-v1-...` | Yes |
| `OPENROUTER_BASE_URL` | OpenRouter API base URL | `https://openrouter.ai/api/v1` | No (has default) |
| `RESEND_API_KEY` | Resend API key for sending emails | `re_...` | Yes |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `http://localhost:5173,http://localhost:3000` | No (has default) |

**Firebase Service Account JSON** should contain:
- `type`: "service_account"
- `project_id`: Your Firebase project ID
- `private_key_id`: Key identifier
- `private_key`: RSA private key
- `client_email`: Service account email
- `client_id`: Client identifier

---

## Database Schema (Firestore)

### Collections

#### `users/{userId}`

| Field | Type | Description |
|-------|------|-------------|
| email | string | Coach email address |
| name | string | Coach full name |
| createdAt | timestamp | Account creation time |
| athleteCount | number | Current number of athletes (soft limit: 25) |

#### `athletes/{athleteId}`

| Field | Type | Description |
|-------|------|-------------|
| coachId | string | Reference to user |
| name | string | Athlete full name |
| age | number | Athlete age (5-13) |
| gender | string | 'male' \| 'female' \| 'other' |
| parentEmail | string | Parent/guardian email |
| consentStatus | string | 'pending' \| 'active' \| 'declined' |
| consentToken | string | Unique token for consent form URL |
| consentTimestamp | timestamp | When consent was provided (null if pending) |
| createdAt | timestamp | When athlete was added |

#### `assessments/{assessmentId}`

| Field | Type | Description |
|-------|------|-------------|
| athleteId | string | Reference to athlete |
| coachId | string | Reference to user |
| testType | string | 'one_leg_balance' (extensible) |
| legTested | string | 'left' \| 'right' |
| createdAt | timestamp | Assessment timestamp |
| videoUrl | string | Firebase Storage path |
| rawKeypointsUrl | string | Firebase Storage path to keypoints JSON |
| status | string | 'processing' \| 'completed' \| 'failed' |
| metrics | object | AssessmentMetrics (see schema above) |
| aiFeedback | string | Generated feedback from Assessment Agent |
| coachNotes | string | Optional coach annotations |

#### `parent_reports/{reportId}`

| Field | Type | Description |
|-------|------|-------------|
| athleteId | string | Reference to athlete |
| coachId | string | Reference to coach |
| createdAt | timestamp | Report generation time |
| accessPin | string | 6-digit PIN for access |
| reportContent | string | Generated report from Progress Agent |
| assessmentIds | array | List of assessment IDs included |
| sentAt | timestamp | When email was sent |

See [prd.md Section 5](../prd.md#5-data-models--database-schema) for complete schema.

---

## Testing

### Run Tests

```bash
# All tests
pytest

# With coverage report
pytest --cov=app tests/

# Specific test file
pytest tests/test_metrics.py

# Specific test function
pytest tests/test_metrics.py::test_calculate_stability_score

# Verbose output
pytest -v

# Stop on first failure
pytest -x
```

### Test Structure

```python
import pytest
from app.services.metrics_calculator import calculate_stability_score

def test_calculate_stability_score():
    """Test stability score calculation"""
    metrics = {
        "swayStdX": 0.05,
        "swayStdY": 0.03,
        "armExcursion": 10.5,
        "correctionsCount": 2,
        "durationSeconds": 25
    }

    score = calculate_stability_score(metrics)

    assert 0 <= score <= 100
    assert isinstance(score, float)

@pytest.mark.asyncio
async def test_process_video():
    """Test async video processing"""
    video_url = "https://storage.example.com/test.mp4"
    result = await process_video_async("test_id", video_url)
    assert result["status"] == "completed"
```

### Test Coverage Goals

- **Target**: >80% coverage
- **Critical paths**: 100% (auth, video analysis, AI agents)
- **Utils**: 70%+

---

## Deployment

### Render (Recommended)

1. **Create Web Service**
   - Go to [Render Dashboard](https://render.com/)
   - Click "New +" → "Web Service"
   - Connect GitHub repository
   - Select `backend/` as root directory

2. **Configure Build Settings**
   - **Name**: ltad-coach-api
   - **Environment**: Python 3.11
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

3. **Set Environment Variables**
   - Add all variables from `.env` file
   - For `GOOGLE_APPLICATION_CREDENTIALS`, paste JSON content as environment variable

4. **Deploy**
   - Deploys automatically on push to `main` branch
   - Manual deploy option available

### Alternative: Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Copy dependencies
COPY requirements.txt ./
RUN pip install -r requirements.txt

# Copy application
COPY app ./app

# Run
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Troubleshooting

### Firebase Authentication Errors

**Issue**: `google.auth.exceptions.DefaultCredentialsError`

**Solutions**:
- Verify `GOOGLE_APPLICATION_CREDENTIALS` path in `.env`
- Check service account JSON file exists
- Ensure file has correct permissions (`chmod 600`)
- Try absolute path instead of relative

### OpenRouter API Errors

**Issue**: `401 Unauthorized` or `429 Rate Limit`

**Solutions**:
- Verify `OPENROUTER_API_KEY` is correct
- Check account has sufficient credits
- Implement exponential backoff for retries
- Use mock responses during development

### Slow API Responses

**Issue**: API calls taking too long

**Solutions**:
- Check Firestore query indexes in Firebase Console
- Ensure proper async/await usage (no blocking calls)
- Consider caching frequently accessed data

---

## Performance Optimization

### Async/Await Best Practices

Always use `async`/`await` for I/O operations:

```python
# ✅ Good
async def fetch_athlete(athlete_id: str):
    doc = await db.athletes.document(athlete_id).get()
    return doc.to_dict()

# ❌ Bad
def fetch_athlete(athlete_id: str):
    doc = db.athletes.document(athlete_id).get()  # Blocks event loop
    return doc.to_dict()
```

### Database Query Optimization

- Use indexes for frequently queried fields
- Limit query results (`limit()`)
- Use `select()` to fetch only needed fields
- Batch operations when possible

### Rate Limiting

The backend uses in-memory rate limiting for MVP:

```python
from app.middleware.rate_limit import RateLimiter

# 50 requests per hour per user
analysis_rate_limiter = RateLimiter(max_requests=50, window_seconds=3600)

# In route handler:
analysis_rate_limiter.check_or_raise(current_user.id)
```

> **Note**: In-memory rate limiting only works for single-instance deployments. For production scaling, migrate to Redis.

---

## Security

### Authentication Flow

1. Client obtains Firebase ID token
2. Client includes token in `Authorization: Bearer <token>` header
3. Backend validates token with Firebase Admin SDK via `get_current_user()` middleware
4. Backend extracts user ID from token
5. Backend enforces data access rules via repository layer

### Data Access Rules

- Coaches can only access their own data
- Athletes belong to exactly one coach (enforced via `get_if_owned()`)
- Assessments belong to exactly one coach
- Consent forms are public (token-based, no auth)

### Rate Limiting (Current Implementation)

- Assessment submission: 50 per hour per coach
- Consent resend: Rate limited to prevent spam

**MVP Implementation**: In-memory rate limiting (single instance)
**Post-MVP**: Migrate to Redis for multi-instance support

---

## Related Documentation

- [Frontend Setup](../client/README.md) - React and TypeScript setup
- [Developer Guide](../CLAUDE.md) - Comprehensive patterns and standards
- [Product Requirements](../prd.md) - Full technical specifications
- [Backend PRDs](./prds/) - Detailed feature specs (BE-001 to BE-015)

---

## Code Standards

### General

- **Type hints** on all functions (required)
- **Google-style docstrings** (required for public functions)
- **4-space indentation** (enforced by Black)
- **Async/await** for all I/O operations
- **Pydantic** for data validation

### Function Example

```python
async def calculate_metrics(
    keypoints: List[Landmark],
    test_type: str = "one_leg_balance"
) -> AssessmentMetrics:
    """
    Calculate derived metrics from pose landmarks.

    Args:
        keypoints: List of MediaPipe landmarks for each frame
        test_type: Type of test being analyzed (default: one_leg_balance)

    Returns:
        AssessmentMetrics object with all calculated values

    Raises:
        ValueError: If keypoints list is empty or invalid
    """
    if not keypoints:
        raise ValueError("Keypoints list cannot be empty")

    duration = calculate_duration(keypoints)
    sway = calculate_sway_metrics(keypoints)
    stability = calculate_stability_score(sway, duration)

    return AssessmentMetrics(
        durationSeconds=duration,
        stabilityScore=stability,
        **sway
    )
```

### Import Order

1. Standard library
2. Third-party packages
3. Local application imports

```python
import asyncio
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.middleware.auth import get_current_user
from app.models.athlete import Athlete
from app.repositories.athlete import AthleteRepository
from app.firebase import db
```

### Naming Conventions

- **Functions/variables**: snake_case (`calculate_metrics`, `athlete_id`)
- **Classes**: PascalCase (`AssessmentMetrics`, `VideoProcessor`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_ATHLETES`, `DEFAULT_TIMEOUT`)
- **Private**: Prefix with underscore (`_internal_helper`)

See [CLAUDE.md](../CLAUDE.md) for complete coding standards.

---

## Support

For questions or issues:
- Check [Troubleshooting](#troubleshooting) section above
- Review [CLAUDE.md](../CLAUDE.md) for patterns
- Check PRD files in `prds/` directory
- Create an issue on GitHub
