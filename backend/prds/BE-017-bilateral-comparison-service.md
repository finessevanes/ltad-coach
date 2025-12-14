---
id: BE-017
status: 🔵 READY FOR DEVELOPMENT
depends_on: [BE-016]
blocks: [BE-018, BE-019, BE-020]
---

# BE-017: Bilateral Comparison Service

## Title
Create service to calculate symmetry metrics and dominant leg detection for dual-leg assessments

## Scope

### In Scope
- Create `bilateral_comparison.py` service module
- Implement `calculate_bilateral_comparison()` function
- Duration comparison (absolute difference, percentage, dominant leg)
- Sway comparison (absolute difference, symmetry score)
- Arm angle comparison (average difference between legs)
- Corrections comparison (signed difference)
- Overall symmetry scoring algorithm (0-100 scale)
- Symmetry classification (excellent/good/fair/poor)

### Out of Scope
- Data model definitions (BE-016)
- Repository integration (BE-018)
- API endpoint changes (BE-019)
- AI agent bilateral feedback (BE-020)
- Frontend symmetry display (FE-019)

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Symmetry Score Scale | 0-100 | User-friendly percentage-like scale; matches stability_score convention |
| Dominant Leg Threshold | 20% duration difference | Evidence-based threshold from LTAD research; <20% is balanced |
| Sway Symmetry Formula | 1 - (diff / avg) | Normalized ratio handles different sway magnitudes |
| Overall Symmetry Weights | Duration 50%, Sway 30%, Arms 10%, Corrections 10% | Duration is primary balance indicator per LTAD framework |
| Balanced Classification | <20% difference | Aligns with clinical asymmetry thresholds |
| Function Return Type | Dict[str, Any] | Matches repository pattern; converts to Pydantic model at API layer |

## Acceptance Criteria

- [ ] `calculate_bilateral_comparison()` accepts left and right metrics dicts
- [ ] Duration difference calculated in seconds and percentage
- [ ] Dominant leg correctly identified (left/right/balanced threshold at 20%)
- [ ] Sway symmetry score ranges from 0 (asymmetric) to 1 (perfect)
- [ ] Overall symmetry score ranges from 0 to 100
- [ ] Symmetry assessment classified as: excellent (≥85), good (≥70), fair (≥50), poor (<50)
- [ ] All numeric outputs rounded to 1 decimal place
- [ ] Function handles edge cases (zero values, missing fields)
- [ ] Type hints on all parameters and return values
- [ ] Google-style docstring with examples

## Files to Create/Modify

```
backend/app/services/
└── bilateral_comparison.py    # NEW: Symmetry calculation service
```

## Implementation Details

### Create `bilateral_comparison.py`

**File**: `backend/app/services/bilateral_comparison.py`

**Complete Implementation**:

```python
"""Bilateral comparison service for dual-leg assessments."""

from typing import Dict, Any


def calculate_bilateral_comparison(
    left_metrics: Dict[str, Any],
    right_metrics: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Calculate bilateral comparison metrics from left and right leg test data.

    Analyzes symmetry across duration, sway, arm angles, and corrections to provide
    a comprehensive bilateral assessment. Uses LTAD-aligned thresholds for clinical relevance.

    Args:
        left_metrics: Dictionary containing left leg metrics (hold_time, sway_velocity, etc.)
        right_metrics: Dictionary containing right leg metrics (hold_time, sway_velocity, etc.)

    Returns:
        Dictionary containing:
            - duration_difference: Absolute difference in hold time (seconds)
            - duration_difference_pct: Percentage difference (0-100)
            - dominant_leg: 'left', 'right', or 'balanced'
            - sway_difference: Absolute sway velocity difference (cm/s)
            - sway_symmetry_score: 0 (asymmetric) to 1 (perfect symmetry)
            - arm_angle_difference: Average arm angle difference (degrees)
            - corrections_difference: Signed difference in corrections count
            - overall_symmetry_score: Weighted symmetry score (0-100)
            - symmetry_assessment: 'excellent', 'good', 'fair', or 'poor'

    Example:
        >>> left = {"hold_time": 25.3, "sway_velocity": 2.1, ...}
        >>> right = {"hold_time": 23.8, "sway_velocity": 2.3, ...}
        >>> result = calculate_bilateral_comparison(left, right)
        >>> result["overall_symmetry_score"]
        82.5
        >>> result["symmetry_assessment"]
        'good'
    """
    # 1. Duration Comparison
    left_hold = left_metrics.get("hold_time", 0.0)
    right_hold = right_metrics.get("hold_time", 0.0)

    duration_difference = abs(left_hold - right_hold)
    max_duration = max(left_hold, right_hold)
    duration_difference_pct = (
        (duration_difference / max_duration * 100) if max_duration > 0 else 0.0
    )

    # Determine dominant leg (20% threshold for "balanced")
    if duration_difference_pct < 20:
        dominant_leg = "balanced"
    elif left_hold > right_hold:
        dominant_leg = "left"
    else:
        dominant_leg = "right"

    # 2. Sway Comparison
    left_sway = left_metrics.get("sway_velocity", 0.0)
    right_sway = right_metrics.get("sway_velocity", 0.0)

    sway_difference = abs(left_sway - right_sway)
    avg_sway = (left_sway + right_sway) / 2

    # Sway symmetry: 1 = perfect symmetry, 0 = completely different
    sway_symmetry_score = (
        1.0 - min(sway_difference / avg_sway, 1.0) if avg_sway > 0 else 1.0
    )

    # 3. Arm Angle Comparison
    # Average both arms for each leg, then compare
    left_arm_avg = (
        left_metrics.get("arm_angle_left", 0.0) + left_metrics.get("arm_angle_right", 0.0)
    ) / 2
    right_arm_avg = (
        right_metrics.get("arm_angle_left", 0.0) + right_metrics.get("arm_angle_right", 0.0)
    ) / 2

    arm_angle_difference = abs(left_arm_avg - right_arm_avg)

    # 4. Corrections Comparison (signed)
    left_corrections = left_metrics.get("corrections_count", 0)
    right_corrections = right_metrics.get("corrections_count", 0)
    corrections_difference = left_corrections - right_corrections  # Signed

    # 5. Overall Symmetry Score (0-100 scale)
    # Duration symmetry component (50% weight)
    duration_symmetry = max(0, 100 - duration_difference_pct)

    # Sway symmetry component (30% weight)
    sway_symmetry_pct = sway_symmetry_score * 100

    # Arm symmetry component (10% weight)
    # Assume 15 degrees is max acceptable difference (maps to 0)
    arm_symmetry_pct = max(0, 100 - (arm_angle_difference / 15 * 100))

    # Corrections symmetry component (10% weight)
    # Assume 5 corrections difference is max acceptable (maps to 0)
    corrections_symmetry_pct = max(0, 100 - (abs(corrections_difference) / 5 * 100))

    overall_symmetry_score = (
        duration_symmetry * 0.5 +
        sway_symmetry_pct * 0.3 +
        arm_symmetry_pct * 0.1 +
        corrections_symmetry_pct * 0.1
    )

    # Clamp to 0-100 range
    overall_symmetry_score = max(0.0, min(100.0, overall_symmetry_score))

    # 6. Symmetry Assessment Classification
    if overall_symmetry_score >= 85:
        symmetry_assessment = "excellent"
    elif overall_symmetry_score >= 70:
        symmetry_assessment = "good"
    elif overall_symmetry_score >= 50:
        symmetry_assessment = "fair"
    else:
        symmetry_assessment = "poor"

    # Return all metrics rounded to 1 decimal place
    return {
        "duration_difference": round(duration_difference, 1),
        "duration_difference_pct": round(duration_difference_pct, 1),
        "dominant_leg": dominant_leg,
        "sway_difference": round(sway_difference, 1),
        "sway_symmetry_score": round(sway_symmetry_score, 2),
        "arm_angle_difference": round(arm_angle_difference, 1),
        "corrections_difference": corrections_difference,
        "overall_symmetry_score": round(overall_symmetry_score, 1),
        "symmetry_assessment": symmetry_assessment,
    }
```

## API Specification

Not applicable - this is an internal service function.

## Environment Variables

None required.

## Estimated Complexity

**M** (Medium) - 4 hours

**Breakdown**:
- Create service module with function: 1 hour
- Implement calculation algorithm: 1.5 hours
- Handle edge cases and validation: 1 hour
- Testing and validation: 0.5 hours

## Testing Instructions

### 1. Unit Tests

Create test file: `backend/tests/test_bilateral_comparison.py`

**Test balanced legs (minimal difference):**

