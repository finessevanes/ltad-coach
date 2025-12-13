---
id: BE-007
depends_on: [BE-006]
blocks: [BE-008, BE-009]
status: superseded
---

# BE-007: MediaPipe Video Analysis Pipeline

> ## ⚠️ SUPERSEDED
>
> **This PRD has been superseded by client-side implementation.**
>
> The architecture changed to use client-side MediaPipe.js as the SOURCE OF TRUTH for all CV metrics. Server-side MediaPipe processing was never implemented. All pose detection, failure detection, and metrics calculation now happens in the browser.
>
> See:
> - [client/src/hooks/useMediaPipe.ts](../../client/src/hooks/useMediaPipe.ts) - Pose detection
> - [client/src/utils/metricsCalculation.ts](../../client/src/utils/metricsCalculation.ts) - Metrics calculation
> - [client/src/utils/positionDetection.ts](../../client/src/utils/positionDetection.ts) - Failure detection

## Title
~~Implement server-side MediaPipe pose analysis for video processing~~

## Scope

### In Scope
- MediaPipe Pose Landmarker setup in Python
- Frame-by-frame video processing
- Raw keypoint extraction and storage
- Failure event detection (foot touchdown, support foot moves)
- Test duration calculation
- Low-pass filtering of landmark trajectories

### Out of Scope
- Metric calculations (BE-008)
- AI feedback generation (BE-009, BE-010)

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Video Processing | OpenCV | Standard, reliable video frame extraction |
| Pose Model | BlazePose Lite | Good accuracy, faster processing |
| MediaPipe Version | mediapipe>=0.10.9 | Latest stable with Pose Landmarker API |
| Filter | Butterworth 2Hz cutoff | Standard for postural sway research |
| Storage | Firebase Storage for keypoints | Consistent with architecture |

## MediaPipe Version Specification

**Backend Package**: `mediapipe>=0.10.9` (Python)
- Uses BlazePose model with 33 landmarks (full body)
- Pose Landmarker API (not legacy Pose Solution)

**Frontend Package**: `@mediapipe/tasks-vision>=0.10.9` (JavaScript)
- Must match backend version to ensure consistent landmark indices
- Both use BlazePose model with identical 33-landmark skeleton

### Pros of Version Alignment
- Identical landmark indices (0-32) on both client and server
- Consistent skeleton structure ensures preview matches final analysis
- No mapping layer needed between preview and server results

### Cons / Risks
- Must pin versions to prevent drift
- Frontend bundle size (~5MB for WASM model)
- Different runtime environments (WASM vs native) may have slight pose detection differences

### Landmark Index Reference
Both client and server use the same indices:
- Nose: 0
- Left/Right Hip: 23/24
- Left/Right Ankle: 27/28
- Left/Right Wrist: 15/16
- Full 33-landmark map in `constants/landmarks.py`

## Acceptance Criteria

- [ ] MediaPipe processes video and extracts pose landmarks
- [ ] Raw keypoints saved to Firebase Storage as JSON
- [ ] Detects foot touchdown failure event
- [ ] Detects hands leaving hips failure event
- [ ] Detects support foot movement failure event
- [ ] Calculates test duration (time until failure or full 30s)
- [ ] Applies low-pass filter to landmark trajectories
- [ ] Handles videos with no person detected gracefully
- [ ] Processing completes within 30 seconds for 30s video

## Files to Create/Modify

```
backend/app/
├── services/
│   ├── analysis.py              # Main analysis orchestrator
│   └── mediapipe_processor.py   # MediaPipe processing logic
├── utils/
│   ├── __init__.py
│   ├── video.py                 # Video frame extraction
│   └── filtering.py             # Signal filtering utilities
└── constants/
    ├── __init__.py
    └── landmarks.py             # MediaPipe landmark indices
```

## Implementation Details

### constants/landmarks.py
```python
"""MediaPipe BlazePose landmark indices"""

# Key landmarks for balance analysis
LEFT_HIP = 23
RIGHT_HIP = 24
LEFT_ANKLE = 27
RIGHT_ANKLE = 28
LEFT_WRIST = 15
RIGHT_WRIST = 16
LEFT_SHOULDER = 11
RIGHT_SHOULDER = 12

# Hip midpoint calculation
HIP_LANDMARKS = [LEFT_HIP, RIGHT_HIP]

# For foot touchdown detection
ANKLE_LANDMARKS = [LEFT_ANKLE, RIGHT_ANKLE]
FOOT_TOUCHDOWN_THRESHOLD = 0.05  # Y-axis threshold

# For support foot movement detection
SUPPORT_FOOT_MOVEMENT_THRESHOLD = 0.05  # ~5% of pose bounding box (frame-relative)
```

