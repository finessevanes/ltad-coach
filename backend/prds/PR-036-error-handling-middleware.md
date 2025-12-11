---
id: BE-036
depends_on: [BE-001]
blocks: []
---

# BE-036: Error Handling Middleware

## Scope

**In Scope:**
- Global exception handler
- Standardized error responses
- Logging for errors

**Out of Scope:**
- Request logging (BE-037)
- CORS (BE-038)

## Technical Decisions

- **Format**: Consistent JSON error responses
- **Status Codes**: Proper HTTP status codes
- **Logging**: Python logging module

## Acceptance Criteria

- [ ] All exceptions return JSON
- [ ] Consistent error format
- [ ] Errors logged with stack traces
- [ ] 500 errors don't expose internals

## Files to Create/Modify

- `app/core/errors.py` (create)
- `app/main.py` (modify - add exception handlers)

## Implementation Notes

**app/core/errors.py**:
```python
from fastapi import Request, status
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

async def global_exception_handler(request: Request, exc: Exception):
    """Handle all unhandled exceptions"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error",
            "detail": "An unexpected error occurred"
        }
    )
```

**app/main.py** (add):
```python
from app.core.errors import global_exception_handler

app.add_exception_handler(Exception, global_exception_handler)
```

## Estimated Complexity

**Size**: S (Small - ~1 hour)
