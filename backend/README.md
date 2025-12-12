# AI Coach - Backend

> Python + FastAPI REST API with MediaPipe and Claude AI

This is the backend API for the AI Coach platform. It handles video analysis using MediaPipe, generates AI-powered feedback using Claude, manages data in Firebase, and serves the frontend application.

[← Back to Project Overview](../README.md)

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.11 | Programming language |
| FastAPI | Latest | REST API framework |
| pip + requirements.txt | - | Dependency management |
| MediaPipe | v0.10.9 | Pose detection |
| Firebase Admin SDK | Latest | Auth, Firestore, Storage |
| OpenRouter | API | Claude access |
| Resend | API | Transactional emails |
| Uvicorn | Latest | ASGI server |
| Pydantic | v2 | Data validation |

---

## Prerequisites

- **Python** 3.11+ (MediaPipe requires 3.11, not 3.12+)
- **pip** for package management
- **Firebase** project with Admin SDK credentials
- **OpenRouter** API key for Claude models
- **Resend** API key for sending emails
- **Frontend** running (see [../client/README.md](../client/README.md))

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
│   │
│   ├── routes/              # API endpoints
│   │   ├── __init__.py
│   │   ├── auth.py          # Authentication endpoints
│   │   ├── athletes.py      # Athlete CRUD
│   │   ├── consent.py       # Consent workflow
│   │   ├── assessments.py   # Video upload & analysis
│   │   ├── reports.py       # Parent report generation
│   │   └── dashboard.py     # Coach dashboard data
│   │
│   ├── services/            # Business logic
│   │   ├── __init__.py
│   │   ├── auth.py          # Firebase auth verification
│   │   ├── mediapipe_service.py    # Pose detection
│   │   ├── metrics_calculator.py   # Metric calculations
│   │   ├── email_service.py        # Email sending
│   │   └── storage_service.py      # Firebase Storage
│   │
│   ├── agents/              # AI agent implementations
│   │   ├── __init__.py
│   │   ├── orchestrator.py         # Routing logic
│   │   ├── compression_agent.py    # History summarization
│   │   ├── assessment_agent.py     # Single test feedback
│   │   └── progress_agent.py       # Trend analysis
│   │
│   ├── models/              # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── athlete.py
│   │   ├── assessment.py
│   │   ├── report.py
│   │   ├── user.py
│   │   └── ...
│   │
│   └── utils/               # Helpers & config
│       ├── __init__.py
│       ├── firebase.py      # Firebase initialization
│       ├── config.py        # Environment config
│       ├── exceptions.py    # Custom exceptions
│       └── ...
│
├── tests/                   # Test suite
│   ├── __init__.py
│   ├── test_metrics.py
│   ├── test_agents.py
│   ├── test_auth.py
│   └── ...
│
├── prds/                    # Backend PRD specifications
│   ├── BE-001-project-setup.md
│   ├── BE-002-firebase-integration.md
│   ├── ...
│   └── BE-015-dashboard-endpoint.md
│
├── requirements.txt         # Python dependencies
├── .env                     # Environment variables (not committed)
├── .gitignore
└── README.md                # This file
```

---

## API Endpoints

Interactive documentation with request/response examples available at http://localhost:8000/docs

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/token` | Validate Firebase JWT and create session | Yes (Firebase ID token) |
| POST | `/auth/logout` | Invalidate session | Yes |

### Athletes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/athletes` | List all athletes for authenticated coach | Yes |
| POST | `/athletes` | Create athlete (triggers consent email) | Yes |
| GET | `/athletes/{id}` | Get single athlete details | Yes |
| PUT | `/athletes/{id}` | Update athlete information | Yes |
| DELETE | `/athletes/{id}` | Delete athlete from roster | Yes |

### Consent

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/consent/{token}` | Get consent form (public) | No |
| POST | `/consent/{token}/sign` | Submit signed consent | No |
| POST | `/consent/{token}/decline` | Decline consent | No |
| POST | `/athletes/{id}/resend-consent` | Resend consent email | Yes |

### Assessments

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/assessments/analyze` | Submit video for analysis (multipart) | Yes |
| GET | `/assessments` | List all assessments for coach (activity feed) | Yes |
| GET | `/assessments/athlete/{athleteId}` | List assessments for specific athlete | Yes |
| GET | `/assessments/{id}` | Get single assessment details | Yes |
| PUT | `/assessments/{id}/notes` | Update coach notes | Yes |
| DELETE | `/assessments/{id}` | Delete assessment | Yes |

