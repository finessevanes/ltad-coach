---
id: BE-016
depends_on: [BE-014]
blocks: [BE-018]
---

# BE-016: Sway Metrics Calculation

## Scope

**In Scope:**
- Calculate hip midpoint trajectory
- Sway standard deviation (X and Y axes)
- Sway path length
- Sway velocity
- Normalize by athlete height

**Out of Scope:**
- Arm metrics (BE-017)
- Stability score (BE-018)
- Failure detection (BE-015)

## Technical Decisions

- **Hip Midpoint**: Average of left hip (23) and right hip (24)
- **Normalization**: Use shoulder-to-hip distance as height proxy
- **Filtering**: Apply low-pass filter before calculating metrics
- **Units**: Path length in cm, velocity in cm/s
- **Location**: Add to `mediapipe_service.py`

## Acceptance Criteria

- [ ] Calculate swayStdX (lateral movement variability)
- [ ] Calculate swayStdY (anterior-posterior movement variability)
- [ ] Calculate swayPathLength (total distance traveled)
- [ ] Calculate swayVelocity (path length / duration)
- [ ] Normalize by athlete height
- [ ] Filter trajectory before calculation

## Files to Create/Modify

- `app/services/mediapipe_service.py` (modify - add sway calculations)

## Implementation Notes

**app/services/mediapipe_service.py** (add method):
```python
import numpy as np

class MediaPipeService:
    # ... existing code ...

    def calculate_sway_metrics(self, frames_data: List[Dict], duration: float) -> Dict[str, float]:
        """
        Calculate postural sway metrics from landmark data

        Args:
            frames_data: Landmark data from extract_landmarks_from_video
            duration: Test duration in seconds

        Returns:
            {
                "swayStdX": float,
                "swayStdY": float,
                "swayPathLength": float (cm),
                "swayVelocity": float (cm/s)
            }
        """
        LEFT_HIP = 23
        RIGHT_HIP = 24
        LEFT_SHOULDER = 11
        RIGHT_SHOULDER = 12

        # Extract hip midpoint trajectory
        hip_x = []
        hip_y = []
        timestamps = []

        # Estimate height for normalization (shoulder-to-hip distance)
        height_proxy = None

        for frame in frames_data:
            if not frame["landmarks"]:
                continue

            landmarks = frame["landmarks"]

            # Hip midpoint
            left_hip = landmarks[LEFT_HIP]
            right_hip = landmarks[RIGHT_HIP]
            mid_x = (left_hip["x"] + right_hip["x"]) / 2
            mid_y = (left_hip["y"] + right_hip["y"]) / 2

            hip_x.append(mid_x)
            hip_y.append(mid_y)
            timestamps.append(frame["timestamp"])

            # Calculate height proxy (once)
            if height_proxy is None:
                left_shoulder = landmarks[LEFT_SHOULDER]
                shoulder_y = (left_shoulder["y"] + landmarks[RIGHT_SHOULDER]["y"]) / 2
                hip_y_val = mid_y
                height_proxy = abs(shoulder_y - hip_y_val)

        if len(hip_x) < 10:
            raise ValueError("Insufficient pose data for sway analysis")

        # Convert to numpy arrays
        hip_x = np.array(hip_x)
        hip_y = np.array(hip_y)

        # Apply low-pass filter
        hip_x_filtered = self.apply_lowpass_filter(hip_x, cutoff=6.0, fs=30.0)
        hip_y_filtered = self.apply_lowpass_filter(hip_y, cutoff=6.0, fs=30.0)

        # Calculate standard deviations
        sway_std_x = float(np.std(hip_x_filtered))
        sway_std_y = float(np.std(hip_y_filtered))

        # Calculate path length (sum of distances between consecutive points)
        path_length = 0.0
        for i in range(1, len(hip_x_filtered)):
            dx = hip_x_filtered[i] - hip_x_filtered[i-1]
            dy = hip_y_filtered[i] - hip_y_filtered[i-1]
            path_length += np.sqrt(dx**2 + dy**2)

        # Normalize by height proxy and convert to cm
        # Assuming frame width represents ~1.5m, so multiply by 150cm
        cm_factor = 150.0
        if height_proxy and height_proxy > 0:
            path_length_cm = (path_length / height_proxy) * cm_factor
        else:
            path_length_cm = path_length * cm_factor

        # Calculate velocity
        sway_velocity = path_length_cm / duration if duration > 0 else 0

        return {
            "swayStdX": sway_std_x,
            "swayStdY": sway_std_y,
            "swayPathLength": path_length_cm,
            "swayVelocity": sway_velocity
        }
```

## Testing

Test with sample video:
- Extract landmarks
- Calculate sway metrics
- Verify values are reasonable (std < 0.1, path length 10-100cm, velocity 1-20 cm/s)

## Estimated Complexity

**Size**: M (Medium - ~2-3 hours)

## Notes

- These metrics are research-validated for balance assessment
- Sway velocity is particularly reliable across populations
- Normalization ensures comparability across different camera distances
