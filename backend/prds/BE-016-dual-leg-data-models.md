---
id: BE-016
status: 🔵 READY FOR DEVELOPMENT
depends_on: []
blocks: [BE-017, BE-018, BE-019, BE-020]
---

# BE-016: Data Models for Dual-Leg Assessments

## Title
Add Pydantic models and enums to support bilateral balance testing with symmetry analysis

## Scope

### In Scope
- Add `BOTH` option to `LegTested` enum
- Create `BilateralComparison` model for symmetry metrics
- Create `DualLegMetrics` request model
- Update `Assessment` model with dual-leg fields (backward compatible)
- Update `AssessmentCreate` with renamed fields and dual-leg support
- Update `AssessmentResponse` with dual-leg fields

### Out of Scope
- Bilateral comparison calculation logic (BE-017)
- Repository methods for dual-leg assessments (BE-018)
- API endpoint implementation (BE-019)
- AI agent for bilateral feedback (BE-020)
- Frontend type definitions (FE-018)

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Naming Convention | `left_*` / `right_*` prefixes | Consistency across single-leg and dual-leg modes; eliminates ambiguity |
| Backward Compatibility | All dual-leg fields optional in `Assessment` | Existing single-leg assessments remain valid |
| Breaking Change | Rename `video_url` → `left_video_url` in `AssessmentCreate` | Acceptable for development phase; improves clarity for dual-leg flow |
| Symmetry Score Range | 0-100 scale | User-friendly percentage-like scale; aligns with stability_score |
| Dominant Leg Type | String literal ('left', 'right', 'balanced') | Simpler than enum for this three-value field |

## Acceptance Criteria

- [ ] `LegTested` enum includes `BOTH = "both"`
- [ ] `BilateralComparison` model validates all required fields
- [ ] `DualLegMetrics` model wraps two `ClientMetricsData` objects
- [ ] `Assessment` model includes 7 new optional dual-leg fields
- [ ] `AssessmentCreate` uses `left_video_url` instead of `video_url` (breaking change documented)
- [ ] `AssessmentCreate` validates `dual_leg_metrics` when `leg_tested == "both"`
- [ ] All models include proper `Field()` descriptions for API docs
- [ ] Existing single-leg assessment creation still works (backward compat test)
- [ ] `pydantic` validation catches invalid symmetry scores (>100 or <0)

## Files to Create/Modify

```
backend/app/models/
└── assessment.py              # Update enums and models
```

## Implementation Details

### 1. Update `LegTested` Enum

**Location**: Line 14-17 in `backend/app/models/assessment.py`

```python
class LegTested(str, Enum):
    """Which leg was tested."""
    LEFT = "left"
    RIGHT = "right"
    BOTH = "both"  # NEW: For bilateral assessments
```

### 2. Create `BilateralComparison` Model

**Add after `BalanceEvent` class (after line 66):**

```python
class BilateralComparison(BaseModel):
    """
    Bilateral comparison metrics for dual-leg balance assessments.
    Quantifies symmetry and identifies dominant leg.
    """
    # Duration comparison
    duration_difference: float = Field(
        ...,
        description="Absolute difference in hold time (seconds): |left - right|"
    )
    duration_difference_pct: float = Field(
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
    sway_difference: float = Field(
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
    corrections_difference: int = Field(
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
```

### 3. Create `DualLegMetrics` Model

**Add after `ClientMetricsData` class (after line 97):**

```python
class DualLegMetrics(BaseModel):
    """
    Container for dual-leg assessment metrics.
    Includes full client metrics for both legs (with temporal data).
    """
    left_leg: ClientMetricsData = Field(..., description="Left leg test metrics")
    right_leg: ClientMetricsData = Field(..., description="Right leg test metrics")
```

**Note**: Symmetry analysis is calculated server-side and stored separately in `Assessment.bilateral_comparison`.

### 4. Update `Assessment` Model

**Add new fields to `Assessment` class (after line 149, before closing):**

```python
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
    ai_coach_assessment: Optional[str] = None
    error_message: Optional[str] = None
```

**Important Notes**:
- For single-leg: `video_url`, `video_path`, `metrics` are populated
- For dual-leg: `left_leg_video_url`, `right_leg_video_url`, `left_leg_metrics`, `right_leg_metrics`, `bilateral_comparison` are populated
- All new fields are optional for backward compatibility with existing single-leg assessments

### 5. Update `AssessmentCreate` Model

**Replace existing `AssessmentCreate` class (lines 152-160):**

```python
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

    @validator('dual_leg_metrics')
    def validate_dual_leg_metrics(cls, v, values):
        """Require dual_leg_metrics when leg_tested == 'both'."""
        leg_tested = values.get('leg_tested')
        if leg_tested == LegTested.BOTH and v is None:
            raise ValueError("dual_leg_metrics required when leg_tested is 'both'")
        if leg_tested in [LegTested.LEFT, LegTested.RIGHT] and v is not None:
            raise ValueError("dual_leg_metrics should only be provided when leg_tested is 'both'")
        return v

    @validator('right_video_url')
    def validate_right_video_url(cls, v, values):
        """Require right_video_url when leg_tested == 'both'."""
        leg_tested = values.get('leg_tested')
        if leg_tested == LegTested.BOTH and not v:
            raise ValueError("right_video_url required when leg_tested is 'both'")
        return v
```