### Reports

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/reports/generate/{athleteId}` | Generate parent report preview | Yes |
| POST | `/reports/{athleteId}/send` | Send report to parent (generates PIN, sends email) | Yes |
| GET | `/reports/view/{id}` | Get report content (public, requires PIN) | No |
| POST | `/reports/view/{id}/verify` | Verify PIN for report access | No |

### Dashboard

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/dashboard` | Get coach dashboard data (stats, recent activity, pending consent) | Yes |

---

## Key Features

### Video Analysis Pipeline (BE-006, BE-007, BE-008)

**Flow**:
1. Client uploads video via multipart form data
2. Backend uploads video to Firebase Storage
3. Create assessment record with status: `"processing"`
4. Return assessment ID immediately (don't block)
5. Background task:
   - Download video from Storage
   - MediaPipe extracts pose landmarks (33 keypoints)
   - Calculate derived metrics (duration, sway, stability, etc.)
   - Store raw keypoints to Storage (context offloading)
   - Pass metrics to AI agent system
   - Generate coach-friendly feedback
6. Update assessment status: `"completed"` or `"failed"`
7. Frontend polls for completion

**Performance Requirements**:
- **NFR-2**: Video analysis <30 seconds
- **NFR-3**: AI feedback <10 seconds

**Example**:
```python
@router.post("/assessments/analyze")
async def analyze_video(
    video: UploadFile,
    athlete_id: str = Form(...),
    test_type: str = Form(...),
    leg_tested: str = Form(...),
    current_user: str = Depends(get_current_user)
):
    # Upload video to Storage
    video_url = await storage_service.upload_video(video, athlete_id)

    # Create assessment record
    assessment_id = await create_assessment(
        athlete_id=athlete_id,
        coach_id=current_user,
        video_url=video_url,
        status="processing"
    )

    # Queue background task (non-blocking)
    asyncio.create_task(process_video_async(assessment_id, video_url))

    # Return immediately
    return {"assessment_id": assessment_id, "status": "processing"}
```

### AI Agent System (BE-009, BE-010, BE-011)

Four-agent architecture using Claude via OpenRouter:

| Agent | Model | Input | Output | Cost/Call |
|-------|-------|-------|--------|-----------|
| **Orchestrator** | Python logic (no LLM) | Request type | Agent selection | $0 |
| **Compression** | Claude Haiku | 12 assessments (~6000 tokens) | Summary (~150 tokens) | ~$0.002 |
| **Assessment** | Claude Sonnet | Metrics + cached LTAD context | Coach feedback | ~$0.05 |
| **Progress** | Claude Sonnet | Compressed history + team context | Parent report | ~$0.08 |

**Deep Agent Patterns**:

1. **Context Offloading**
   - Store raw keypoints in Firebase Storage (not sent to LLM)
   - Send only derived metrics (~500 tokens) to agents
   - Reduces input tokens by 99%

2. **Context Compression**
   - Use Compression Agent (Haiku) to summarize history
   - 12 assessments (6000 tokens) → 150 tokens
   - Pass summary to Progress Agent (Sonnet)

3. **Context Isolation**
   - Each agent receives only relevant data
   - Assessment Agent: current test only
   - Progress Agent: compressed history + team context

4. **Prompt Caching**
   - Cache static LTAD benchmarks in system prompt
   - ~90% cost savings on repeated calls
   - Without caching: ~$0.44/day. With caching: ~$0.04/day (at 100 calls/day)

**Orchestrator Logic**:
```python
def route_request(request_type: str, data: dict) -> str:
    """Route request to appropriate agent (no LLM, pure logic)"""
    if request_type == "new_assessment":
        return await assessment_agent.generate_feedback(data["metrics"])

    elif request_type == "generate_report":
        # First compress history
        compressed = await compression_agent.summarize(data["history"])
        # Then generate report
        return await progress_agent.generate_report(compressed, data["current"])

    elif request_type == "view_progress":
        compressed = await compression_agent.summarize(data["history"])
        return await progress_agent.analyze_trends(compressed)
```

### MediaPipe Analysis (BE-007)

**Configuration**:
- **Model**: BlazePose (33 landmarks)
- **Frame rate**: 30 FPS minimum
- **Filtering**: Low-pass Butterworth filter (2 Hz cutoff) on landmark trajectories
- **Camera angle**: Frontal or 45-degree view preferred

**Key Landmarks**:

| Landmark | Index | Purpose |
|----------|-------|---------|
| Left Hip | 23 | Hip midpoint calculation for sway |
| Right Hip | 24 | Hip midpoint calculation for sway |
| Left Ankle | 27 | Standing foot position, foot touchdown detection |
| Right Ankle | 28 | Standing foot position, foot touchdown detection |
| Left Wrist | 15 | Arm excursion, arm stability monitoring |
| Right Wrist | 16 | Arm excursion, arm stability monitoring |
| Left Shoulder | 11 | Arm excursion reference point |
| Right Shoulder | 12 | Arm excursion reference point |

**Failure Detection**:

| Failure Type | Detection Method | Result |
|--------------|------------------|--------|
| Foot Touchdown | Raised foot Y-coordinate drops to standing foot level | Test ends, partial duration recorded |
| Support Foot Moves | Standing ankle X/Y displacement >5% of pose bounding box | Test ends, partial duration recorded |
| Time Complete | 30-second timer reaches zero | Test ends, full duration (success) |

**Example**:
```python
def detect_failure(landmarks: List[Landmark], frame_idx: int) -> Optional[str]:
    """Detect test failure conditions"""
    # Check foot touchdown
    if is_foot_touchdown(landmarks):
        return "foot_touchdown"

    # Check support foot moved
    if has_support_foot_moved(landmarks):
        return "support_foot_moved"

    # No failure
    return None
```

### Metrics Calculation (BE-008)

Derived metrics from pose landmarks:

| Metric | Type | Description | Range |
|--------|------|-------------|-------|
| `durationSeconds` | float | Time athlete maintained balance | 0-30 |
| `stabilityScore` | float | Composite score | 0-100 |
| `swayStdX` | float | Std dev of lateral hip movement | >0 |
| `swayStdY` | float | Std dev of anterior-posterior hip movement | >0 |
| `swayPathLength` | float | Total hip distance traveled (cm) | >0 |
| `swayVelocity` | float | Path length / duration (cm/s) | >0 |
| `armExcursionLeft` | float | Total left arm movement | >0 |
| `armExcursionRight` | float | Total right arm movement | >0 |
| `armAsymmetryRatio` | float | Left/Right arm ratio | >0 |
| `correctionsCount` | int | Number of sway threshold crossings | ≥0 |
| `failureReason` | string | Why test ended | enum |

**Stability Score Formula**:
```python
def calculate_stability_score(metrics: dict) -> float:
    """Composite score (0-100), higher = better"""
    # Weighted combination of metrics
    score = 100 - (
        w1 * metrics['swayStdX'] +
        w2 * metrics['swayStdY'] +
        w3 * metrics['armExcursion'] +
        w4 * metrics['correctionsCount'] +
        w5 * duration_penalty(metrics['durationSeconds'])
    )
    return max(0, min(100, score))
```

See [prd.md Section 11](../prd.md#11-cv-metrics-specification) for complete formulas.

---

## Code Patterns

### FastAPI Route with Authentication

```python
from fastapi import APIRouter, Depends, HTTPException, status
from app.services.auth import get_current_user

router = APIRouter(prefix="/athletes", tags=["athletes"])

@router.get("/")
async def list_athletes(
    current_user: str = Depends(get_current_user)
) -> List[Athlete]:
    """Get all athletes for authenticated coach"""
    athletes = await db.athletes.where("coachId", "==", current_user).get()
    return [Athlete(**doc.to_dict()) for doc in athletes]

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_athlete(
    athlete: AthleteCreate,
    current_user: str = Depends(get_current_user)
) -> Athlete:
    """Create new athlete and send consent email"""
    # Validate coach hasn't exceeded limit
    if await get_athlete_count(current_user) >= 25:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Athlete limit reached (max 25)"
        )

    # Create athlete
    athlete_data = {
        **athlete.dict(),
        "coachId": current_user,
        "consentStatus": "pending",
        "consentToken": generate_token(),
        "createdAt": datetime.utcnow()
    }
    doc_ref = await db.athletes.add(athlete_data)

    # Send consent email
    await email_service.send_consent_request(
        parent_email=athlete.parentEmail,
        athlete_name=athlete.name,
        consent_token=athlete_data["consentToken"]
    )

    return Athlete(id=doc_ref.id, **athlete_data)
```

### Async Background Processing

```python
import asyncio
from app.services.mediapipe_service import extract_keypoints
from app.services.metrics_calculator import calculate_metrics
from app.agents.orchestrator import generate_feedback

async def process_video_async(assessment_id: str, video_url: str):
    """Process video in background (non-blocking)"""
    try:
        # Extract pose landmarks
        keypoints = await extract_keypoints(video_url)

        # Calculate metrics
        metrics = calculate_metrics(keypoints)

        # Store raw keypoints (context offloading)
        keypoints_url = await storage_service.upload_keypoints(
            assessment_id, keypoints
        )

        # Generate AI feedback
        feedback = await generate_feedback(metrics)

        # Update assessment
        await db.assessments.document(assessment_id).update({
            "status": "completed",
            "metrics": metrics,
            "aiFeedback": feedback,
            "rawKeypointsUrl": keypoints_url,
            "completedAt": datetime.utcnow()
        })

    except Exception as e:
        # Mark as failed
        await db.assessments.document(assessment_id).update({
            "status": "failed",
            "error": str(e),
            "failedAt": datetime.utcnow()
        })
        raise

# In route handler:
asyncio.create_task(process_video_async(assessment_id, video_url))
```

### Pydantic Models

```python
from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional, Literal

class AthleteCreate(BaseModel):
    """Schema for creating new athlete"""
    name: str = Field(..., min_length=1, max_length=100)
    age: int = Field(..., ge=5, le=13)
    gender: Literal['male', 'female', 'other']
    parentEmail: str = Field(..., regex=r'^[\w\.-]+@[\w\.-]+\.\w+$')

    @validator('name')
    def name_must_not_be_empty(cls, v):
        if not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()

class Athlete(AthleteCreate):
    """Schema for athlete with DB fields"""
    id: str
    coachId: str
    consentStatus: Literal['pending', 'active', 'declined']
    consentToken: str
    consentTimestamp: Optional[datetime] = None
    createdAt: datetime

class AssessmentMetrics(BaseModel):
    """Schema for CV-derived metrics"""
    durationSeconds: float = Field(..., ge=0, le=30)
    stabilityScore: float = Field(..., ge=0, le=100)
    swayStdX: float = Field(..., gt=0)
    swayStdY: float = Field(..., gt=0)
    swayPathLength: float = Field(..., gt=0)
    swayVelocity: float = Field(..., gt=0)
    armExcursionLeft: float = Field(..., ge=0)
    armExcursionRight: float = Field(..., ge=0)
    armAsymmetryRatio: float = Field(..., gt=0)
    correctionsCount: int = Field(..., ge=0)
    failureReason: Literal[
        'time_complete',
        'foot_touchdown',
        'support_foot_moved'
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

### MediaPipe Import Errors

**Issue**: `ModuleNotFoundError: No module named 'mediapipe'`

**Solutions**:
```bash
# Ensure Python 3.11 (not 3.12+)
python --version

# Clear cache and reinstall
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

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

### Slow Video Processing

**Issue**: Analysis takes >60 seconds

**Solutions**:
- Check MediaPipe frame rate (target: 30 FPS)
- Ensure video resolution not too high (max 1080p)
- Verify server has sufficient CPU (2+ cores recommended)
- Consider offloading to background worker queue

### Memory Errors

**Issue**: `MemoryError` during video processing

**Solutions**:
```bash
# Increase worker memory (Render)
# In Render dashboard: Settings → Instance Type → Upgrade

# For local development
export UVICORN_WORKER_CLASS=uvicorn.workers.UvicornWorker
export UVICORN_WORKERS=1  # Reduce workers if memory constrained
```

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

### Context Offloading

Store large data externally:

```python
# ❌ Bad: Store 50KB of keypoints in Firestore document
await db.assessments.document(id).update({
    "keypoints": keypoints  # Too large!
})

# ✅ Good: Store in Firebase Storage, reference in Firestore
keypoints_url = await storage.upload_keypoints(id, keypoints)
await db.assessments.document(id).update({
    "rawKeypointsUrl": keypoints_url  # Just the URL
})
```

### Prompt Caching

Cache static content in AI agent prompts:

```python
# System prompt (cached)
CACHED_SYSTEM_PROMPT = """
You are an AI assistant for youth sports coaches...
[LTAD benchmarks, scoring rules, etc. - static content]
"""

# User prompt (dynamic)
user_prompt = f"Analyze this assessment: {metrics}"

# OpenRouter API call with caching
response = await openrouter.chat.completions.create(
    model="anthropic/claude-sonnet-3.5",
    messages=[
        {"role": "system", "content": CACHED_SYSTEM_PROMPT},  # Cached
        {"role": "user", "content": user_prompt}  # Dynamic
    ],
    cache_control={"type": "ephemeral"}  # Enable caching
)
```

---

## Security

### Authentication Flow

1. Client obtains Firebase ID token
2. Client includes token in `Authorization: Bearer <token>` header
3. Backend validates token with Firebase Admin SDK
4. Backend extracts user ID from token
5. Backend enforces data access rules

### Data Access Rules

- Coaches can only access their own data
- Athletes belong to exactly one coach
- Assessments belong to exactly one coach
- Parent reports require valid PIN

### Rate Limiting

Implemented for security-sensitive endpoints:
- PIN verification: 5 attempts/minute, 10 total lockout
- Consent submission: 3 attempts/minute
- Video upload: 10 uploads/hour per coach

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

from app.services.auth import get_current_user
from app.models.athlete import Athlete
from app.utils.firebase import db
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
