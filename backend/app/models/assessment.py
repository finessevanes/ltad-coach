"""Assessment data models."""

from enum import Enum
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class TestType(str, Enum):
    """Type of balance test."""
    ONE_LEG_BALANCE = "one_leg_balance"


class LegTested(str, Enum):
    """Which leg was tested."""
    LEFT = "left"
    RIGHT = "right"


class AssessmentStatus(str, Enum):
    """Assessment processing status."""
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class FailureReason(str, Enum):
    """Reason for test failure."""
    TIME_COMPLETE = "time_complete"  # Completed full 30 seconds
    FOOT_TOUCHDOWN = "foot_touchdown"  # Raised foot touched ground
    SUPPORT_FOOT_MOVED = "support_foot_moved"  # Standing foot moved


class MetricsData(BaseModel):
    """Balance test metrics."""
    duration_seconds: float = Field(..., description="Test duration in seconds")
    stability_score: float = Field(..., ge=0, le=100, description="Overall stability score (0-100)")
    sway_std_x: float = Field(..., description="Sway standard deviation in X (normalized)")
    sway_std_y: float = Field(..., description="Sway standard deviation in Y (normalized)")
    sway_path_length: float = Field(..., description="Total sway path length (normalized)")
    sway_velocity: float = Field(..., description="Average sway velocity (normalized)")
    arm_excursion_left: float = Field(..., description="Left arm angular movement (degrees)")
    arm_excursion_right: float = Field(..., description="Right arm angular movement (degrees)")
    arm_asymmetry_ratio: float = Field(..., description="Left/Right arm movement ratio")
    corrections_count: int = Field(..., description="Number of balance corrections detected")
    duration_score: int = Field(..., ge=1, le=5, description="LTAD duration score (1-5)")
    duration_score_label: str = Field(..., description="LTAD score label (Beginning, Developing, etc.)")
    age_expectation: Optional[str] = Field(None, description="Meets/Above/Below age expectation")


class Assessment(BaseModel):
    """Full assessment model."""
    id: str
    athlete_id: str
    coach_id: str
    test_type: TestType
    leg_tested: LegTested
    video_url: str
    video_path: str
    status: AssessmentStatus
    created_at: datetime
    raw_keypoints_url: Optional[str] = None
    metrics: Optional[MetricsData] = None
    ai_feedback: Optional[str] = None  # Populated in Phase 7
    failure_reason: Optional[str] = None
    error_message: Optional[str] = None


class AssessmentCreate(BaseModel):
    """Request model for creating assessment."""
    athlete_id: str = Field(..., min_length=1)
    test_type: TestType
    leg_tested: LegTested
    video_url: str = Field(..., min_length=1)
    video_path: str = Field(..., min_length=1)
    duration: float = Field(..., gt=0, le=40, description="Client-measured video duration in seconds")


class AssessmentResponse(BaseModel):
    """Response model for assessment."""
    id: str
    athlete_id: str
    test_type: TestType
    leg_tested: LegTested
    status: AssessmentStatus
    created_at: datetime
    metrics: Optional[MetricsData] = None
    ai_feedback: Optional[str] = None
    failure_reason: Optional[str] = None
    error_message: Optional[str] = None


class AnalyzeResponse(BaseModel):
    """Response for analyze endpoint."""
    id: str
    status: AssessmentStatus
    message: str = "Assessment created and processing started"
