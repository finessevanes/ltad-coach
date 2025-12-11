---
id: BE-001
depends_on: []
blocks: [BE-002, BE-003, BE-004, BE-005, BE-006]
---

# BE-001: Backend Project Setup & Render Deployment

## Title
Initialize FastAPI backend with Render deployment configuration

## Scope

### In Scope
- Python project initialization with pip
- FastAPI application skeleton
- Health check endpoint
- CORS configuration for frontend
- Environment variable loading
- Render deployment configuration (render.yaml)
- Basic project structure

### Out of Scope
- Firebase integration (BE-002)
- Any business logic endpoints
- Database connections

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Package Manager | pip + requirements.txt | Simple, universal, works with Render |
| Python Version | 3.11 | Latest stable with good library support |
| ASGI Server | Uvicorn | Standard for FastAPI, production-ready |
| Config Management | Pydantic Settings | Type-safe env var parsing |

## Acceptance Criteria

- [ ] `pip install -r requirements.txt` succeeds without errors
- [ ] `uvicorn app.main:app --reload` starts server on port 8000
- [ ] `GET /health` returns `{"status": "ok", "version": "0.1.0"}`
- [ ] CORS allows requests from `http://localhost:3000` and configured `FRONTEND_URL`
- [ ] All environment variables are validated on startup (fail fast if missing)
- [ ] Render deployment succeeds and health check passes
- [ ] API docs available at `/docs` (Swagger UI)

## Files to Create/Modify

```
backend/
├── requirements.txt         # Python dependencies
├── render.yaml              # Render deployment config
├── .python-version          # Python version file
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app, CORS, health route
│   ├── config.py            # Pydantic Settings for env vars
│   └── routers/
│       └── __init__.py
└── README.md                # Setup instructions
```

## Implementation Details

### requirements.txt Dependencies
```
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
pydantic>=2.5.0
pydantic-settings>=2.1.0
python-multipart>=0.0.6
pytest>=7.4.0
httpx>=0.26.0
```

### config.py Structure
```python
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Required
    frontend_url: str
    api_base_url: str  # Backend URL for self-reference

    # Firebase - Using JSON service account file (simpler for local dev + deployment)
    google_application_credentials: str  # Path to Firebase Admin SDK JSON file
    firebase_project_id: str
    firebase_storage_bucket: str

    # External APIs (validated but not used until later PRs)
    openrouter_api_key: str
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    resend_api_key: str

    # CORS
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins(self) -> list[str]:
        """Parse ALLOWED_ORIGINS into list"""
        return [origin.strip() for origin in self.allowed_origins.split(",")]

    class Config:
        env_file = ".env"
```

### main.py CORS Configuration
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AI Coach API", version="0.1.0")

# CORS Configuration - Allow all origins for MVP
# TODO: Restrict to specific origins after demo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "0.1.0"}
```

> **Note**: CORS is configured to allow all origins for the MVP/demo phase. After the demo, update `allow_origins` to whitelist specific domains (e.g., `["https://ltad-coach.vercel.app", "http://localhost:3000"]`).

### Standardized Error Response Schema

All API endpoints must return errors in a consistent format:

```python
# app/models/errors.py
from typing import List, Optional
from pydantic import BaseModel

class ErrorDetail(BaseModel):
    field: Optional[str] = None
    issue: str

class ErrorResponse(BaseModel):
    code: str
    message: str
    details: Optional[List[ErrorDetail]] = None

# Standard error codes
class ErrorCodes:
    VALIDATION_ERROR = "VALIDATION_ERROR"
    NOT_FOUND = "NOT_FOUND"
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    RATE_LIMITED = "RATE_LIMITED"
    SERVER_ERROR = "SERVER_ERROR"
    CONSENT_REQUIRED = "CONSENT_REQUIRED"
    PROCESSING_FAILED = "PROCESSING_FAILED"
```

**Error Response Examples:**

```json
// 400 Bad Request - Validation Error
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid request data",
  "details": [
    {"field": "age", "issue": "must be between 5 and 13"},
    {"field": "email", "issue": "invalid email format"}
  ]
}

// 401 Unauthorized
{
  "code": "UNAUTHORIZED",
  "message": "Invalid or expired authentication token"
}

// 403 Forbidden
{
  "code": "FORBIDDEN",
  "message": "Access denied to this resource"
}

// 404 Not Found
{
  "code": "NOT_FOUND",
  "message": "Athlete not found"
}

// 429 Rate Limited
{
  "code": "RATE_LIMITED",
  "message": "Too many requests. Please try again later.",
  "details": [
    {"field": "retry_after", "issue": "60 seconds"}
  ]
}

// 500 Server Error
{
  "code": "SERVER_ERROR",
  "message": "An unexpected error occurred"
}
```

**Exception Handler Setup (add to main.py):**

```python
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    details = [
        {"field": ".".join(str(loc) for loc in err["loc"]), "issue": err["msg"]}
        for err in exc.errors()
    ]
    return JSONResponse(
        status_code=400,
        content={
            "code": "VALIDATION_ERROR",
            "message": "Invalid request data",
            "details": details
        }
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "code": _status_to_code(exc.status_code),
            "message": exc.detail
        }
    )

def _status_to_code(status: int) -> str:
    mapping = {
        400: "VALIDATION_ERROR",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        429: "RATE_LIMITED",
    }
    return mapping.get(status, "SERVER_ERROR")
```

### render.yaml
```yaml
services:
  - type: web
    name: ltad-coach-api
    env: python
    buildCommand: |
      pip install -r requirements.txt
      mkdir -p models
      wget -O models/pose_landmarker_lite.task https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task
    startCommand: "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
    healthCheckPath: /health
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
```

> **Note**: The MediaPipe pose model (~8MB) is downloaded during build to avoid runtime download delays. The model is used by BE-007 for video analysis.

## Environment Variables Required

| Variable | Example | Required |
|----------|---------|----------|
| FRONTEND_URL | https://ltad-coach.vercel.app | Yes |
| API_BASE_URL | https://ltad-coach-api.onrender.com | Yes |
| GOOGLE_APPLICATION_CREDENTIALS | ./firebase-adminsdk.json | Yes |
| FIREBASE_PROJECT_ID | ltad-coach | Yes |
| FIREBASE_STORAGE_BUCKET | ltad-coach.firebasestorage.app | Yes |
| OPENROUTER_API_KEY | sk-or-... | Yes |
| OPENROUTER_BASE_URL | https://openrouter.ai/api/v1 | No (has default) |
| RESEND_API_KEY | re_... | Yes |
| ALLOWED_ORIGINS | http://localhost:5173,http://localhost:3000 | No (has default) |

## Estimated Complexity
**S** (Small) - 2-3 hours

## Testing Instructions

1. Local testing:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
cp .env.example .env  # Fill in values
uvicorn app.main:app --reload
curl http://localhost:8000/health
```

2. Render deployment:
- Connect GitHub repo to Render
- Add environment variables in Render dashboard
- Deploy and verify health check
