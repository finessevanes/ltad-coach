from pydantic import BaseModel, EmailStr
from typing import Optional, Literal
from app.models.base import FirestoreDocument


class AthleteCreate(BaseModel):
    """Request model for creating an athlete"""
    name: str
    age: int
    gender: Literal['male', 'female', 'other']
    parentEmail: EmailStr


class AthleteUpdate(BaseModel):
    """Request model for updating an athlete"""
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[Literal['male', 'female', 'other']] = None
    parentEmail: Optional[EmailStr] = None


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
