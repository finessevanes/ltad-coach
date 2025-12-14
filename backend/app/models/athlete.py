"""Athlete data models for the API."""

from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class ConsentStatus(str, Enum):
    """Consent status for athlete."""

    PENDING = "pending"
    ACTIVE = "active"
    DECLINED = "declined"


class Gender(str, Enum):
    """Gender options for athlete."""

    MALE = "male"
    FEMALE = "female"


class AthleteCreate(BaseModel):
    """Request model for creating a new athlete."""

    name: str = Field(..., min_length=1, max_length=100, description="Athlete's full name")
    age: int = Field(..., ge=5, le=13, description="Athlete's age (5-13 years per LTAD)")
    gender: Gender = Field(..., description="Athlete's gender")
    parent_email: EmailStr = Field(..., description="Parent/guardian email for consent")


class AthleteUpdate(BaseModel):
    """Request model for updating an athlete."""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    age: Optional[int] = Field(None, ge=5, le=13)
    gender: Optional[Gender] = None
    parent_email: Optional[EmailStr] = None


class EditLock(BaseModel):
    """Edit lock information for concurrent access prevention."""

    locked_by: str = Field(..., description="User ID who acquired the lock")
    locked_at: datetime = Field(..., description="When the lock was acquired")
    expires_at: datetime = Field(..., description="When the lock expires (5 minutes)")


class Athlete(BaseModel):
    """Full athlete model (internal use with all fields)."""

    id: str = Field(..., description="Firestore document ID")
    coach_id: str = Field(..., description="Coach who owns this athlete")
    name: str = Field(..., description="Athlete's full name")
    age: int = Field(..., description="Athlete's age")
    gender: str = Field(..., description="Athlete's gender")
    parent_email: str = Field(..., description="Parent/guardian email")
    consent_status: ConsentStatus = Field(default=ConsentStatus.PENDING, description="Parental consent status")
    consent_token: str = Field(..., description="UUID4 token for consent workflow")
    consent_token_expires: datetime = Field(..., description="Token expiry (30 days from creation)")
    consent_timestamp: Optional[datetime] = Field(None, description="When consent was provided/declined")
    created_at: datetime = Field(..., description="When athlete was created")
    avatar_url: Optional[str] = Field(None, description="URL to athlete's avatar image")
    edit_lock: Optional[EditLock] = Field(None, description="Current edit lock (if any)")

    class Config:
        """Pydantic config."""
        use_enum_values = True


class AthleteResponse(BaseModel):
    """Response model for athlete (excludes sensitive fields)."""

    id: str
    name: str
    age: int
    gender: str
    parent_email: str
    consent_status: ConsentStatus
    created_at: datetime
    avatar_url: Optional[str] = None

    class Config:
        """Pydantic config."""
        use_enum_values = True


class AthletesListResponse(BaseModel):
    """Response model for list of athletes."""

    athletes: list[AthleteResponse]
    count: int = Field(..., description="Total number of athletes returned")
