---
id: BE-037
depends_on: [BE-001]
blocks: []
---

# BE-037: Request Logging

## Scope

**In Scope:**
- Log all API requests
- Include method, path, status, duration

**Out of Scope:**
- Error handling (BE-036)
- Analytics/monitoring

## Technical Decisions

- **Middleware**: FastAPI middleware
- **Format**: Structured logging
- **Level**: INFO for requests, ERROR for failures

## Acceptance Criteria

- [ ] All requests logged
- [ ] Includes timing information
- [ ] Excludes sensitive data

## Files to Create/Modify

- `app/core/logging.py` (create)
- `app/main.py` (modify - add middleware)

## Implementation Notes

**app/core/logging.py**:
```python
from fastapi import Request
import time
import logging

logger = logging.getLogger(__name__)

async def log_requests(request: Request, call_next):
    """Log all API requests"""
    start_time = time.time()

    response = await call_next(request)

    duration = time.time() - start_time

    logger.info(
        f"{request.method} {request.url.path} "
        f"- {response.status_code} - {duration:.3f}s"
    )

    return response
```

**app/main.py** (add):
```python
from app.core.logging import log_requests

app.middleware("http")(log_requests)
```

## Estimated Complexity

**Size**: S (Small - ~0.5 hours)
