"""Video frame extraction utilities."""

import cv2
import numpy as np
import logging
from typing import Generator, Tuple, Dict

logger = logging.getLogger(__name__)


def extract_frames(
    video_path: str,
    target_fps: int = 30,
) -> Generator[Tuple[np.ndarray, float], None, None]:
    """Extract frames from video at target FPS.

    Args:
        video_path: Path to video file
        target_fps: Target frames per second

    Yields:
        Tuple of (frame as RGB numpy array, timestamp in seconds)

    Raises:
        ValueError: If video cannot be opened
    """
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        raise ValueError(f"Failed to open video: {video_path}")

    try:
        source_fps = cap.get(cv2.CAP_PROP_FPS)

        # Validate and fallback for FPS (for frame sampling only, not timestamp calculation)
        if source_fps <= 0 or np.isnan(source_fps) or source_fps > 120:
            logger.warning(f"Invalid FPS detected ({source_fps}), using fallback 30.0")
            source_fps = 30.0

        frame_interval = max(1, int(source_fps / target_fps))  # Ensure >= 1
        frame_count = 0
        processed_count = 0

        # Calculate timestamp increment for target FPS
        # Start at 1ms (not 0) to satisfy MediaPipe's strict > requirement
        timestamp_increment_ms = 1000.0 / target_fps
        current_timestamp_ms = 1  # Start at 1ms, not 0

        logger.info(
            f"Video FPS: {source_fps:.2f}, "
            f"Frame interval: {frame_interval}, "
            f"Target FPS: {target_fps}, "
            f"Timestamp increment: {timestamp_increment_ms:.2f}ms"
        )

        while True:
            ret, frame = cap.read()

            if not ret:
                break

            if frame_count % frame_interval == 0:
                # Convert BGR to RGB (MediaPipe expects RGB)
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

                # Calculate timestamp from processed frame count, not source FPS
                # This guarantees monotonicity regardless of video metadata
                timestamp_seconds = current_timestamp_ms / 1000.0

                yield rgb_frame, timestamp_seconds

                # Increment timestamp for next frame
                processed_count += 1
                current_timestamp_ms = int(1 + (processed_count * timestamp_increment_ms))

            frame_count += 1

    finally:
        cap.release()


def get_video_info(video_path: str) -> Dict:
    """Get video metadata.

    Args:
        video_path: Path to video file

    Returns:
        Dictionary with fps, width, height, frame_count, duration

    Raises:
        ValueError: If video cannot be opened
    """
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        raise ValueError(f"Failed to open video: {video_path}")

    try:
        fps = cap.get(cv2.CAP_PROP_FPS)

        # Validate and fallback for FPS (same as extract_frames)
        if fps <= 0 or np.isnan(fps) or fps > 120:
            logger.warning(f"Invalid FPS detected ({fps}), using fallback 30.0 for duration calculation")
            fps = 30.0

        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = frame_count / fps

        logger.info(f"Video info: {width}x{height}, {frame_count} frames, {fps:.2f} fps, {duration:.2f}s")

        return {
            "fps": fps,
            "width": width,
            "height": height,
            "frame_count": frame_count,
            "duration": duration,
        }
    finally:
        cap.release()
