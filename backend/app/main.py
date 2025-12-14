"""FastAPI application entry point."""

import logging
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.openapi.models import SecuritySchemeType
from fastapi.security import HTTPBearer

from app.config import get_settings
from app.firebase import init_firebase, verify_connection
from app.routers.auth import router as auth_router
from app.routers.athletes import router as athletes_router
from app.routers.consent import router as consent_router
from app.routers.assessments import router as assessments_router
from app.models.errors import (
    AppException,
    ErrorCode,
    ErrorDetail,
    ErrorResponse,
    STATUS_TO_ERROR_CODE,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

# Application version
VERSION = "0.1.0"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown events."""
    # Startup
    init_firebase()
    yield
    # Shutdown (cleanup if needed)


# Initialize FastAPI app with lifespan
app = FastAPI(
    title="CoachLens API",
    description="Computer vision athletic assessment platform for youth sports coaches",
    version=VERSION,
    lifespan=lifespan,
)

# Configure security scheme for Swagger UI
security = HTTPBearer()

# Get settings
settings = get_settings()

# Configure CORS middleware
# MVP: Allow all origins for demo flexibility
# TODO: Restrict to specific domains after demo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # MVP phase - will restrict post-demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(athletes_router)
app.include_router(consent_router)
app.include_router(assessments_router)


# Configure OpenAPI schema to show Authorization button in Swagger UI
def custom_openapi():
    """Customize OpenAPI schema to include security scheme."""
    if app.openapi_schema:
        return app.openapi_schema

    from fastapi.openapi.utils import get_openapi

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )

    # Add security scheme
    openapi_schema["components"]["securitySchemes"] = {
        "HTTPBearer": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Enter your Firebase ID token"
        }
    }

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


@app.get("/health")
async def health_check() -> dict:
    """Health check endpoint for deployment monitoring.

    Returns server status and Firebase connection status.
    """
    fb_status = verify_connection()
    return {
        "status": "ok",
        "version": VERSION,
        "firebase": {
            "firestore": "connected" if fb_status["firestore"] else "disconnected",
            "storage": "connected" if fb_status["storage"] else "disconnected",
        }
    }


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Handle Pydantic validation errors."""
    details = [
        ErrorDetail(
            field=".".join(str(loc) for loc in error["loc"]),
            issue=error["msg"],
        )
        for error in exc.errors()
    ]
    response = ErrorResponse(
        code=ErrorCode.VALIDATION_ERROR.value,
        message="Validation error",
        details=details,
    )
    return JSONResponse(status_code=400, content=response.model_dump())


@app.exception_handler(HTTPException)
async def http_exception_handler(
    request: Request, exc: HTTPException
) -> JSONResponse:
    """Handle HTTP exceptions with standardized error response."""
    error_code = STATUS_TO_ERROR_CODE.get(
        exc.status_code, ErrorCode.SERVER_ERROR
    )
    response = ErrorResponse(
        code=error_code.value,
        message=str(exc.detail),
    )
    return JSONResponse(status_code=exc.status_code, content=response.model_dump())


@app.exception_handler(AppException)
async def app_exception_handler(
    request: Request, exc: AppException
) -> JSONResponse:
    """Handle custom application exceptions."""
    response = ErrorResponse(
        code=exc.code.value,
        message=exc.message,
        details=exc.details,
    )
    return JSONResponse(status_code=exc.status_code, content=response.model_dump())
