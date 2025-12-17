"""Assessment data models."""

from enum import Enum
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, validator


class TestType(str, Enum):
    """Type of balance test."""
    ONE_LEG_BALANCE = "one_leg_balance"
    ANTHROPOMETRIC = "anthropometric"


class LegTested(str, Enum):
    """Which leg was tested."""
    LEFT = "left"
    RIGHT = "right"
    BOTH = "both"  # NEW: For bilateral assessments


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


class SegmentMetrics(BaseModel):
    """Metrics for a temporal segment (first/middle/last third of test)."""
    arm_angle_left: float = Field(..., description="Arm angle from horizontal in degrees (0° = T-position)")
    arm_angle_right: float = Field(..., description="Arm angle from horizontal in degrees (0° = T-position)")
    sway_velocity: float = Field(..., description="Sway velocity in cm/s")
    corrections_count: int = Field(..., description="Number of corrections in this segment")


class TemporalMetrics(BaseModel):
    """Temporal breakdown of metrics (test split into thirds)."""
    first_third: SegmentMetrics = Field(..., description="Metrics for first third of test (0-33%)")
    middle_third: SegmentMetrics = Field(..., description="Metrics for middle third of test (33-66%)")
    last_third: SegmentMetrics = Field(..., description="Metrics for last third of test (66-100%)")


class TimeSegment(BaseModel):
    """Metrics for a time segment with configurable duration (typically 1 second)."""
    start_time: float = Field(..., description="Start time in seconds")
    end_time: float = Field(..., description="End time in seconds")
    avg_velocity: float = Field(..., description="Average sway velocity (cm/s)")
    corrections: int = Field(..., description="Number of corrections")
    arm_angle_left: float = Field(..., description="Average left arm angle (degrees)")
    arm_angle_right: float = Field(..., description="Average right arm angle (degrees)")
    sway_std_x: float = Field(..., description="Sway standard deviation X (cm)")
    sway_std_y: float = Field(..., description="Sway standard deviation Y (cm)")


class SegmentedMetrics(BaseModel):
    """Temporal breakdown with configurable segment duration."""
    segment_duration: float = Field(..., description="Duration of each segment in seconds (typically 1.0)")
    segments: list[TimeSegment] = Field(..., description="Array of time segments covering full test duration")


class BalanceEvent(BaseModel):
    """Significant events detected during balance test."""
    time: float = Field(..., description="Time in seconds into test")
    type: str = Field(..., description="Event type: 'flapping', 'correction_burst', 'stabilized', 'arm_drop'")
    severity: Optional[str] = Field(None, description="Severity: 'low', 'medium', 'high'")
    detail: str = Field(..., description="Human-readable event description")


class BilateralComparison(BaseModel):
    """
    Bilateral comparison metrics for dual-leg balance assessments.
    Quantifies symmetry and identifies dominant leg.

    NOTE: Field names match frontend SymmetryAnalysis interface.
    Backend uses snake_case, frontend converts to camelCase via axios interceptor.
    """
    # Duration comparison
    hold_time_difference: float = Field(
        ...,
        description="Absolute difference in hold time (seconds): |left - right|"
    )
    hold_time_difference_pct: float = Field(
        ...,
        ge=0,
        le=100,
        description="Duration difference as percentage of longer hold time"
    )
    dominant_leg: str = Field(
        ...,
        description="Dominant leg: 'left', 'right', or 'balanced' (<20% difference)"
    )

    # Sway comparison
    sway_velocity_difference: float = Field(
        ...,
        ge=0,
        description="Absolute difference in sway velocity (cm/s): |left - right|"
    )
    sway_symmetry_score: float = Field(
        ...,
        ge=0,
        le=1,
        description="Sway symmetry score: 0=asymmetric, 1=perfect symmetry"
    )

    # Arm comparison
    arm_angle_difference: float = Field(
        ...,
        ge=0,
        description="Average arm angle difference (degrees): |left_avg - right_avg|"
    )

    # Corrections comparison
    corrections_count_difference: int = Field(
        ...,
        description="Difference in corrections count: left - right (signed)"
    )

    # Overall assessment
    overall_symmetry_score: float = Field(
        ...,
        ge=0,
        le=100,
        description="Overall symmetry score: 0=poor, 100=excellent symmetry"
    )
    symmetry_assessment: str = Field(
        ...,
        description="Qualitative assessment: 'excellent', 'good', 'fair', or 'poor'"
    )