```python
from backend.app.services.bilateral_comparison import calculate_bilateral_comparison


def test_balanced_legs():
    """Test legs with <20% difference (should classify as balanced)."""
    left = {
        "hold_time": 25.0,
        "sway_velocity": 2.0,
        "arm_angle_left": 10.0,
        "arm_angle_right": 12.0,
        "corrections_count": 8,
    }
    right = {
        "hold_time": 24.0,
        "sway_velocity": 2.1,
        "arm_angle_left": 9.0,
        "arm_angle_right": 11.0,
        "corrections_count": 9,
    }

    result = calculate_bilateral_comparison(left, right)

    assert result["dominant_leg"] == "balanced"
    assert result["duration_difference"] == 1.0
    assert result["duration_difference_pct"] < 20
    assert result["overall_symmetry_score"] >= 85  # Excellent
    assert result["symmetry_assessment"] == "excellent"
```

**Test left-dominant asymmetry:**

```python
def test_left_dominant():
    """Test left leg significantly better than right."""
    left = {
        "hold_time": 30.0,  # Much longer
        "sway_velocity": 1.5,
        "arm_angle_left": 8.0,
        "arm_angle_right": 10.0,
        "corrections_count": 5,
    }
    right = {
        "hold_time": 20.0,  # 33% shorter
        "sway_velocity": 2.8,
        "arm_angle_left": 12.0,
        "arm_angle_right": 15.0,
        "corrections_count": 12,
    }

    result = calculate_bilateral_comparison(left, right)

    assert result["dominant_leg"] == "left"
    assert result["duration_difference"] == 10.0
    assert result["duration_difference_pct"] == 33.3
    assert result["overall_symmetry_score"] < 70  # Fair or poor
    assert result["symmetry_assessment"] in ["fair", "poor"]
```

**Test edge case: zero hold times:**

```python
def test_zero_hold_times():
    """Test both legs failed immediately (0 seconds)."""
    left = {
        "hold_time": 0.0,
        "sway_velocity": 0.0,
        "arm_angle_left": 0.0,
        "arm_angle_right": 0.0,
        "corrections_count": 0,
    }
    right = {
        "hold_time": 0.0,
        "sway_velocity": 0.0,
        "arm_angle_left": 0.0,
        "arm_angle_right": 0.0,
        "corrections_count": 0,
    }

    result = calculate_bilateral_comparison(left, right)

    assert result["duration_difference"] == 0.0
    assert result["dominant_leg"] == "balanced"  # No data, so balanced
    assert result["overall_symmetry_score"] >= 0  # No negative scores
```

**Test sway symmetry calculation:**

```python
def test_sway_symmetry():
    """Test sway symmetry score calculation."""
    # Perfect sway symmetry
    left = {"hold_time": 20, "sway_velocity": 2.0, "arm_angle_left": 10, "arm_angle_right": 10, "corrections_count": 5}
    right = {"hold_time": 20, "sway_velocity": 2.0, "arm_angle_left": 10, "arm_angle_right": 10, "corrections_count": 5}

    result = calculate_bilateral_comparison(left, right)
    assert result["sway_symmetry_score"] == 1.0  # Perfect

    # Moderate sway asymmetry
    left["sway_velocity"] = 2.0
    right["sway_velocity"] = 3.0  # 50% higher

    result = calculate_bilateral_comparison(left, right)
    assert 0 < result["sway_symmetry_score"] < 1.0  # Some asymmetry
```

### 2. Integration Test

**Test with real assessment data:**

```python
def test_with_real_assessment_metrics():
    """Test with realistic MetricsData dictionaries."""
    from backend.app.models.assessment import ClientMetricsData, TemporalMetrics, SegmentMetrics

    # Create realistic client metrics
    left_metrics_obj = ClientMetricsData(
        success=True,
        hold_time=25.3,
        failure_reason=None,
        sway_std_x=1.8,
        sway_std_y=2.4,
        sway_path_length=45.2,
        sway_velocity=1.8,
        corrections_count=8,
        arm_angle_left=8.5,
        arm_angle_right=12.3,
        arm_asymmetry_ratio=0.69,
        temporal=TemporalMetrics(
            first_third=SegmentMetrics(arm_angle_left=9, arm_angle_right=11, sway_velocity=1.5, corrections_count=2),
            middle_third=SegmentMetrics(arm_angle_left=8, arm_angle_right=12, sway_velocity=1.8, corrections_count=3),
            last_third=SegmentMetrics(arm_angle_left=8, arm_angle_right=13, sway_velocity=2.1, corrections_count=3),
        )
    )

    # Convert to dict (simulate repository data)
    left_dict = left_metrics_obj.model_dump()
    right_dict = {**left_dict, "hold_time": 23.8, "sway_velocity": 2.0, "corrections_count": 10}

    result = calculate_bilateral_comparison(left_dict, right_dict)

    assert "overall_symmetry_score" in result
    assert 0 <= result["overall_symmetry_score"] <= 100
    assert result["symmetry_assessment"] in ["excellent", "good", "fair", "poor"]
```

