---
id: BE-008
depends_on: [BE-007]
blocks: [BE-009, BE-010, BE-012]
status: partially-superseded
---

# BE-008: Metrics Calculation

> ## ⚠️ PARTIALLY SUPERSEDED
>
> **Most of this PRD has been superseded by client-side implementation.**
>
> The architecture changed to use client-side MediaPipe.js as the SOURCE OF TRUTH for all CV metrics. The backend now only implements:
> - **LTAD duration score (1-5)** - `get_duration_score()` in [backend/app/services/metrics.py](../app/services/metrics.py)
> - **Age expectation** - `get_age_expectation()` in the same file
>
> All other metrics (stability score, sway, arm excursion, corrections count) are calculated client-side:
> - [client/src/utils/metricsCalculation.ts](../../client/src/utils/metricsCalculation.ts)

## Title
~~Implement balance test metrics calculation from pose landmarks~~

## Scope

### ~~In Scope~~ (Superseded - now client-side)
- ~~Stability score calculation~~
- ~~Sway metrics (std, path length, velocity)~~
- ~~Arm excursion metrics~~
- ~~Corrections count~~
- ~~Team-relative quality rankings~~

### Still Implemented (Backend)
- LTAD duration score (1-5)
- Age expectation comparison (above/meets/below)

### Out of Scope
- AI feedback generation (BE-009, BE-010)
- National percentile calculation (post-MVP, requires torso-length normalization + data collection)
- Fatigue analysis (first 10s vs last 10s comparison) - post-MVP

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Normalization | None (raw values) | Enables intra-individual progress tracking; cross-athlete comparison is secondary |
| Progress Tracking | Rolling 3-test average | Compare athlete to themselves over time |
| Stability Formula | Weighted composite | Combines multiple quality factors using reference value scaling |
| Rankings | Team-relative (raw scores) | No body-size adjustment for MVP; acceptable for team context |

## Acceptance Criteria

- [ ] Calculate all metrics defined in PRD Section 11
- [ ] Duration score maps to 1-5 LTAD scale
- [ ] Sway metrics stored as raw values (no height normalization)
- [ ] Stability score on 0-100 scale using reference value scaling
- [ ] Arm excursion calculated from shoulder-wrist distance
- [ ] Corrections count from sway threshold crossings
- [ ] Quality rankings calculated within coach's roster
- [ ] Progress comparison to rolling 3-test average
- [ ] Leg asymmetry calculation when both legs tested in session

## Files to Create/Modify

```
backend/app/
├── services/
│   └── metrics.py               # Metrics calculation
├── utils/
│   └── math_utils.py            # Mathematical helpers
└── constants/
    └── scoring.py               # LTAD scoring constants
```

## Implementation Details

### constants/scoring.py
```python
"""LTAD scoring thresholds and constants"""

# Duration score thresholds (seconds)
DURATION_SCORE_THRESHOLDS = {
    1: (1, 9),      # Beginning
    2: (10, 14),    # Developing
    3: (15, 19),    # Competent
    4: (20, 24),    # Proficient
    5: (25, None),  # Advanced (25+ seconds)
}

DURATION_SCORE_LABELS = {
    1: "Beginning",
    2: "Developing",
    3: "Competent",
    4: "Proficient",
    5: "Advanced",
}

# Age-based expected scores (LTAD framework - Jeremy Frisch benchmarks)
AGE_EXPECTED_SCORES = {
    (5, 6): 1,    # Beginning expected
    (7, 7): 2,    # Developing expected
    (8, 9): 3,    # Competent expected
    (10, 11): 4,  # Proficient expected
    (12, 13): 5,  # Advanced expected
}

# Stability score weights
STABILITY_WEIGHTS = {
    "sway_std": 0.25,
    "sway_velocity": 0.30,
    "arm_excursion": 0.25,
    "corrections": 0.20,
}

# Correction threshold (in normalized pose coordinates, ~5% of pose bounding box)
CORRECTION_THRESHOLD = 0.02

# Reference values for stability score calculation (from research data)
# Used to scale raw metrics to 0-1 range for weighted combination
# NOT used for height-based normalization (we store raw values)
REFERENCE_VALUES = {
    "sway_std_max": 0.05,        # Worst case sway std (normalized pose coords)
    "sway_velocity_max": 5.0,    # Worst case velocity (normalized coords/s)
    "arm_excursion_max": 100,    # Worst case arm movement degrees
    "corrections_max": 10,       # Worst case corrections count
}
```