class ClientMetricsData(BaseModel):
    """
    Client-side metrics from browser-based balance test (source of truth).
    All metrics in real-world units (cm, degrees).
    """
    success: bool = Field(..., description="Whether the test was passed")
    hold_time: float = Field(..., ge=0, description="Duration held in seconds")
    failure_reason: Optional[str] = Field(None, description="Reason for test failure")
    # Sway metrics (cm)
    sway_std_x: float = Field(..., description="Sway standard deviation in X (cm)")
    sway_std_y: float = Field(..., description="Sway standard deviation in Y (cm)")
    sway_path_length: float = Field(..., description="Total sway path length (cm)")
    sway_velocity: float = Field(..., description="Average sway velocity (cm/s)")
    corrections_count: int = Field(..., description="Number of balance corrections detected")
    # Arm metrics (degrees)
    arm_angle_left: float = Field(..., description="Left arm angle from horizontal (degrees, 0° = T-position)")
    arm_angle_right: float = Field(..., description="Right arm angle from horizontal (degrees, 0° = T-position)")
    arm_asymmetry_ratio: float = Field(..., description="Left/Right arm angle ratio")
    # BACKWARD COMPAT: Legacy temporal fields (kept for old assessments)
    temporal: Optional[TemporalMetrics] = Field(None, description="Legacy temporal breakdown (thirds)")
    # NEW: Unified temporal data with configurable segment duration
    segmented_metrics: Optional[SegmentedMetrics] = Field(
        None,
        description="Time segments with configurable duration (typically 1-second)"
    )
    events: Optional[list[BalanceEvent]] = Field(
        None,
        description="Significant balance events detected during test"
    )


class DualLegMetrics(BaseModel):
    """
    Container for dual-leg assessment metrics.
    Includes full client metrics for both legs (with temporal data).

    NOTE: Client may send symmetry_analysis, but backend ignores it and recalculates.
    """
    class Config:
        extra = "ignore"  # Ignore extra fields like symmetry_analysis from client

    left_leg: ClientMetricsData = Field(..., description="Left leg test metrics")
    right_leg: ClientMetricsData = Field(..., description="Right leg test metrics")


class MetricsData(BaseModel):
    """
    Balance test metrics (stored in assessment).
    Consolidated single source of truth for all metrics.
    All metrics in real-world units (cm, degrees).
    """
    # Test result
    success: bool = Field(..., description="Whether the test was passed")
    hold_time: float = Field(..., ge=0, description="Test hold time in seconds")
    failure_reason: Optional[str] = Field(None, description="Reason for test failure")
    # Sway metrics (cm)
    sway_std_x: float = Field(..., description="Sway standard deviation in X (cm)")
    sway_std_y: float = Field(..., description="Sway standard deviation in Y (cm)")
    sway_path_length: float = Field(..., description="Total sway path length (cm)")
    sway_velocity: float = Field(..., description="Average sway velocity (cm/s)")
    corrections_count: int = Field(..., description="Number of balance corrections detected")
    # Arm metrics (degrees)
    arm_angle_left: float = Field(..., description="Left arm angle from horizontal (degrees, 0° = T-position)")
    arm_angle_right: float = Field(..., description="Right arm angle from horizontal (degrees, 0° = T-position)")
    arm_asymmetry_ratio: float = Field(..., description="Left/Right arm angle ratio")
    # LTAD Score (validated by Athletics Canada LTAD framework)
    duration_score: int = Field(..., ge=1, le=5, description="LTAD duration score (1-5)")
    # BACKWARD COMPAT: Legacy temporal fields (kept for old assessments)
    temporal: Optional[TemporalMetrics] = Field(None, description="Legacy temporal breakdown (thirds)")
    # NEW: Unified temporal data with configurable segment duration
    segmented_metrics: Optional[SegmentedMetrics] = Field(
        None,
        description="Time segments with configurable duration (typically 1-second)"
    )
    events: Optional[list[BalanceEvent]] = Field(
        None,
        description="Significant balance events detected during test"
    )


class Assessment(BaseModel):
    """Full assessment model."""
    id: str
    athlete_id: str
    coach_id: str
    test_type: TestType
    leg_tested: LegTested

    # Single-leg fields (existing, now optional for backward compat)
    video_url: Optional[str] = None
    video_path: Optional[str] = None

    # Dual-leg video fields (NEW)
    left_leg_video_url: Optional[str] = None
    left_leg_video_path: Optional[str] = None
    right_leg_video_url: Optional[str] = None
    right_leg_video_path: Optional[str] = None

    status: AssessmentStatus
    created_at: datetime
    raw_keypoints_url: Optional[str] = None

    # Single-leg metrics (existing, now optional)
    metrics: Optional[MetricsData] = None

    # Dual-leg metrics (NEW)
    left_leg_metrics: Optional[MetricsData] = None
    right_leg_metrics: Optional[MetricsData] = None
    bilateral_comparison: Optional[BilateralComparison] = None

    # Common fields
    ai_coach_assessment: Optional[str] = None  # Coach-friendly assessment feedback (Phase 7)
    error_message: Optional[str] = None


