"""Main video analysis orchestrator."""

import json
import logging
from typing import Dict, List, Tuple
from firebase_admin import storage

from app.utils.video import extract_frames
from app.utils.filtering import filter_landmarks
from app.services.mediapipe_processor import PoseProcessor, FailureDetector

logger = logging.getLogger(__name__)


async def analyze_video(
    assessment_id: str,
    video_path: str,
    leg_tested: str,
    client_duration: float,
) -> Dict:
    """Analyze video and extract pose metrics.

    Args:
        assessment_id: Assessment ID (for saving keypoints)
        video_path: Local path to video file
        leg_tested: "left" or "right"
        client_duration: Client-measured video duration in seconds

    Returns:
        Dictionary containing:
            - filtered_landmarks: List of filtered landmark frames
            - timestamps: List of timestamps
            - duration: Total duration in seconds
            - failure_reason: Reason for test failure or "time_complete"
            - raw_keypoints_url: URL to raw keypoints JSON in Cloud Storage

    Raises:
        ValueError: If video processing fails
    """
    processor = PoseProcessor()
    detector = FailureDetector(leg_tested)

    # Use client-provided duration (measured during actual recording)
    # WebM files from MediaRecorder don't have reliable duration metadata
    actual_video_duration = client_duration

    logger.info(
        f"Using client-provided duration: {client_duration:.1f}s "
        f"(WebM metadata is unreliable)"
    )

    # Validate video duration upfront
    if actual_video_duration < 5.0:
        raise ValueError(
            f"Video is too short ({actual_video_duration:.1f}s). "
            f"Expected at least 5 seconds of video. "
            f"Please ensure the recording captured properly."
        )

    if actual_video_duration > 40.0:
        raise ValueError(
            f"Video is too long ({actual_video_duration:.1f}s). "
            f"Expected maximum 40 seconds (including countdown). "
            f"Video may have extra content at the end."
        )

    raw_landmarks = []
    timestamps = []
    failure_reason = "time_complete"
    frames_processed = 0
    frames_with_pose = 0

    try:
        # Extract and process frames
        prev_timestamp_ms = -1  # Track previous timestamp for debugging
        for frame, timestamp in extract_frames(video_path, target_fps=30):
            frames_processed += 1
            timestamp_ms = int(timestamp * 1000)

            # Debug logging for first 5 frames
            if frames_processed <= 5:
                logger.info(
                    f"Frame {frames_processed}: timestamp={timestamp:.6f}s, "
                    f"timestamp_ms={timestamp_ms}, prev_ms={prev_timestamp_ms}, "
                    f"monotonic={'✓' if timestamp_ms > prev_timestamp_ms else '✗ FAIL'}"
                )

            # Process with MediaPipe
            landmarks = processor.process_frame(frame, timestamp_ms)
            prev_timestamp_ms = timestamp_ms

            if landmarks is not None:
                frames_with_pose += 1
                raw_landmarks.append(landmarks)
                timestamps.append(timestamp)

                # Check for failures (after countdown buffer)
                failure = detector.check_failure(landmarks, timestamp)
                if failure:
                    failure_reason = failure
                    logger.info(f"Test failure detected at {timestamp:.2f}s: {failure}")
                    break

            # Safety: Stop at 35 seconds
            if timestamp > 35.0:
                break

        # Validate we have enough data
        if frames_processed == 0:
            raise ValueError("No frames could be extracted from video")

        if frames_with_pose == 0:
            raise ValueError("No person detected in video")

        if frames_with_pose / frames_processed < 0.5:
            raise ValueError(
                f"Person detected in less than 50% of frames ({frames_with_pose}/{frames_processed})"
            )

        # Apply low-pass filter to smooth trajectories
        filtered_landmarks = filter_landmarks(raw_landmarks, fps=30.0)

        # Calculate test duration (how long user balanced)
        test_duration = timestamps[-1] if timestamps else 0.0

        # Calculate actual duration from processed frames for verification
        actual_frame_count = len(timestamps)
        calculated_duration = actual_frame_count / 30.0  # 30 FPS target

        logger.info(
            f"Duration validation - "
            f"Client provided: {client_duration:.2f}s, "
            f"Frames processed: {actual_frame_count}, "
            f"Calculated from frames: {calculated_duration:.2f}s, "
            f"Test balance time: {test_duration:.2f}s"
        )

        # Warn if there's significant discrepancy (>2 seconds)
        if abs(client_duration - calculated_duration) > 2.0:
            logger.warning(
                f"Duration mismatch: client reported {client_duration:.2f}s "
                f"but frame count suggests {calculated_duration:.2f}s"
            )

        # Save raw keypoints to Cloud Storage
        raw_keypoints_url = await _save_keypoints_to_storage(
            assessment_id,
            raw_landmarks,
            filtered_landmarks,
            timestamps,
            failure_reason,
            test_duration,
            leg_tested,
        )

        logger.info(
            f"Analysis complete: {frames_processed} frames, "
            f"{frames_with_pose} with pose, {test_duration:.2f}s test duration"
        )

        return {
            "filtered_landmarks": filtered_landmarks,
            "timestamps": timestamps,
            "duration": test_duration,  # How long user balanced (not video length)
            "failure_reason": failure_reason,
            "raw_keypoints_url": raw_keypoints_url,
        }

    finally:
        processor.close()


async def _save_keypoints_to_storage(
    assessment_id: str,
    raw_landmarks: List,
    filtered_landmarks: List,
    timestamps: List[float],
    failure_reason: str,
    duration: float,
    leg_tested: str,
) -> str:
    """Save keypoints to Cloud Storage as JSON.

    Args:
        assessment_id: Assessment ID
        raw_landmarks: Raw landmark data
        filtered_landmarks: Filtered landmark data
        timestamps: Frame timestamps
        failure_reason: Test failure reason
        duration: Test duration
        leg_tested: Which leg was tested

    Returns:
        Download URL for the JSON file
    """
    from app.firebase import get_bucket
    import tempfile
    import os

    # Prepare data
    data = {
        "landmarks": raw_landmarks,
        "filtered_landmarks": filtered_landmarks,
        "timestamps": timestamps,
        "fps": 30.0,
        "leg_tested": leg_tested,
        "failure_reason": failure_reason,
        "duration_seconds": duration,
    }

    # Write to temp file
    temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False)
    try:
        json.dump(data, temp_file, indent=2)
        temp_file.close()

        # Upload to Cloud Storage
        bucket = get_bucket()
        blob_path = f"assessments/{assessment_id}/raw_keypoints.json"
        blob = bucket.blob(blob_path)
        blob.upload_from_filename(temp_file.name, content_type='application/json')

        # Make publicly readable (or use signed URLs)
        blob.make_public()
        url = blob.public_url

        return url

    finally:
        if os.path.exists(temp_file.name):
            os.unlink(temp_file.name)
