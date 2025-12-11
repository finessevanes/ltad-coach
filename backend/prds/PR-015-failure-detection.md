COMPLETED

---
id: BE-015
depends_on: [BE-014]
blocks: [BE-029]
status: COMPLETED
---

# BE-015: Failure Detection Logic

## Scope

**In Scope:**
- Detect foot touchdown (raised foot touches ground)
- Detect hands leaving hips
- Detect support foot movement
- Determine test duration (time until failure or 20s)
- Return failure reason

**Out of Scope:**
- Metric calculations (BE-016, BE-017)
- Scoring (BE-021)

## Technical Decisions

- **Detection Method**: Landmark position thresholds
- **Foot Touchdown**: Raised ankle Y-coordinate drops to standing foot level
- **Hands Off Hips**: Wrist-to-hip distance exceeds threshold
- **Support Foot Move**: Standing ankle displacement >15cm from start position
- **Location**: Add to `mediapipe_service.py`

## Acceptance Criteria

- [ ] Detect all three failure types accurately
- [ ] Return duration in seconds (time until first failure or 20s)
- [ ] Return failure reason enum
- [ ] Handle edge cases (no pose detected, unclear leg)

## Files to Create/Modify

- `app/services/mediapipe_service.py` (modify - add failure detection)
- `app/models/assessment.py` (create - failure enum)

## Implementation Notes

**app/models/assessment.py**:
```python
from enum import Enum

class FailureReason(str, Enum):
    TIME_COMPLETE = "time_complete"
    FOOT_TOUCHDOWN = "foot_touchdown"
    HANDS_LEFT_HIPS = "hands_left_hips"
    SUPPORT_FOOT_MOVED = "support_foot_moved"
```

**app/services/mediapipe_service.py** (add method):
```python
from app.models.assessment import FailureReason

class MediaPipeService:
    # ... existing code ...

    def detect_failure(
        self,
        frames_data: List[Dict],
        standing_leg: str,  # "left" or "right"
        test_duration: float = 20.0
    ) -> Dict[str, Any]:
        """
        Detect failure events during balance test

        Returns:
            {
                "duration": seconds until failure,
                "failureReason": FailureReason enum,
                "failureFrame": frame number where failure occurred
            }
        """
        # Landmark indices
        LEFT_ANKLE = 27
        RIGHT_ANKLE = 28
        LEFT_HIP = 23
        RIGHT_HIP = 24
        LEFT_WRIST = 15
        RIGHT_WRIST = 16

        # Determine which foot is raised
        raised_ankle_idx = LEFT_ANKLE if standing_leg == "right" else RIGHT_ANKLE
        standing_ankle_idx = RIGHT_ANKLE if standing_leg == "right" else LEFT_ANKLE

        # Get initial standing foot position (average of first 10 frames)
        initial_standing_pos = None
        for frame in frames_data[:10]:
            if frame["landmarks"]:
                ankle = frame["landmarks"][standing_ankle_idx]
                if initial_standing_pos is None:
                    initial_standing_pos = {"x": ankle["x"], "y": ankle["y"]}
                break

        if not initial_standing_pos:
            raise ValueError("Could not detect initial pose")

        # Initial standing foot Y position (for touchdown detection)
        ground_level = initial_standing_pos["y"]

        for frame in frames_data:
            if not frame["landmarks"]:
                continue

            landmarks = frame["landmarks"]
            timestamp = frame["timestamp"]

            # Check if duration exceeded
            if timestamp >= test_duration:
                return {
                    "duration": test_duration,
                    "failureReason": FailureReason.TIME_COMPLETE,
                    "failureFrame": frame["frame"]
                }

            # Check foot touchdown
            raised_ankle = landmarks[raised_ankle_idx]
            if raised_ankle["y"] >= ground_level - 0.05:  # 5% tolerance
                return {
                    "duration": timestamp,
                    "failureReason": FailureReason.FOOT_TOUCHDOWN,
                    "failureFrame": frame["frame"]
                }

            # Check support foot movement
            standing_ankle = landmarks[standing_ankle_idx]
            distance_moved = np.sqrt(
                (standing_ankle["x"] - initial_standing_pos["x"]) ** 2 +
                (standing_ankle["y"] - initial_standing_pos["y"]) ** 2
            )
            if distance_moved > 0.15:  # 15% of frame width
                return {
                    "duration": timestamp,
                    "failureReason": FailureReason.SUPPORT_FOOT_MOVED,
                    "failureFrame": frame["frame"]
                }

            # Check hands left hips
            left_wrist = landmarks[LEFT_WRIST]
            right_wrist = landmarks[RIGHT_WRIST]
            left_hip = landmarks[LEFT_HIP]
            right_hip = landmarks[RIGHT_HIP]

            # Distance from wrists to hips
            left_distance = abs(left_wrist["y"] - left_hip["y"])
            right_distance = abs(right_wrist["y"] - right_hip["y"])

            # Hands should be close to hips (within 10% vertical distance)
            if left_distance > 0.1 or right_distance > 0.1:
                return {
                    "duration": timestamp,
                    "failureReason": FailureReason.HANDS_LEFT_HIPS,
                    "failureFrame": frame["frame"]
                }

        # If we reach here, test completed successfully
        return {
            "duration": test_duration,
            "failureReason": FailureReason.TIME_COMPLETE,
            "failureFrame": frames_data[-1]["frame"] if frames_data else 0
        }
```

## Testing

Test with various video scenarios:
- Full 20s balance
- Early foot touchdown
- Hands coming off hips
- Support foot moving

## Estimated Complexity

**Size**: M (Medium - ~2-3 hours)

## Notes

- Thresholds may need calibration based on real test data
- Consider adding confidence scores for detection
- Edge cases: unclear which leg is standing (may need manual override)
