COMPLETED

---
id: BE-001
depends_on: []
blocks: [BE-002, BE-003, BE-004, BE-005, BE-006, BE-007, BE-008, BE-036, BE-037, BE-038]
---

# BE-001: FastAPI Project Setup

## Scope

**In Scope:**
- Initialize Python project with FastAPI
- Configure project structure
- Set up dependency management
- Create basic health check endpoint
- Configure ASGI server (Uvicorn)

**Out of Scope:**
- Database connections
- Authentication
- Firebase integration
- Deployment configuration

## Technical Decisions

- **Framework**: FastAPI (specified in PRD)
- **Python Version**: 3.11+ (for performance and type hints)
- **Package Manager**: pip with requirements.txt
- **ASGI Server**: Uvicorn with auto-reload for development
- **Project Structure**:
  ```
  backend/
  ├── app/
  │   ├── __init__.py
  │   ├── main.py          # FastAPI app initialization
  │   ├── api/             # API routes (empty for now)
  │   │   └── __init__.py
  │   ├── core/            # Core utilities (empty for now)
  │   │   └── __init__.py
  │   ├── models/          # Data models (empty for now)
  │   │   └── __init__.py
  │   └── services/        # Business logic (empty for now)
  │       └── __init__.py
  ├── requirements.txt
  ├── .env.example
  └── README.md
  ```

## Acceptance Criteria

- [ ] Python virtual environment can be created successfully
- [ ] `requirements.txt` includes: `fastapi`, `uvicorn[standard]`, `python-dotenv`, `pydantic`
- [ ] FastAPI app initializes without errors
- [ ] Health check endpoint `GET /health` returns `{"status": "ok"}` with 200 status
- [ ] Server runs on `http://localhost:8000` with `uvicorn app.main:app --reload`
- [ ] FastAPI auto-generated docs accessible at `/docs`
- [ ] README includes setup instructions

## Files to Create

- `app/__init__.py`
- `app/main.py`
- `app/api/__init__.py`
- `app/core/__init__.py`
- `app/models/__init__.py`
- `app/services/__init__.py`
- `requirements.txt`
- `.env.example`
- `README.md`
- `.gitignore`

## Implementation Notes

**app/main.py**:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="AI Coach API",
    description="Computer Vision Athletic Assessment Platform",
    version="1.0.0"
)

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/")
async def root():
    return {"message": "AI Coach API - See /docs for documentation"}
```

**requirements.txt** (initial):
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-dotenv==1.0.0
pydantic==2.5.0
pydantic-settings==2.1.0
```

## Testing

Run server:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Verify:
- Visit `http://localhost:8000/health` → should return `{"status": "ok"}`
- Visit `http://localhost:8000/docs` → should show Swagger UI

## Estimated Complexity

**Size**: S (Small - ~1-2 hours)

## Notes

- Keep requirements.txt minimal for this PR
- Additional dependencies will be added in subsequent PRs (BE-002, BE-003, etc.)
- .env.example should be empty for now (populated in BE-003)
