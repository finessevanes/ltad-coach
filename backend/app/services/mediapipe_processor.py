"""MediaPipe pose processing and failure detection."""

import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from typing import Optional, List, Tuple
import numpy as np
import logging

from app.constants import landmarks as lm

logger = logging.getLogger(__name__)


def create_landmarker() -> vision.PoseLandmarker:
    """Create a new MediaPipe PoseLandmarker instance.

    Each video needs its own landmarker instance because VIDEO mode
    requires monotonically increasing timestamps across all frames,
    and reusing the same instance causes timestamp conflicts between videos.

    Returns:
        Initialized PoseLandmarker

    Raises:
        RuntimeError: If model file not found or initialization fails
    """
    try:
        base_options = python.BaseOptions(
            model_asset_path='models/pose_landmarker_lite.task'
        )
        options = vision.PoseLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.VIDEO,
            num_poses=1,
            min_pose_detection_confidence=lm.MINIMUM_POSE_CONFIDENCE,
            min_tracking_confidence=lm.MINIMUM_POSE_CONFIDENCE,
        )
        return vision.PoseLandmarker.create_from_options(options)
    except Exception as e:
        raise RuntimeError(f"Failed to initialize MediaPipe: {e}")


class PoseProcessor:
    """Process video frames with MediaPipe pose detection."""

    def __init__(self):
        """Initialize processor with a fresh landmarker instance."""
        self.landmarker = create_landmarker()
        self.frame_count = 0
        self.last_timestamp_ms = -1
        logger.info("Created new PoseProcessor with fresh MediaPipe landmarker")

    def process_frame(
        self,
        frame: np.ndarray,
        timestamp_ms: int,
    ) -> Optional[List[Tuple[float, float, float, float]]]:
        """Process single frame and extract landmarks.

        Args:
            frame: RGB image as numpy array (H, W, 3)
            timestamp_ms: Timestamp in milliseconds

        Returns:
            List of 33 landmarks as (x, y, z, visibility) tuples, or None if no pose detected
        """
        self.frame_count += 1

        # Debug logging for first 5 frames
        if self.frame_count <= 5:
            is_monotonic = timestamp_ms > self.last_timestamp_ms
            logger.info(
                f"MediaPipe Frame {self.frame_count}: timestamp_ms={timestamp_ms}, "
                f"last={self.last_timestamp_ms}, monotonic={'✓' if is_monotonic else '✗ FAIL'}"
            )
            if not is_monotonic:
                logger.error(
                    f"TIMESTAMP ERROR: Frame {self.frame_count} has timestamp {timestamp_ms} "
                    f"which is NOT > previous {self.last_timestamp_ms}"
                )

        # Create MediaPipe Image
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame)

        # Detect pose
        result = self.landmarker.detect_for_video(mp_image, timestamp_ms)
        self.last_timestamp_ms = timestamp_ms

        if not result.pose_landmarks or len(result.pose_landmarks) == 0:
            return None

        # Extract first pose (we only detect 1 pose)
        pose = result.pose_landmarks[0]

        # Convert to tuple list
        landmarks = []
        for landmark in pose:
            landmarks.append((
                landmark.x,
                landmark.y,
                landmark.z,
                landmark.visibility if hasattr(landmark, 'visibility') else 1.0,
            ))

        return landmarks

    def close(self):
        """Clean up resources."""
        if self.landmarker:
            self.landmarker.close()
            logger.info("Closed MediaPipe landmarker")


class FailureDetector:
    """Detect test failures during pose processing."""

    def __init__(self, leg_tested: str):
        """Initialize detector.

        Args:
            leg_tested: "left" or "right" - which leg is the standing leg
        """
        self.leg_tested = leg_tested

        # Determine which ankle is support and which is raised
        if leg_tested == "left":
            self.support_ankle_idx = lm.LEFT_ANKLE
            self.raised_ankle_idx = lm.RIGHT_ANKLE
        else:
            self.support_ankle_idx = lm.RIGHT_ANKLE
            self.raised_ankle_idx = lm.LEFT_ANKLE

        # Track support foot initial position for movement detection
        self.support_ankle_initial = None

    def check_failure(
        self,
        landmarks: List[Tuple[float, float, float, float]],
        timestamp: float,
    ) -> Optional[str]:
        """Check if test failure occurred.

        Args:
            landmarks: List of 33 landmarks
            timestamp: Current timestamp in seconds

        Returns:
            Failure reason string or None if no failure
        """
        if len(landmarks) != 33:
            return None

        # Skip first 3 seconds (countdown buffer)
        if timestamp < 3.0:
            # Store initial support ankle position
            if self.support_ankle_initial is None:
                self.support_ankle_initial = landmarks[self.support_ankle_idx]
            return None

        # Check 1: Foot touchdown (raised foot touches ground)
        if self._check_foot_touchdown(landmarks):
            return "foot_touchdown"

        # Check 2: Support foot movement
        if self._check_support_foot_moved(landmarks):
            return "support_foot_moved"

        return None

    def _check_foot_touchdown(self, landmarks: List[Tuple]) -> bool:
        """Check if raised foot touched down.

        Args:
            landmarks: Landmark list

        Returns:
            True if foot touched down
        """
        raised_ankle = landmarks[self.raised_ankle_idx]
        support_ankle = landmarks[self.support_ankle_idx]

        # Check if raised ankle is close to support ankle in Y (vertical)
        y_distance = abs(raised_ankle[1] - support_ankle[1])

        return y_distance < lm.FOOT_TOUCHDOWN_THRESHOLD

    def _check_support_foot_moved(self, landmarks: List[Tuple]) -> bool:
        """Check if support foot moved significantly.

        Args:
            landmarks: Landmark list

        Returns:
            True if support foot moved
        """
        if self.support_ankle_initial is None:
            return False

        current = landmarks[self.support_ankle_idx]
        initial = self.support_ankle_initial

        # Calculate displacement
        displacement = np.sqrt(
            (current[0] - initial[0]) ** 2 +
            (current[1] - initial[1]) ** 2
        )

        return displacement > lm.SUPPORT_FOOT_MOVEMENT_THRESHOLD