### utils/video.py
```python
import cv2
from typing import Generator, Tuple
import numpy as np

def extract_frames(
    video_path: str,
    target_fps: int = 30
) -> Generator[Tuple[np.ndarray, float], None, None]:
    """
    Extract frames from video file.
    Yields (frame, timestamp) tuples.
    """
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {video_path}")

    original_fps = cap.get(cv2.CAP_PROP_FPS)
    frame_interval = max(1, int(original_fps / target_fps))

    frame_count = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_count % frame_interval == 0:
            timestamp = frame_count / original_fps
            # Convert BGR to RGB for MediaPipe
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            yield rgb_frame, timestamp

        frame_count += 1

    cap.release()

def get_video_info(video_path: str) -> dict:
    """Get video metadata"""
    cap = cv2.VideoCapture(video_path)
    info = {
        "fps": cap.get(cv2.CAP_PROP_FPS),
        "width": int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
        "height": int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
        "frame_count": int(cap.get(cv2.CAP_PROP_FRAME_COUNT)),
        "duration": cap.get(cv2.CAP_PROP_FRAME_COUNT) / cap.get(cv2.CAP_PROP_FPS),
    }
    cap.release()
    return info
```

### utils/filtering.py
```python
from scipy.signal import butter, filtfilt
import numpy as np

def butter_lowpass_filter(
    data: np.ndarray,
    cutoff: float = 2.0,
    fs: float = 30.0,
    order: int = 2
) -> np.ndarray:
    """
    Apply Butterworth low-pass filter to data.

    Args:
        data: Input signal (1D array)
        cutoff: Cutoff frequency in Hz
        fs: Sampling frequency in Hz
        order: Filter order

    Returns:
        Filtered signal
    """
    if len(data) < 10:  # Not enough data to filter
        return data

    nyquist = 0.5 * fs
    normalized_cutoff = cutoff / nyquist
    b, a = butter(order, normalized_cutoff, btype='low', analog=False)

    # Pad to avoid edge effects
    padded = np.pad(data, (10, 10), mode='edge')
    filtered = filtfilt(b, a, padded)
    return filtered[10:-10]

def filter_landmarks(
    landmarks: list,
    fps: float = 30.0
) -> list:
    """
    Apply low-pass filter to all landmark trajectories.

    Args:
        landmarks: List of frame landmarks, each frame is list of (x, y, z, visibility)
        fps: Frame rate

    Returns:
        Filtered landmarks in same format
    """
    if len(landmarks) < 10:
        return landmarks

    # Convert to numpy for processing
    num_frames = len(landmarks)
    num_landmarks = len(landmarks[0])

    # Extract x, y coordinates for each landmark
    filtered = []
    for landmark_idx in range(num_landmarks):
        x_coords = np.array([f[landmark_idx][0] for f in landmarks])
        y_coords = np.array([f[landmark_idx][1] for f in landmarks])

        x_filtered = butter_lowpass_filter(x_coords, cutoff=2.0, fs=fps)
        y_filtered = butter_lowpass_filter(y_coords, cutoff=2.0, fs=fps)

        if landmark_idx == 0:
            filtered = [[] for _ in range(num_frames)]

        for frame_idx in range(num_frames):
            filtered[frame_idx].append((
                x_filtered[frame_idx],
                y_filtered[frame_idx],
                landmarks[frame_idx][landmark_idx][2],  # z unchanged
                landmarks[frame_idx][landmark_idx][3],  # visibility unchanged
            ))

    return filtered
```

### services/mediapipe_processor.py
```python
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import numpy as np
from typing import Optional, Tuple, List
from app.constants.landmarks import *
from app.utils.filtering import filter_landmarks

class PoseProcessor:
    def __init__(self):
        # Initialize MediaPipe Pose Landmarker
        base_options = python.BaseOptions(
            model_asset_path='models/pose_landmarker_lite.task'
        )
        options = vision.PoseLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.VIDEO,
            num_poses=1,
            min_pose_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        self.landmarker = vision.PoseLandmarker.create_from_options(options)

    def process_frame(
        self,
        frame: np.ndarray,
        timestamp_ms: int
    ) -> Optional[List[Tuple[float, float, float, float]]]:
        """
        Process a single frame and return landmarks.

        Returns:
            List of (x, y, z, visibility) for each landmark, or None if no pose detected
        """
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame)
        result = self.landmarker.detect_for_video(mp_image, timestamp_ms)

        if not result.pose_landmarks or len(result.pose_landmarks) == 0:
            return None

        landmarks = result.pose_landmarks[0]
        return [
            (lm.x, lm.y, lm.z, lm.visibility)
            for lm in landmarks
        ]

    def close(self):
        self.landmarker.close()

class FailureDetector:
    """Detects test failure events from pose landmarks"""

    def __init__(self, leg_tested: str):
        self.leg_tested = leg_tested
        self.support_ankle = LEFT_ANKLE if leg_tested == "left" else RIGHT_ANKLE
        self.raised_ankle = RIGHT_ANKLE if leg_tested == "left" else LEFT_ANKLE
        self.initial_support_position = None

    def check_failure(
        self,
        landmarks: List[Tuple[float, float, float, float]],
        timestamp: float
    ) -> Optional[str]:
        """
        Check for failure conditions.

        Returns:
            Failure reason string or None if no failure
        """
        # Initialize support foot position on first frame
        if self.initial_support_position is None:
            self.initial_support_position = (
                landmarks[self.support_ankle][0],
                landmarks[self.support_ankle][1]
            )

        # Check foot touchdown
        support_y = landmarks[self.support_ankle][1]
        raised_y = landmarks[self.raised_ankle][1]

        if abs(support_y - raised_y) < FOOT_TOUCHDOWN_THRESHOLD:
            return "foot_touchdown"

        # Check support foot movement
        current_support = (
            landmarks[self.support_ankle][0],
            landmarks[self.support_ankle][1]
        )
        movement = np.sqrt(
            (current_support[0] - self.initial_support_position[0])**2 +
            (current_support[1] - self.initial_support_position[1])**2
        )

        if movement > SUPPORT_FOOT_MOVEMENT_THRESHOLD:
            return "support_foot_moved"

        return None
```

