from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.base import FirestoreDocument


class User(FirestoreDocument):
    """User model for coaches"""
    email: EmailStr
    name: str
    athleteCount: int = 0


class UserResponse(BaseModel):
    """User response model"""
    id: str
    email: str
    name: str
    athleteCount: int
