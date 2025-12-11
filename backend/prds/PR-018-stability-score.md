COMPLETED

---
id: BE-018
depends_on: [BE-016, BE-017]
blocks: [BE-029]
status: COMPLETED
---

# BE-018: Stability Score Calculation

## Scope

**In Scope:**
- Composite stability score (0-100)
- Weighted combination of sway, arm, and corrections metrics
- Normalization to 0-100 scale

**Out of Scope:**
- Individual metric calculations (BE-016, BE-017)
- Duration score (BE-021)

## Technical Decisions

- **Formula**: `100 - (w1×sway + w2×arm + w3×corrections + w4×duration_penalty)`
- **Weights**: Calibrated based on LTAD research (configurable)
- **Scale**: Higher score = better stability (0-100)
- **Location**: Add to `mediapipe_service.py`

## Acceptance Criteria

- [ ] Composite score calculated from all quality metrics
- [ ] Score ranges from 0-100
- [ ] Configurable weights
- [ ] Returns score even with partial data

## Files to Create/Modify

- `app/services/mediapipe_service.py` (modify)

## Implementation Notes

**app/services/mediapipe_service.py** (add method):
```python
class MediaPipeService:
    # ... existing code ...

    def calculate_stability_score(
        self,
        sway_metrics: Dict[str, float],
        arm_metrics: Dict[str, float],
        duration: float,
        max_duration: float = 20.0
    ) -> float:
        """
        Calculate composite stability score (0-100)

        Higher score = better stability

        Args:
            sway_metrics: From calculate_sway_metrics
            arm_metrics: From calculate_arm_metrics
            duration: Test duration in seconds
            max_duration: Maximum possible duration

        Returns:
            Stability score (0-100)
        """
        # Normalize metrics to 0-1 scale
        # These values are empirically derived - may need calibration

        # Sway velocity: 0-20 cm/s typical range
        sway_score = min(sway_metrics["swayVelocity"] / 20.0, 1.0)

        # Arm excursion: 0-0.5 typical range
        arm_score = min(
            (arm_metrics["armExcursionLeft"] + arm_metrics["armExcursionRight"]) / 1.0,
            1.0
        )

        # Corrections: 0-10 typical range
        corrections_score = min(arm_metrics["correctionsCount"] / 10.0, 1.0)

        # Duration penalty: shorter duration = lower score
        duration_score = duration / max_duration

        # Weights (sum to 1.0)
        w_sway = 0.35
        w_arm = 0.25
        w_corrections = 0.20
        w_duration = 0.20

        # Calculate composite (invert bad metrics, use duration as-is)
        quality_score = (
            w_duration * duration_score +
            w_sway * (1 - sway_score) +
            w_arm * (1 - arm_score) +
            w_corrections * (1 - corrections_score)
        )

        # Scale to 0-100
        stability_score = quality_score * 100

        return round(stability_score, 2)
```

## Testing

Test with various metric combinations:
- Perfect balance: low sway, low arm, zero corrections, full duration → ~90-100
- Poor balance: high sway, high arm, many corrections, short duration → ~10-30

## Estimated Complexity

**Size**: S (Small - ~1 hour)
