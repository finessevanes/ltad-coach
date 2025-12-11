---
id: BE-003
depends_on: [BE-001]
blocks: [BE-007]
---

# BE-003: Environment Variables & Config Management

## Scope

**In Scope:**
- Create centralized configuration module
- Define all required environment variables
- Add validation for required variables
- Set up Pydantic settings for type safety

**Out of Scope:**
- Actual API key values (those go in .env, not committed)
- Deployment-specific configuration

## Technical Decisions

- **Configuration Library**: Pydantic Settings (already in requirements from BE-001)
- **Validation**: Fail-fast on server startup if required vars missing
- **Location**: `app/core/config.py`
- **Environment File**: `.env` for local development

## Acceptance Criteria

- [ ] All environment variables from PRD Section 12.3 defined
- [ ] Pydantic Settings class with type hints
- [ ] Server fails to start if required variables are missing
- [ ] `.env.example` documents all required variables
- [ ] Config accessible via single import throughout app

## Files to Create/Modify

- `app/core/config.py` (create)
- `.env.example` (modify - add all vars)

## Implementation Notes

**app/core/config.py**:
```python
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Firebase
    firebase_credentials_json: str
    firebase_project_id: str

    # Anthropic (Claude API)
    anthropic_api_key: str

    # Resend (Email)
    resend_api_key: str

    # URLs
    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"

    # App Settings
    environment: str = "development"
    debug: bool = True

    # CORS
    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    class Config:
        env_file = ".env"
        case_sensitive = False

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

# Global settings instance
settings = Settings()
```

**.env.example**:
```
# Firebase Configuration
FIREBASE_CREDENTIALS_JSON={"type":"service_account","project_id":"..."}
FIREBASE_PROJECT_ID=your-project-id

# Anthropic API (Claude)
ANTHROPIC_API_KEY=sk-ant-...

# Resend Email Service
RESEND_API_KEY=re_...

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000

# Environment
ENVIRONMENT=development
DEBUG=true

# CORS (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

**app/main.py** (use config):
```python
from app.core.config import settings

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add startup validation
@app.on_event("startup")
async def startup_event():
    print(f"Environment: {settings.environment}")
    print(f"Frontend URL: {settings.frontend_url}")
```

## Testing

1. Create `.env` file with all variables
2. Run server - should start successfully
3. Remove a required variable (e.g., `ANTHROPIC_API_KEY`)
4. Run server - should fail with clear error message
5. Verify CORS headers work by making request from frontend URL

## Estimated Complexity

**Size**: S (Small - ~1 hour)

## Notes

- Pydantic Settings automatically loads from `.env` file
- Type validation happens at import time
- Missing required fields will raise ValidationError with clear message
- For production (Heroku), set environment variables in dashboard (no .env file)
