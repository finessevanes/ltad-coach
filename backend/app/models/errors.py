"""Standardized error response schemas."""

from enum import Enum
from typing import Optional
from pydantic import BaseModel


class ErrorCode(str, Enum):
    """Standard error codes for API responses."""

    VALIDATION_ERROR = "VALIDATION_ERROR"
    NOT_FOUND = "NOT_FOUND"
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    RATE_LIMITED = "RATE_LIMITED"
    SERVER_ERROR = "SERVER_ERROR"
    CONSENT_REQUIRED = "CONSENT_REQUIRED"
    PROCESSING_FAILED = "PROCESSING_FAILED"


class ErrorDetail(BaseModel):
    """Individual error detail for validation errors."""

    field: Optional[str] = None
    issue: str


class ErrorResponse(BaseModel):
    """Standardized error response schema."""

    code: str
    message: str
    details: Optional[list[ErrorDetail]] = None


class AppException(Exception):
    """Custom application exception with error code and message."""

    def __init__(
        self,
        code: ErrorCode,
        message: str,
        status_code: int = 400,
        details: Optional[list[ErrorDetail]] = None,
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(message)


# Map HTTP status codes to error codes
STATUS_TO_ERROR_CODE: dict[int, ErrorCode] = {
    400: ErrorCode.VALIDATION_ERROR,
    401: ErrorCode.UNAUTHORIZED,
    403: ErrorCode.FORBIDDEN,
    404: ErrorCode.NOT_FOUND,
    429: ErrorCode.RATE_LIMITED,
    500: ErrorCode.SERVER_ERROR,
}
