---
id: BE-017
depends_on: [BE-014]
blocks: [BE-018]
---

# BE-017: Arm Excursion Metrics

## Scope

**In Scope:**
- Calculate left and right arm movement (wrist excursion)
- Arm asymmetry ratio
- Corrections count (threshold crossings)

**Out of Scope:**
- Sway metrics (BE-016)
- Stability score (BE-018)

## Technical Decisions

- **Arm Movement**: Total range of wrist movement relative to shoulder
- **Asymmetry**: Ratio of left/right arm excursion
- **Corrections**: Count of times sway exceeds threshold and returns
- **Threshold**: Configurable, default 2 standard deviations
- **Location**: Add to `mediapipe_service.py`

## Acceptance Criteria

- [ ] Calculate armExcursionLeft
- [ ] Calculate armExcursionRight
- [ ] Calculate armAsymmetryRatio
- [ ] Calculate correctionsCount
- [ ] Handle cases with minimal movement

## Files to Create/Modify

- `app/services/mediapipe_service.py` (modify - add arm metrics)

## Implementation Notes

**app/services/mediapipe_service.py** (add method):
```python
class MediaPipeService:
    # ... existing code ...

    def calculate_arm_metrics(self, frames_data: List[Dict]) -> Dict[str, float]:
        """
        Calculate arm excursion and asymmetry metrics

        Returns:
            {
                "armExcursionLeft": float,
                "armExcursionRight": float,
                "armAsymmetryRatio": float,
                "correctionsCount": int
            }
        """
        LEFT_WRIST = 15
        RIGHT_WRIST = 16
        LEFT_SHOULDER = 11
        RIGHT_SHOULDER = 12
        LEFT_HIP = 23
        RIGHT_HIP = 24

        left_wrist_positions = []
        right_wrist_positions = []
        hip_deviations = []

        for frame in frames_data:
            if not frame["landmarks"]:
                continue

            landmarks = frame["landmarks"]

            # Wrist positions relative to shoulders
            left_wrist = landmarks[LEFT_WRIST]
            right_wrist = landmarks[RIGHT_WRIST]
            left_shoulder = landmarks[LEFT_SHOULDER]
            right_shoulder = landmarks[RIGHT_SHOULDER]

            # Calculate relative positions
            left_rel_x = abs(left_wrist["x"] - left_shoulder["x"])
            left_rel_y = abs(left_wrist["y"] - left_shoulder["y"])
            right_rel_x = abs(right_wrist["x"] - right_shoulder["x"])
            right_rel_y = abs(right_wrist["y"] - right_shoulder["y"])

            left_distance = np.sqrt(left_rel_x**2 + left_rel_y**2)
            right_distance = np.sqrt(right_rel_x**2 + right_rel_y**2)

            left_wrist_positions.append(left_distance)
            right_wrist_positions.append(right_distance)

            # Hip position for corrections count
            left_hip = landmarks[LEFT_HIP]
            right_hip = landmarks[RIGHT_HIP]
            hip_x = (left_hip["x"] + right_hip["x"]) / 2
            hip_deviations.append(hip_x)

        # Arm excursion = range of movement
        arm_excursion_left = float(np.ptp(left_wrist_positions)) if left_wrist_positions else 0
        arm_excursion_right = float(np.ptp(right_wrist_positions)) if right_wrist_positions else 0

        # Asymmetry ratio
        if arm_excursion_right > 0:
            arm_asymmetry = arm_excursion_left / arm_excursion_right
        else:
            arm_asymmetry = 1.0 if arm_excursion_left == 0 else float('inf')

        # Corrections count (threshold crossings)
        corrections_count = self._count_threshold_crossings(hip_deviations)

        return {
            "armExcursionLeft": arm_excursion_left,
            "armExcursionRight": arm_excursion_right,
            "armAsymmetryRatio": arm_asymmetry,
            "correctionsCount": corrections_count
        }

    def _count_threshold_crossings(self, positions: List[float], threshold_std: float = 2.0) -> int:
        """
        Count number of times position exceeds threshold and returns

        Args:
            positions: List of position values
            threshold_std: Threshold in standard deviations

        Returns:
            Number of corrections
        """
        if len(positions) < 10:
            return 0

        positions_array = np.array(positions)
        mean = np.mean(positions_array)
        std = np.std(positions_array)
        threshold = threshold_std * std

        corrections = 0
        outside_threshold = False

        for pos in positions_array:
            deviation = abs(pos - mean)

            if deviation > threshold:
                if not outside_threshold:
                    corrections += 1
                    outside_threshold = True
            else:
                outside_threshold = False

        return corrections
```

## Testing

Test with sample videos showing:
- Minimal arm movement (good balance)
- Significant arm flailing (poor balance)
- Asymmetric compensation

## Estimated Complexity

**Size**: M (Medium - ~2 hours)
