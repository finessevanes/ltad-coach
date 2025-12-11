from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, Literal
from app.models.base import FirestoreDocument


class AthleteCreate(BaseModel):
    """Request model for creating an athlete"""
    model_config = ConfigDict(populate_by_name=True)

    name: str
    age: int
    gender: Literal['male', 'female', 'other']
    parentEmail: EmailStr = Field(..., alias='parent_email')


class AthleteUpdate(BaseModel):
    """Request model for updating an athlete"""
    model_config = ConfigDict(populate_by_name=True)

    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[Literal['male', 'female', 'other']] = None
    parentEmail: Optional[EmailStr] = Field(None, alias='parent_email')


class Athlete(FirestoreDocument):
    """Athlete model"""
    coachId: str
    name: str
    age: int
    gender: str
    parentEmail: str
    consentStatus: Literal['pending', 'active', 'declined'] = 'pending'
    consentToken: Optional[str] = None
    consentTimestamp: Optional[str] = None
    avatarUrl: Optional[str] = None