### utils/math_utils.py
```python
import numpy as np
from typing import List, Tuple

def calculate_euclidean_distance(
    p1: Tuple[float, float],
    p2: Tuple[float, float]
) -> float:
    """Calculate Euclidean distance between two points"""
    return np.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)

def calculate_path_length(points: List[Tuple[float, float]]) -> float:
    """Calculate total path length through a series of points"""
    if len(points) < 2:
        return 0.0

    total = 0.0
    for i in range(1, len(points)):
        total += calculate_euclidean_distance(points[i-1], points[i])
    return total

def count_threshold_crossings(
    values: np.ndarray,
    threshold: float,
    center: float = 0.0
) -> int:
    """
    Count number of times signal crosses threshold from center.
    A correction = exceeds threshold then returns.
    """
    crossings = 0
    outside = False

    for value in values:
        distance_from_center = abs(value - center)

        if not outside and distance_from_center > threshold:
            outside = True
        elif outside and distance_from_center < threshold:
            crossings += 1
            outside = False

    return crossings
```

### services/metrics.py
```python
import numpy as np
from typing import List, Tuple, Optional
from app.constants.landmarks import *
from app.constants.scoring import *
from app.utils.math_utils import (
    calculate_path_length,
    count_threshold_crossings,
)

class MetricsCalculator:
    """Calculate balance test metrics from pose landmarks.

    Stores raw metric values (no height normalization) to enable
    intra-individual progress tracking over time.
    """

    def __init__(
        self,
        filtered_landmarks: List[List[Tuple[float, float, float, float]]],
        timestamps: List[float],
        duration_seconds: float,
        failure_reason: Optional[str],
        leg_tested: str
    ):
        self.landmarks = filtered_landmarks
        self.timestamps = timestamps
        self.duration = duration_seconds
        self.failure_reason = failure_reason
        self.leg_tested = leg_tested

    def calculate_all(self) -> dict:
        """Calculate all metrics (raw values, no height normalization)"""
        if not self.landmarks:
            return self._empty_metrics()

        # Extract hip midpoints for sway analysis
        hip_trajectory = self._get_hip_trajectory()

        # Calculate sway metrics (raw values in normalized pose coordinates)
        sway_std_x = np.std([p[0] for p in hip_trajectory])
        sway_std_y = np.std([p[1] for p in hip_trajectory])
        sway_path_length = calculate_path_length(hip_trajectory)
        sway_velocity = sway_path_length / self.duration if self.duration > 0 else 0

        # Calculate arm excursion
        arm_left, arm_right = self._calculate_arm_excursion()
        arm_asymmetry = arm_left / arm_right if arm_right > 0 else 1.0

        # Count corrections (fixed threshold in normalized pose coordinates)
        hip_x = np.array([p[0] for p in hip_trajectory])
        center_x = np.mean(hip_x)
        corrections = count_threshold_crossings(
            hip_x,
            CORRECTION_THRESHOLD,
            center_x
        )

        # Calculate stability score (uses reference values for scaling, not height)
        stability_score = self._calculate_stability_score(
            sway_std=max(sway_std_x, sway_std_y),
            sway_velocity=sway_velocity,
            arm_excursion=(arm_left + arm_right) / 2,
            corrections=corrections
        )

        return {
            "duration_seconds": round(self.duration, 2),
            "stability_score": round(stability_score, 1),
            "sway_std_x": round(sway_std_x, 5),       # Raw value in normalized pose coords
            "sway_std_y": round(sway_std_y, 5),       # Raw value in normalized pose coords
            "sway_path_length": round(sway_path_length, 4),  # Raw value
            "sway_velocity": round(sway_velocity, 4),        # Raw value
            "arm_excursion_left": round(arm_left, 1),
            "arm_excursion_right": round(arm_right, 1),
            "arm_asymmetry_ratio": round(arm_asymmetry, 2),
            "corrections_count": corrections,
            "failure_reason": self.failure_reason,
        }

    def _get_hip_trajectory(self) -> List[Tuple[float, float]]:
        """Extract hip midpoint trajectory"""
        trajectory = []
        for frame_landmarks in self.landmarks:
            left_hip = frame_landmarks[LEFT_HIP]
            right_hip = frame_landmarks[RIGHT_HIP]
            midpoint = (
                (left_hip[0] + right_hip[0]) / 2,
                (left_hip[1] + right_hip[1]) / 2
            )
            trajectory.append(midpoint)
        return trajectory

    def _calculate_arm_excursion(self) -> Tuple[float, float]:
        """Calculate total arm movement in degrees"""
        if len(self.landmarks) < 2:
            return (0.0, 0.0)

        left_excursion = 0.0
        right_excursion = 0.0

        for i in range(1, len(self.landmarks)):
            prev = self.landmarks[i-1]
            curr = self.landmarks[i]

            # Left arm: angle change from shoulder to wrist
            left_delta = self._angle_between(
                prev[LEFT_SHOULDER], prev[LEFT_WRIST],
                curr[LEFT_SHOULDER], curr[LEFT_WRIST]
            )
            left_excursion += abs(left_delta)

            # Right arm
            right_delta = self._angle_between(
                prev[RIGHT_SHOULDER], prev[RIGHT_WRIST],
                curr[RIGHT_SHOULDER], curr[RIGHT_WRIST]
            )
            right_excursion += abs(right_delta)

        return (left_excursion, right_excursion)

    def _angle_between(
        self,
        shoulder1: Tuple, wrist1: Tuple,
        shoulder2: Tuple, wrist2: Tuple
    ) -> float:
        """Calculate angle change between two arm positions"""
        angle1 = np.arctan2(
            wrist1[1] - shoulder1[1],
            wrist1[0] - shoulder1[0]
        )
        angle2 = np.arctan2(
            wrist2[1] - shoulder2[1],
            wrist2[0] - shoulder2[0]
        )
        return np.degrees(angle2 - angle1)

    def _calculate_stability_score(
        self,
        sway_std: float,
        sway_velocity: float,
        arm_excursion: float,
        corrections: int
    ) -> float:
        """Calculate composite stability score (0-100).

        Uses REFERENCE_VALUES to scale raw metrics to 0-1 range.
        This is NOT height-based normalization - it's reference scaling
        for the weighted combination formula.
        """
        # Scale each metric to 0-1 using reference values (lower is better for all)
        norm_sway = min(sway_std / REFERENCE_VALUES["sway_std_max"], 1.0)
        norm_velocity = min(sway_velocity / REFERENCE_VALUES["sway_velocity_max"], 1.0)
        norm_arm = min(arm_excursion / REFERENCE_VALUES["arm_excursion_max"], 1.0)
        norm_corrections = min(corrections / REFERENCE_VALUES["corrections_max"], 1.0)

        # Weighted average (inverted so higher = better)
        weighted_avg = (
            STABILITY_WEIGHTS["sway_std"] * norm_sway +
            STABILITY_WEIGHTS["sway_velocity"] * norm_velocity +
            STABILITY_WEIGHTS["arm_excursion"] * norm_arm +
            STABILITY_WEIGHTS["corrections"] * norm_corrections
        )

        # Convert to 0-100 scale (100 = best)
        return max(0, min(100, (1 - weighted_avg) * 100))

    def _empty_metrics(self) -> dict:
        """Return empty metrics when no data available"""
        return {
            "duration_seconds": 0,
            "stability_score": 0,
            "sway_std_x": 0,
            "sway_std_y": 0,
            "sway_path_length": 0,
            "sway_velocity": 0,
            "arm_excursion_left": 0,
            "arm_excursion_right": 0,
            "arm_asymmetry_ratio": 1.0,
            "corrections_count": 0,
            "failure_reason": self.failure_reason,
        }

def get_duration_score(duration_seconds: float) -> Tuple[int, str]:
    """
    Map duration to LTAD score (1-5).

    Returns:
        (score, label) tuple
    """
    for score, (min_sec, max_sec) in DURATION_SCORE_THRESHOLDS.items():
        if max_sec is None:
            if duration_seconds >= min_sec:
                return (score, DURATION_SCORE_LABELS[score])
        elif min_sec <= duration_seconds <= max_sec:
            return (score, DURATION_SCORE_LABELS[score])

    return (1, DURATION_SCORE_LABELS[1])  # Default to Beginning

def get_age_expectation(age: int, score: int) -> str:
    """
    Compare score to age-based expectation.

    Returns:
        'meets', 'above', or 'below'
    """
    for (min_age, max_age), expected in AGE_EXPECTED_SCORES.items():
        if min_age <= age <= max_age:
            if score > expected:
                return "above"
            elif score < expected:
                return "below"
            else:
                return "meets"

    return "meets"  # Default if age not in range

async def calculate_team_ranking(
    coach_id: str,
    athlete_id: str,
    stability_score: float
) -> Tuple[int, int]:
    """
    Calculate athlete's ranking within coach's roster.

    Returns:
        (rank, total) tuple, e.g., (3, 12) for "3rd of 12"
    """
    from app.repositories.assessment import AssessmentRepository
    from app.repositories.athlete import AthleteRepository

    assessment_repo = AssessmentRepository()
    athlete_repo = AthleteRepository()

    # Get all athletes for coach
    athletes = await athlete_repo.get_by_coach(coach_id)

    # Get latest assessment for each athlete
    scores = []
    for athlete in athletes:
        assessments = await assessment_repo.get_by_athlete(athlete.id, limit=1)
        if assessments and assessments[0].metrics:
            scores.append({
                "athlete_id": athlete.id,
                "stability_score": assessments[0].metrics.stability_score
            })

    # Add current athlete's score
    scores.append({
        "athlete_id": athlete_id,
        "stability_score": stability_score
    })

    # Sort by stability score (descending)
    scores.sort(key=lambda x: x["stability_score"], reverse=True)

    # Find rank
    rank = next(
        i + 1
        for i, s in enumerate(scores)
        if s["athlete_id"] == athlete_id
    )

    return (rank, len(scores))


async def calculate_progress_comparison(
    athlete_id: str,
    current_metrics: dict
) -> dict:
    """
    Compare current metrics to athlete's rolling average of last 3 tests.

    Returns:
        Dict with percent_change for each metric, e.g.:
        {"sway_velocity_change": -12.5, "stability_score_change": 8.2, ...}
        Returns empty dict if no prior assessments exist.
    """
    from app.repositories.assessment import AssessmentRepository
    repo = AssessmentRepository()

    # Get last 3 completed assessments for this athlete (excluding current)
    history = await repo.get_by_athlete(athlete_id, limit=3)

    if len(history) < 1:
        return {}  # No history to compare

    # Calculate rolling averages
    averages = {}
    for metric in ["sway_velocity", "stability_score", "sway_std_x", "sway_std_y"]:
        values = [a.metrics.get(metric, 0) for a in history if a.metrics]
        if values:
            averages[metric] = sum(values) / len(values)

    # Calculate percent changes
    changes = {}
    for metric, avg in averages.items():
        if avg > 0:
            current = current_metrics.get(metric, 0)
            change = ((current - avg) / avg) * 100
            changes[f"{metric}_change"] = round(change, 1)

    return changes


def calculate_leg_asymmetry(
    left_leg_metrics: dict,
    right_leg_metrics: dict
) -> dict:
    """
    Calculate asymmetry between left and right leg tests.
    Only called when both legs tested in same session.

    Formula: abs(left - right) / avg(left, right)

    Returns:
        Dict with asymmetry ratios, e.g.:
        {"stability_score_asymmetry": 0.15, "sway_velocity_asymmetry": 0.08}
    """
    result = {}

    for metric in ["stability_score", "sway_velocity", "duration_seconds"]:
        left = left_leg_metrics.get(metric, 0)
        right = right_leg_metrics.get(metric, 0)
        avg = (left + right) / 2

        if avg > 0:
            asymmetry = abs(left - right) / avg
            result[f"{metric}_asymmetry"] = round(asymmetry, 3)

    return result
```

