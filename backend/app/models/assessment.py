from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class FailureReason(str, Enum):
    TIME_COMPLETE = "time_complete"
    FOOT_TOUCHDOWN = "foot_touchdown"
    HANDS_LEFT_HIPS = "hands_left_hips"
    SUPPORT_FOOT_MOVED = "support_foot_moved"


class AssessmentMetrics(BaseModel):
    """Metrics calculated from video analysis"""
    # Duration and failure
    duration: float  # seconds
    failureReason: FailureReason
    failureFrame: Optional[int] = None

    # Sway metrics
    swayStdX: float
    swayStdY: float
    swayPathLength: float  # cm
    swayVelocity: float  # cm/s

    # Arm metrics
    armExcursionLeft: float
    armExcursionRight: float
    armAsymmetryRatio: float
    correctionsCount: int

    # Composite scores
    stabilityScore: float  # 0-100


class AssessmentScoring(BaseModel):
    """Scoring information"""
    # LTAD duration score
    durationScore: int  # 1-5
    durationLabel: str  # "Beginning", "Developing", etc.
    expectationStatus: str  # "meets", "above", "below"
    expectedScore: int

    # Percentiles
    nationalPercentile: int  # 0-100 (mock for MVP)
    teamRank: int
    teamTotal: int
    teamPercentile: int


class Assessment(BaseModel):
    """Assessment record"""
    id: Optional[str] = None
    athleteId: str
    coachId: str
    uploadId: str
    videoPath: str
    keypointsPath: Optional[str] = None

    # Test configuration
    standingLeg: str  # "left" or "right"
    athleteAge: int

    # Calculated metrics
    metrics: Optional[AssessmentMetrics] = None

    # Scoring
    scoring: Optional[AssessmentScoring] = None

    # Timestamps
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True
