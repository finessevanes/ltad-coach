"""FastAPI application entry point."""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.models.errors import (
    AppException,
    ErrorCode,
    ErrorDetail,
    ErrorResponse,
    STATUS_TO_ERROR_CODE,
)

# Application version
VERSION = "0.1.0"

# Initialize FastAPI app
app = FastAPI(
    title="AI Coach API",
    description="Computer vision athletic assessment platform for youth sports coaches",
    version=VERSION,
)

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


@app.get("/health")
async def health_check() -> dict:
    """Health check endpoint for deployment monitoring."""
    return {"status": "ok", "version": VERSION}


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