### 3. Manual Testing

Run Python REPL:

```bash
cd backend
source venv/bin/activate
python
```

```python
from app.services.bilateral_comparison import calculate_bilateral_comparison

# Test case 1: Balanced performance
left = {
    "hold_time": 25.0,
    "sway_velocity": 2.0,
    "arm_angle_left": 10.0,
    "arm_angle_right": 12.0,
    "corrections_count": 8,
}
right = {
    "hold_time": 24.5,
    "sway_velocity": 2.1,
    "arm_angle_left": 9.5,
    "arm_angle_right": 11.5,
    "corrections_count": 9,
}

result = calculate_bilateral_comparison(left, right)
print(f"Dominant: {result['dominant_leg']}")
print(f"Overall Symmetry: {result['overall_symmetry_score']}/100")
print(f"Assessment: {result['symmetry_assessment']}")

# Expected: balanced, ~90+ score, excellent
```

## Notes

### Design Rationale

**Why weighted symmetry scoring?**

Different metrics have varying clinical significance:
- **Duration (50%)**: Primary LTAD indicator of balance ability
- **Sway (30%)**: Secondary stability measure, correlates with injury risk
- **Arms (10%)**: Compensatory mechanism, less critical
- **Corrections (10%)**: Can indicate strategy differences vs. imbalance

This weighting ensures the overall score reflects functional balance asymmetry.

**Why 20% threshold for "balanced"?**

Based on LTAD research and clinical guidelines:
- <20% difference: Normal bilateral variation (especially ages 5-9)
- 20-40%: Noticeable imbalance, warrants monitoring
- >40%: Significant asymmetry, physiotherapy referral recommended

**Why normalize sway as `1 - (diff / avg)`?**

Sway velocity varies widely by age (1.5-4 cm/s typical range). Normalizing against the average accounts for:
- Younger athletes with higher baseline sway
- Older athletes with lower baseline sway
- Ensures symmetry score is relative to individual performance

### Edge Case Handling

| Scenario | Behavior | Rationale |
|----------|----------|-----------|
| Both hold times = 0 | `dominant_leg = "balanced"`, 0% difference | No data to determine dominance |
| Division by zero (avg_sway = 0) | `sway_symmetry_score = 1.0` | Default to perfect symmetry when no data |
| Negative values from subtraction | Use absolute values or signed where appropriate | Duration/sway are absolute, corrections are signed |
| Missing metric fields | Use `.get(key, 0.0)` default | Gracefully handle incomplete data |

### Clinical Interpretation Guide

**Overall Symmetry Score Thresholds**:

| Score | Classification | Clinical Meaning | Recommendation |
|-------|---------------|------------------|----------------|
| 85-100 | Excellent | Minimal asymmetry, age-appropriate | Balanced training |
| 70-84 | Good | Slight imbalance, monitor | Continue current program |
| 50-69 | Fair | Noticeable asymmetry | Add weaker leg exercises |
| 0-49 | Poor | Significant imbalance | Physiotherapy consult |

**Dominant Leg Identification**:
- Used to guide training splits (e.g., 60/40 favoring weaker leg)
- "Balanced" is ideal for youth athletes (no preference)
- Persistent dominance may indicate previous injury or developmental gap

### Future Enhancements

**Phase 2 (post-MVP)**:
- Age-specific symmetry thresholds (younger = higher tolerance)
- Sport-specific scoring (gymnastics vs. soccer have different norms)
- Temporal asymmetry analysis (fatigue rate comparison)
- Historical symmetry trending

**Example enhancement**:
```python
def calculate_age_adjusted_symmetry(
    left_metrics: Dict,
    right_metrics: Dict,
    athlete_age: int
) -> Dict:
    """Adjust symmetry thresholds based on athlete age."""
    base_result = calculate_bilateral_comparison(left, right)

    # Ages 5-7: 50% difference is "balanced"
    # Ages 12-13: 20% difference is "balanced"
    age_threshold = 50 - (athlete_age - 5) * 3.75  # Linear interpolation

    # Re-classify dominant leg with age-adjusted threshold
    if base_result["duration_difference_pct"] < age_threshold:
        base_result["dominant_leg"] = "balanced"

    return base_result
```

### Performance Considerations

**Time Complexity**: O(1) - All calculations are simple arithmetic operations

**Memory**: Minimal - Returns single dict with 9 fields

**Optimization**: No optimization needed - function executes in <1ms
