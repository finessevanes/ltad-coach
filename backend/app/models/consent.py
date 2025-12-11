"""Consent workflow data models."""

from pydantic import BaseModel, Field


class ConsentFormData(BaseModel):
    """Response model for public consent form data."""

    athlete_name: str = Field(..., description="Name of the athlete")
    coach_name: str = Field(..., description="Name of the coach")
    legal_text: str = Field(..., description="Legal consent text to display")


class ConsentSignRequest(BaseModel):
    """Request model for parent signing consent."""

    acknowledged: bool = Field(..., description="Parent must acknowledge terms (must be true)")