## API Integration

Update `services/analysis.py` to use metrics:

```python
from app.services.metrics import (
    MetricsCalculator,
    get_duration_score,
    calculate_team_ranking,
    calculate_progress_comparison,
    calculate_leg_asymmetry,
)

# In analyze_video function, after getting landmarks:
calculator = MetricsCalculator(
    filtered_landmarks=filtered_landmarks,
    timestamps=timestamps,
    duration_seconds=duration,
    failure_reason=failure_reason,
    leg_tested=leg_tested,
)
metrics = calculator.calculate_all()

# Calculate team ranking (uses raw scores, not body-size-adjusted)
rank, total = await calculate_team_ranking(
    coach_id, athlete_id, metrics["stability_score"]
)

# Calculate progress comparison to rolling 3-test average
progress_comparison = await calculate_progress_comparison(
    athlete_id, metrics
)
metrics["progress_comparison"] = progress_comparison if progress_comparison else None

# If both legs tested in same session, calculate asymmetry
# (requires checking for other leg assessment in current session)
```

## Estimated Complexity
**M** (Medium) - 4-5 hours

## Testing Instructions

1. Unit test metrics calculation:
```python
from app.services.metrics import MetricsCalculator, get_duration_score

# Test duration scoring (30-second test max)
assert get_duration_score(5) == (1, "Beginning")
assert get_duration_score(15) == (3, "Competent")
assert get_duration_score(20) == (4, "Proficient")
assert get_duration_score(25) == (5, "Advanced")
assert get_duration_score(30) == (5, "Advanced")  # Max duration

# Test stability score calculation
calculator = MetricsCalculator(
    filtered_landmarks=test_landmarks,
    timestamps=test_timestamps,
    duration_seconds=15.0,
    failure_reason="time_complete",
    leg_tested="left"
)
metrics = calculator.calculate_all()
assert 0 <= metrics["stability_score"] <= 100
```

2. Test with real video analysis output
3. Verify team ranking updates when new assessments added

## Notes
- Metrics are stored as raw values (no height normalization) for intra-individual progress tracking
- Stability score uses reference value scaling (not height-based normalization)
- Team ranking uses raw scores (acceptable for MVP team context; not marketed as scientifically normalized)
- Progress comparison enables "You improved 18% since last month" style feedback
- Leg asymmetry is optional - only calculated when both legs tested in same session
- National percentiles are post-MVP (requires torso-length normalization + data collection)