class AssessmentCreate(BaseModel):
    """
    Request model for creating assessment (single-leg or dual-leg).

    **BREAKING CHANGE**: Field names updated for consistency:
    - `video_url` → `left_video_url`
    - `video_path` → `left_video_path`
    - `duration` → `left_duration`

    This ensures consistent naming for both single-leg and dual-leg modes.
    """
    athlete_id: str = Field(..., min_length=1)
    test_type: TestType
    leg_tested: LegTested

    # Single-leg fields (RENAMED for consistency)
    left_video_url: Optional[str] = Field(None, min_length=1, description="Left leg video URL (or single leg for legacy)")
    left_video_path: Optional[str] = Field(None, min_length=1, description="Left leg video storage path")
    left_duration: Optional[float] = Field(None, gt=0, le=40, description="Left leg video duration (seconds)")
    client_metrics: Optional[ClientMetricsData] = Field(None, description="Single-leg metrics (legacy)")

    # Dual-leg fields (NEW)
    right_video_url: Optional[str] = Field(None, min_length=1, description="Right leg video URL")
    right_video_path: Optional[str] = Field(None, min_length=1, description="Right leg video storage path")
    right_duration: Optional[float] = Field(None, gt=0, le=40, description="Right leg video duration (seconds)")
    dual_leg_metrics: Optional[DualLegMetrics] = Field(None, description="Dual-leg metrics with both legs")

    @validator('right_video_url', always=True)
    def validate_right_video_url(cls, v, values):
        """Require right_video_url when leg_tested == 'both'."""
        leg_tested = values.get('leg_tested')
        if leg_tested == LegTested.BOTH and not v:
            raise ValueError("right_video_url required when leg_tested is 'both'")
        return v

    @validator('dual_leg_metrics', always=True)
    def validate_dual_leg_metrics(cls, v, values):
        """Require dual_leg_metrics when leg_tested == 'both'."""
        leg_tested = values.get('leg_tested')
        if leg_tested == LegTested.BOTH and v is None:
            raise ValueError("dual_leg_metrics required when leg_tested is 'both'")
        if leg_tested in [LegTested.LEFT, LegTested.RIGHT] and v is not None:
            raise ValueError("dual_leg_metrics should only be provided when leg_tested is 'both'")
        return v


class AssessmentResponse(BaseModel):
    """Response model for assessment."""
    id: str
    athlete_id: str
    test_type: TestType
    leg_tested: LegTested
    status: AssessmentStatus
    created_at: datetime

    # Single-leg fields
    video_url: Optional[str] = None
    video_path: Optional[str] = None
    metrics: Optional[MetricsData] = None

    # Dual-leg fields (NEW)
    left_leg_video_url: Optional[str] = None
    left_leg_video_path: Optional[str] = None
    right_leg_video_url: Optional[str] = None
    right_leg_video_path: Optional[str] = None
    left_leg_metrics: Optional[MetricsData] = None
    right_leg_metrics: Optional[MetricsData] = None
    bilateral_comparison: Optional[BilateralComparison] = None

    # Common fields
    ai_coach_assessment: Optional[str] = None
    error_message: Optional[str] = None


class AnalyzeResponse(BaseModel):
    """Response for analyze endpoint."""
    id: str
    status: AssessmentStatus
    message: str = "Assessment completed"


class AssessmentListItem(BaseModel):
    """Lightweight assessment for list views (denormalized with athlete name)."""
    id: str
    athlete_id: str
    athlete_name: str = Field(..., description="Denormalized athlete name for display")
    test_type: TestType
    leg_tested: LegTested
    created_at: datetime
    status: AssessmentStatus
    duration_seconds: Optional[float] = Field(None, description="Test duration in seconds")
    left_leg_hold_time: Optional[float] = Field(None, description="Left leg hold time in seconds")
    right_leg_hold_time: Optional[float] = Field(None, description="Right leg hold time in seconds")


class AssessmentListResponse(BaseModel):
    """Response model for list of assessments with pagination."""
    assessments: list[AssessmentListItem]
    next_cursor: Optional[str] = Field(None, description="Cursor for next page")
    has_more: bool = Field(False, description="Whether there are more results")


class UpdateNotesRequest(BaseModel):
    """Request to update coach notes."""
    notes: str = Field(default="", description="Coach notes for this assessment")