**Import required for validators:**

Add at top of file (after line 5):

```python
from pydantic import BaseModel, Field, validator
```

### 6. Update `AssessmentResponse` Model

**Update `AssessmentResponse` class (lines 163-173):**

```python
class AssessmentResponse(BaseModel):
    """Response model for assessment."""
    id: str
    athlete_id: str
    test_type: TestType
    leg_tested: LegTested
    status: AssessmentStatus
    created_at: datetime

    # Single-leg fields
    metrics: Optional[MetricsData] = None

    # Dual-leg fields (NEW)
    left_leg_metrics: Optional[MetricsData] = None
    right_leg_metrics: Optional[MetricsData] = None
    bilateral_comparison: Optional[BilateralComparison] = None

    # Common fields
    ai_coach_assessment: Optional[str] = None
    error_message: Optional[str] = None
```

## Migration Notes

### Breaking Changes

**`AssessmentCreate` field renaming** (affects client-side code):

| Old Field Name | New Field Name | Notes |
|---------------|----------------|-------|
| `video_url` | `left_video_url` | Always represents left leg (or single leg) |
| `video_path` | `left_video_path` | Matches video URL |
| `duration` | `left_duration` | Duration of left leg test |

**Impact**: Frontend must update `AssessmentCreate` payloads to use new field names.

**Mitigation**: Since this is a development-phase change, no migration script needed. Update FE-018 in parallel.

### Backward Compatibility

**Existing single-leg assessments**:
- Old assessments in Firestore still use `video_url`, `video_path`, `metrics`
- New `Assessment` model makes all fields optional, so old documents remain valid
- Repository layer will handle reading both old and new field names

**Reading existing assessments**:
```python
# Works for both old and new assessments
video_url = assessment.video_url or assessment.left_leg_video_url
metrics = assessment.metrics or assessment.left_leg_metrics
```

## API Specification

Not applicable - this PRD only updates data models. API changes are in BE-019.

## Environment Variables

None required.

## Estimated Complexity

**M** (Medium) - 4 hours

**Breakdown**:
- Update enums and create new models: 1 hour
- Add validators: 1 hour
- Update existing Assessment/Create/Response models: 1 hour
- Testing and validation: 1 hour

## Testing Instructions

### 1. Model Validation Tests

**Test `LegTested` enum:**

```python
from backend.app.models.assessment import LegTested

def test_leg_tested_enum():
    assert LegTested.LEFT.value == "left"
    assert LegTested.RIGHT.value == "right"
    assert LegTested.BOTH.value == "both"
```

**Test `BilateralComparison` validation:**

```python
from backend.app.models.assessment import BilateralComparison
import pytest

def test_bilateral_comparison_valid():
    comparison = BilateralComparison(
        duration_difference=1.5,
        duration_difference_pct=6.2,
        dominant_leg="left",
        sway_difference=0.3,
        sway_symmetry_score=0.85,
        arm_angle_difference=5.2,
        corrections_difference=-2,
        overall_symmetry_score=82.0,
        symmetry_assessment="good"
    )
    assert comparison.dominant_leg == "left"
    assert comparison.overall_symmetry_score == 82.0

def test_bilateral_comparison_invalid_symmetry_score():
    with pytest.raises(ValueError):
        BilateralComparison(
            duration_difference=1.5,
            duration_difference_pct=6.2,
            dominant_leg="left",
            sway_difference=0.3,
            sway_symmetry_score=1.5,  # Invalid: > 1.0
            arm_angle_difference=5.2,
            corrections_difference=-2,
            overall_symmetry_score=120.0,  # Invalid: > 100
            symmetry_assessment="good"
        )
```

**Test `AssessmentCreate` validators:**

```python
from backend.app.models.assessment import AssessmentCreate, LegTested, TestType, DualLegMetrics, ClientMetricsData

def test_assessment_create_dual_leg_requires_metrics():
    """Dual-leg assessment must include dual_leg_metrics."""
    with pytest.raises(ValueError, match="dual_leg_metrics required"):
        AssessmentCreate(
            athlete_id="athlete123",
            test_type=TestType.ONE_LEG_BALANCE,
            leg_tested=LegTested.BOTH,
            left_video_url="https://example.com/left.mp4",
            left_video_path="videos/left.mp4",
            left_duration=25.3,
            right_video_url="https://example.com/right.mp4",
            right_video_path="videos/right.mp4",
            right_duration=23.8,
            # Missing: dual_leg_metrics
        )

def test_assessment_create_dual_leg_valid():
    """Valid dual-leg assessment creation."""
    left_metrics = ClientMetricsData(
        success=True,
        hold_time=25.3,
        sway_std_x=1.8,
        sway_std_y=2.4,
        sway_path_length=45.2,
        sway_velocity=1.8,
        corrections_count=8,
        arm_angle_left=8.5,
        arm_angle_right=12.3,
        arm_asymmetry_ratio=0.69,
        temporal=TemporalMetrics(...)  # Full temporal data
    )

    right_metrics = ClientMetricsData(...)  # Similar

    assessment = AssessmentCreate(
        athlete_id="athlete123",
        test_type=TestType.ONE_LEG_BALANCE,
        leg_tested=LegTested.BOTH,
        left_video_url="https://example.com/left.mp4",
        left_video_path="videos/left.mp4",
        left_duration=25.3,
        right_video_url="https://example.com/right.mp4",
        right_video_path="videos/right.mp4",
        right_duration=23.8,
        dual_leg_metrics=DualLegMetrics(
            left_leg=left_metrics,
            right_leg=right_metrics
        )
    )
    assert assessment.leg_tested == LegTested.BOTH
```

