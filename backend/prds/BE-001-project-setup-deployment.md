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
- Python project initialization with Poetry/pip
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
| Package Manager | Poetry | Better dependency resolution, lock file support |
| Python Version | 3.11 | Latest stable with good library support |
| ASGI Server | Uvicorn | Standard for FastAPI, production-ready |
| Config Management | Pydantic Settings | Type-safe env var parsing |

## Acceptance Criteria

- [ ] `poetry install` succeeds without errors
- [ ] `uvicorn main:app --reload` starts server on port 8000
- [ ] `GET /health` returns `{"status": "ok", "version": "0.1.0"}`
- [ ] CORS allows requests from `http://localhost:3000` and configured `FRONTEND_URL`
- [ ] All environment variables are validated on startup (fail fast if missing)
- [ ] Render deployment succeeds and health check passes
- [ ] API docs available at `/docs` (Swagger UI)

## Files to Create/Modify

```
backend/
├── pyproject.toml           # Poetry config with dependencies
├── poetry.lock              # Generated lock file
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

### pyproject.toml Dependencies
```toml
[tool.poetry.dependencies]
python = "^3.11"
fastapi = "^0.109.0"
uvicorn = {extras = ["standard"], version = "^0.27.0"}
pydantic = "^2.5.0"
pydantic-settings = "^2.1.0"
python-multipart = "^0.0.6"

[tool.poetry.group.dev.dependencies]
pytest = "^7.4.0"
httpx = "^0.26.0"
```

### config.py Structure
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Required
    frontend_url: str
    backend_url: str

    # Firebase (validated but not used until BE-002)
    firebase_project_id: str
    firebase_private_key: str
    firebase_client_email: str

    # External APIs (validated but not used until later PRs)
    openrouter_api_key: str
    resend_api_key: str

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
    buildCommand: "pip install poetry && poetry install"
    startCommand: "poetry run uvicorn app.main:app --host 0.0.0.0 --port $PORT"
    healthCheckPath: /health
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
```

## Environment Variables Required

| Variable | Example | Required |
|----------|---------|----------|
| FRONTEND_URL | https://ltad-coach.vercel.app | Yes |
| BACKEND_URL | https://ltad-coach-api.onrender.com | Yes |
| FIREBASE_PROJECT_ID | ltad-coach | Yes |
| FIREBASE_PRIVATE_KEY | -----BEGIN PRIVATE KEY----- | Yes |
| FIREBASE_CLIENT_EMAIL | firebase-adminsdk@... | Yes |
| OPENROUTER_API_KEY | sk-or-... | Yes |
| RESEND_API_KEY | re_... | Yes |

## Estimated Complexity
**S** (Small) - 2-3 hours

## Testing Instructions

1. Local testing:
```bash
cd backend
poetry install
cp .env.example .env  # Fill in values
poetry run uvicorn app.main:app --reload
curl http://localhost:8000/health
```

2. Render deployment:
- Connect GitHub repo to Render
- Add environment variables in Render dashboard
- Deploy and verify health check