### services/analysis.py
```python
import json
import tempfile
from firebase_admin import storage
from app.services.mediapipe_processor import PoseProcessor, FailureDetector
from app.utils.video import extract_frames, get_video_info
from app.utils.filtering import filter_landmarks
from app.repositories.assessment import AssessmentRepository

async def analyze_video(
    assessment_id: str,
    video_path: str,
    leg_tested: str
) -> dict:
    """
    Main analysis pipeline.

    Args:
        assessment_id: Assessment document ID
        video_path: Path to video file
        leg_tested: 'left' or 'right'

    Returns:
        Dict with metrics, raw_keypoints_url, ai_feedback
    """
    processor = PoseProcessor()
    failure_detector = FailureDetector(leg_tested)

    raw_landmarks = []
    timestamps = []
    failure_reason = None
    failure_timestamp = None
    test_start_time = None

    try:
        video_info = get_video_info(video_path)
        fps = video_info["fps"]

        for frame, timestamp in extract_frames(video_path, target_fps=30):
            # Skip first 3-5 seconds (countdown buffer)
            if timestamp < 3.0:
                continue

            if test_start_time is None:
                test_start_time = timestamp

            landmarks = processor.process_frame(
                frame,
                int(timestamp * 1000)
            )

            if landmarks is None:
                continue

            raw_landmarks.append(landmarks)
            timestamps.append(timestamp - test_start_time)

            # Check for failure (only after first second of test)
            if timestamp - test_start_time > 1.0:
                failure = failure_detector.check_failure(landmarks, timestamp)
                if failure:
                    failure_reason = failure
                    failure_timestamp = timestamp - test_start_time
                    break

            # Stop at 30 seconds
            if timestamp - test_start_time >= 30.0:
                failure_reason = "time_complete"
                failure_timestamp = 30.0
                break

    finally:
        processor.close()

    # Apply low-pass filter
    filtered_landmarks = filter_landmarks(raw_landmarks, fps=30.0)

    # Calculate duration
    duration = failure_timestamp or (timestamps[-1] if timestamps else 0)

    # Save raw keypoints to Firebase Storage
    keypoints_data = {
        "landmarks": raw_landmarks,  # Unfiltered for potential re-analysis
        "filtered_landmarks": filtered_landmarks,
        "timestamps": timestamps,
        "fps": 30.0,
        "leg_tested": leg_tested,
        "failure_reason": failure_reason,
        "duration_seconds": duration,
    }

    keypoints_path = f"assessments/{assessment_id}/raw_keypoints.json"
    bucket = storage.bucket()
    blob = bucket.blob(keypoints_path)
    blob.upload_from_string(
        json.dumps(keypoints_data),
        content_type="application/json"
    )
    keypoints_url = blob.public_url

    # Return data for metric calculation (BE-008) and AI processing (BE-009)
    return {
        "filtered_landmarks": filtered_landmarks,
        "timestamps": timestamps,
        "duration_seconds": duration,
        "failure_reason": failure_reason,
        "raw_keypoints_url": keypoints_url,
        "leg_tested": leg_tested,
    }
```

## Dependencies to Add

```toml
# pyproject.toml
mediapipe = "0.10.9"
opencv-python = "^4.9.0"
scipy = "^1.12.0"
numpy = "^1.26.0"
```

## Model File Setup

The MediaPipe pose model is automatically downloaded during Render deployment (see BE-001 `render.yaml`).

For local development, download manually:
```bash
mkdir -p backend/models
wget -O backend/models/pose_landmarker_lite.task \
  https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task
```

Model path in code: `models/pose_landmarker_lite.task` (relative to backend root).

## Estimated Complexity
**L** (Large) - 6-8 hours

## Testing Instructions

1. Process a test video:
```python
from app.services.analysis import analyze_video

result = await analyze_video(
    assessment_id="test_123",
    video_path="/path/to/test.mp4",
    leg_tested="left"
)
print(result)
```

2. Verify keypoints JSON saved to Storage
3. Test failure detection:
   - Video where person puts foot down
   - Video where hands leave hips
   - Video where support foot shifts
4. Verify duration calculation is accurate
5. Benchmark processing time (should be <30s for 30s video)

## Notes
- MediaPipe model file must be downloaded separately
- Consider GPU acceleration for faster processing
- Filtering helps smooth noisy landmark detections
- Raw (unfiltered) keypoints stored for potential future re-analysis
