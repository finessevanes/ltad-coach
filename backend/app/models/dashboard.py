"""Dashboard data models"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class DashboardStats(BaseModel):
    """Aggregated statistics for coach dashboard"""
    total_athletes: int = Field(..., description="Total number of athletes")
    active_athletes: int = Field(..., description="Athletes with active consent")
    pending_consent: int = Field(..., description="Athletes with pending consent")
    total_assessments: int = Field(..., description="Total assessments conducted")


class RecentAssessmentItem(BaseModel):
    """Recent assessment with athlete name for dashboard display"""
    id: str = Field(..., description="Assessment ID")
    athlete_id: str = Field(..., description="Athlete ID")
    athlete_name: str = Field(..., description="Athlete name")
    test_type: str = Field(..., description="Assessment test type")
    leg_tested: str = Field(..., description="Leg tested (left/right)")
    status: str = Field(..., description="Assessment status")
    created_at: datetime = Field(..., description="Assessment creation timestamp")

    # Optional metrics - may be None if processing or failed
    duration_seconds: Optional[float] = Field(None, description="Test duration in seconds")
    duration_score: Optional[int] = Field(None, description="LTAD duration score (1-5)")
    sway_velocity: Optional[float] = Field(None, description="Average sway velocity")


class PendingAthleteItem(BaseModel):
    """Athlete awaiting consent for dashboard display"""
    id: str = Field(..., description="Athlete ID")
    name: str = Field(..., description="Athlete name")
    age: int = Field(..., description="Athlete age")
    gender: str = Field(..., description="Athlete gender")
    parent_email: str = Field(..., description="Parent email address")
    created_at: datetime = Field(..., description="When athlete was added")


class AthleteListItem(BaseModel):
    """Athlete for list display"""
    id: str = Field(..., description="Athlete ID")
    name: str = Field(..., description="Athlete name")
    age: int = Field(..., description="Athlete age")
    gender: str = Field(..., description="Athlete gender")
    parent_email: str = Field(..., description="Parent email address")
    consent_status: str = Field(..., description="Consent status")
    created_at: datetime = Field(..., description="When athlete was added")


class DashboardResponse(BaseModel):
    """Combined dashboard data response"""
    stats: DashboardStats = Field(..., description="Aggregated statistics")
    recent_assessments: List[RecentAssessmentItem] = Field(
        ..., description="Last 10 assessments ordered by date (newest first)"
    )
    pending_athletes: List[PendingAthleteItem] = Field(
        ..., description="Athletes with pending consent status"
    )
    athletes: List[AthleteListItem] = Field(
        ..., description="All athletes for this coach"
    )
