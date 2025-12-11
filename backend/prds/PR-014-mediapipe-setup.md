COMPLETED

---
id: BE-014
depends_on: [BE-012]
blocks: [BE-015, BE-016, BE-017, BE-018, BE-019]
status: COMPLETED
---

# BE-014: MediaPipe Python Setup & Landmark Extraction

## Scope

**In Scope:**
- Install MediaPipe Python SDK
- Extract pose landmarks from video
- Filter and smooth landmark trajectories
- Return structured keypoint data

**Out of Scope:**
- Metric calculations (BE-016, BE-017)
- Failure detection (BE-015)
- Storage of keypoints (BE-019)

## Technical Decisions

- **MediaPipe Model**: BlazePose (33 landmarks)
- **Processing**: Frame-by-frame extraction at 30 FPS
- **Filtering**: Low-pass Butterworth filter (configurable cutoff)
- **Output Format**: List of frames, each with 33 landmarks (x, y, z, visibility)
- **Service Location**: `app/services/mediapipe_service.py`

## Acceptance Criteria

- [ ] MediaPipe installed and working
- [ ] Extract landmarks from video file
- [ ] Process all frames (30 FPS minimum)
- [ ] Return structured data with timestamps
- [ ] Handle videos with no pose detected gracefully
- [ ] Apply basic filtering to reduce noise

## Files to Create/Modify

- `app/services/mediapipe_service.py` (create)
- `requirements.txt` (modify - add mediapipe, opencv-python, scipy)

## Implementation Notes

**requirements.txt** (add):
```
mediapipe==0.10.8
opencv-python==4.8.1.78
scipy==1.11.4
numpy==1.24.3
```

**app/services/mediapipe_service.py**:
```python
import cv2
import mediapipe as mp
import numpy as np
from scipy.signal import butter, filtfilt
from typing import List, Dict, Any, Optional

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

class MediaPipeService:
    def __init__(self):
        self.pose = mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )

    def extract_landmarks_from_video(self, video_path: str) -> Dict[str, Any]:
        """
        Extract pose landmarks from video file

        Returns:
            {
                "frames": List of landmark data per frame,
                "fps": Video FPS,
                "total_frames": Total frame count,
                "duration": Video duration in seconds
            }
        """
        cap = cv2.VideoCapture(video_path)

        if not cap.isOpened():
            raise ValueError(f"Could not open video: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / fps if fps > 0 else 0

        frames_data = []
        frame_number = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            # Convert to RGB (MediaPipe expects RGB)
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            # Process frame
            results = self.pose.process(rgb_frame)

            timestamp = frame_number / fps

            if results.pose_landmarks:
                landmarks = []
                for lm in results.pose_landmarks.landmark:
                    landmarks.append({
                        "x": lm.x,
                        "y": lm.y,
                        "z": lm.z,
                        "visibility": lm.visibility
                    })

                frames_data.append({
                    "frame": frame_number,
                    "timestamp": timestamp,
                    "landmarks": landmarks
                })
            else:
                # No pose detected in frame
                frames_data.append({
                    "frame": frame_number,
                    "timestamp": timestamp,
                    "landmarks": None
                })

            frame_number += 1

        cap.release()

        return {
            "frames": frames_data,
            "fps": fps,
            "total_frames": total_frames,
            "duration": duration
        }

    def apply_lowpass_filter(
        self,
        data: np.ndarray,
        cutoff: float = 6.0,
        fs: float = 30.0,
        order: int = 2
    ) -> np.ndarray:
        """
        Apply Butterworth low-pass filter to reduce noise

        Args:
            data: 1D array of values
            cutoff: Cutoff frequency (Hz)
            fs: Sampling frequency (Hz)
            order: Filter order

        Returns:
            Filtered data
        """
        nyquist = 0.5 * fs
        normal_cutoff = cutoff / nyquist
        b, a = butter(order, normal_cutoff, btype='low', analog=False)
        filtered_data = filtfilt(b, a, data)
        return filtered_data

# Global instance
mediapipe_service = MediaPipeService()
```

## Testing

Add test endpoint:
```python
from app.services.mediapipe_service import mediapipe_service
from app.services.storage import storage_service

@app.post("/test-mediapipe")
async def test_mediapipe(storage_path: str):
    """Test MediaPipe extraction (provide storage path)"""
    # Download video from storage
    signed_url = storage_service.get_signed_url(storage_path)

    # For testing, assume video is local
    # In production, download from signed_url first

    result = mediapipe_service.extract_landmarks_from_video("test-video.mp4")

    return {
        "total_frames": result["total_frames"],
        "fps": result["fps"],
        "duration": result["duration"],
        "frames_with_pose": sum(1 for f in result["frames"] if f["landmarks"])
    }
```

## Estimated Complexity

**Size**: M (Medium - ~3 hours)

## Notes

- MediaPipe BlazePose outputs 33 landmarks (full body)
- Landmark indices: https://google.github.io/mediapipe/solutions/pose
- Filtering is optional but recommended for stability metrics
- Video must be downloaded from Storage first (use signed URL + requests)