### 2. Backward Compatibility Test

**Test that old single-leg assessments still parse:**

```python
def test_assessment_backward_compat():
    """Old Assessment documents with video_url should still parse."""
    old_assessment_data = {
        "id": "assess123",
        "athlete_id": "athlete456",
        "coach_id": "coach789",
        "test_type": "one_leg_balance",
        "leg_tested": "left",
        "video_url": "https://example.com/video.mp4",  # Old field name
        "video_path": "videos/video.mp4",  # Old field name
        "status": "completed",
        "created_at": "2025-12-14T10:00:00Z",
        "metrics": {...}  # MetricsData
    }

    assessment = Assessment(**old_assessment_data)
    assert assessment.video_url == "https://example.com/video.mp4"
    assert assessment.left_leg_video_url is None  # New field not set
```

### 3. Manual Testing

Run Python REPL:

```bash
cd backend
source venv/bin/activate
python
```

```python
from app.models.assessment import *

# Test BilateralComparison
comp = BilateralComparison(
    duration_difference=2.0,
    duration_difference_pct=8.0,
    dominant_leg="right",
    sway_difference=0.5,
    sway_symmetry_score=0.75,
    arm_angle_difference=3.5,
    corrections_difference=2,
    overall_symmetry_score=72.0,
    symmetry_assessment="good"
)
print(comp.model_dump())

# Test AssessmentCreate validation
try:
    AssessmentCreate(
        athlete_id="test",
        test_type=TestType.ONE_LEG_BALANCE,
        leg_tested=LegTested.BOTH,
        left_video_url="url1",
        left_video_path="path1",
        # Missing right_video_url - should fail
    )
except ValueError as e:
    print(f"Expected error: {e}")
```

## Notes

### Design Rationale

**Why rename `video_url` to `left_video_url`?**

For single-leg assessments, the current naming is ambiguous:
- `video_url` could mean "the video of the leg being tested"
- For dual-leg, we need `left_video_url` and `right_video_url`
- Using `left_video_url` for single-leg makes it consistent with dual-leg

**Why not use nested `single_leg` and `dual_leg` objects?**

Considered:
```python
# Rejected approach
class Assessment:
    mode: AssessmentMode
    single_leg: Optional[SingleLegData]
    dual_leg: Optional[DualLegData]
```

Rejected because:
- More complex queries (need to check mode then access nested object)
- Frontend mapping more complex
- Firestore queries more verbose
- Current flat structure simpler with optional fields

**Why store `bilateral_comparison` in Assessment, not calculate on-demand?**

- Comparison metrics are cheap to calculate but expensive to recompute
- AI feedback generation references comparison data (needs to be stored)
- Firestore queries can filter by symmetry_assessment
- Historical analysis needs consistent comparison scores

### Temporal Data Preservation

**Critical**: Both `left_leg_metrics` and `right_leg_metrics` include full temporal data:
- `temporal`: FirstThird, MiddleThird, LastThird segments
- `five_second_segments`: Optional 5-second granularity for LLM analysis
- `events`: Optional balance events (flapping, correction_burst, stabilized)

This rich temporal data enables the bilateral AI agent (BE-020) to provide insights like:
- "Left leg fatigued 20% faster than right leg (degradation after 15 seconds)"
- "Both legs showed correction bursts around 10-second mark, indicating core fatigue"

### Future Considerations

**Multi-assessment comparisons** (Phase 8+):
- Current structure supports single dual-leg assessment
- Future: Compare bilateral symmetry over time (trend analysis)
- May need `AssessmentComparison` model for historical analysis

**Three-leg test support** (if needed):
- Current design assumes exactly 2 legs
- Would require refactoring to `legs: List[LegMetrics]` structure
- Not planned for MVP

### Error Handling

| Scenario | Detection | User Message | Recovery |
|----------|-----------|--------------|----------|
| `leg_tested='both'` but missing `dual_leg_metrics` | Pydantic validator | "Dual-leg metrics required for bilateral test" | Fix client payload |
| `leg_tested='left'` with `dual_leg_metrics` | Pydantic validator | "Dual-leg metrics should not be provided for single-leg test" | Fix client payload |
| Invalid symmetry score (>100) | Pydantic field validation | "Symmetry score must be between 0 and 100" | Fix calculation logic |
| Missing `right_video_url` for dual-leg | Pydantic validator | "Right leg video required for bilateral test" | Upload both videos |
