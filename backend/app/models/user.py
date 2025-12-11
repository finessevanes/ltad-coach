"""User model schemas."""

from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class UserBase(BaseModel):
    """Base user fields."""
    email: EmailStr
    name: str


class UserCreate(UserBase):
    """Schema for creating a user (from Firebase auth data)."""
    pass


class User(UserBase):
    """Full user model with all fields."""
    id: str
    created_at: datetime
    athlete_count: int = 0

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    """User response schema for API endpoints."""
    id: str
    email: str
    name: str
    athlete_count: int
