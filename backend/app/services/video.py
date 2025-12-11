"""Video download and validation utilities."""

import os
import tempfile
import subprocess
import logging
from typing import Tuple
from firebase_admin import storage

logger = logging.getLogger(__name__)


async def download_video_from_storage(
    video_path: str,
) -> str:
    """Download video from Firebase Storage to temp file.

    Args:
        video_path: Firebase Storage path (e.g., "assessments/athlete_id/timestamp.webm")

    Returns:
        Path to temporary file

    Raises:
        ValueError: If video not found or download fails
    """
    from app.firebase import get_bucket

    logger.info(f"Downloading video from Storage: {video_path}")

    bucket = get_bucket()
    blob = bucket.blob(video_path)

    if not blob.exists():
        raise ValueError(f"Video not found at path: {video_path}")

    # Create temp file
    suffix = os.path.splitext(video_path)[1] or '.webm'
    temp_file = tempfile.NamedTemporaryFile(suffix=suffix, delete=False)
    temp_file.close()

    # Download
    blob.download_to_filename(temp_file.name)

    file_size = os.path.getsize(temp_file.name)
    logger.info(f"Downloaded video to {temp_file.name} ({file_size} bytes)")

    return temp_file.name


def validate_video_file_size(file_path: str, max_size_mb: int = 100) -> None:
    """Validate video file size.

    Args:
        file_path: Path to video file
        max_size_mb: Maximum file size in MB

    Raises:
        ValueError: If file exceeds size limit
    """
    file_size = os.path.getsize(file_path)
    max_size_bytes = max_size_mb * 1024 * 1024

    if file_size > max_size_bytes:
        raise ValueError(
            f"Video file size ({file_size / 1024 / 1024:.2f} MB) exceeds maximum ({max_size_mb} MB)"
        )


def get_video_duration(file_path: str) -> float:
    """Get video duration using ffprobe.

    Args:
        file_path: Path to video file

    Returns:
        Duration in seconds

    Raises:
        ValueError: If ffprobe fails or duration cannot be determined
    """
    # Check if file exists
    if not os.path.exists(file_path):
        raise ValueError(f"Video file not found: {file_path}")

    # Check file size
    file_size = os.path.getsize(file_path)
    logger.info(f"Checking video duration for file: {file_path} ({file_size} bytes)")

    if file_size == 0:
        raise ValueError(f"Video file is empty (0 bytes): {file_path}")

    if file_size < 1024:  # Less than 1KB is suspicious
        raise ValueError(
            f"Video file is too small ({file_size} bytes). "
            f"Video may not have uploaded completely."
        )

    try:
        # First, try to get basic file info
        info_result = subprocess.run(
            [
                'ffprobe',
                '-v', 'quiet',
                '-print_format', 'json',
                '-show_format',
                '-show_streams',
                file_path
            ],
            capture_output=True,
            text=True,
            check=False
        )

        if info_result.returncode != 0:
            error_msg = info_result.stderr.strip() or "Cannot read video file"
            raise ValueError(
                f"ffprobe cannot read file: {error_msg}. "
                f"File may be corrupted or invalid format."
            )

        # Now try to get duration
        result = subprocess.run(
            [
                'ffprobe',
                '-v', 'error',
                '-show_entries', 'format=duration',
                '-of', 'default=noprint_wrappers=1:nokey=1',
                file_path
            ],
            capture_output=True,
            text=True,
            check=False
        )

        # Parse duration
        duration_str = result.stdout.strip()
        logger.info(f"ffprobe duration output: '{duration_str}'")

        if not duration_str or duration_str.lower() == 'n/a':
            # Try alternative method using stream duration
            stream_result = subprocess.run(
                [
                    'ffprobe',
                    '-v', 'error',
                    '-select_streams', 'v:0',
                    '-show_entries', 'stream=duration',
                    '-of', 'default=noprint_wrappers=1:nokey=1',
                    file_path
                ],
                capture_output=True,
                text=True,
                check=False
            )
            duration_str = stream_result.stdout.strip()
            logger.info(f"ffprobe stream duration output: '{duration_str}'")

        if not duration_str or duration_str.lower() == 'n/a':
            raise ValueError(
                f"Could not determine video duration. "
                f"Video may be corrupted, incomplete, or still encoding. "
                f"File size: {file_size} bytes. "
                f"Try re-recording or uploading again."
            )

        try:
            duration = float(duration_str)
        except ValueError:
            raise ValueError(
                f"Invalid duration value '{duration_str}' returned by ffprobe. "
                f"File: {file_path}"
            )

        logger.info(f"Video duration: {duration:.2f}s")
        return duration

    except FileNotFoundError:
        raise ValueError(
            "ffprobe not found. Please install ffmpeg: "
            "https://ffmpeg.org/download.html"
        )
    except subprocess.SubprocessError as e:
        raise ValueError(f"Failed to run ffprobe: {e}")


def validate_video_duration(
    file_path: str,
    min_duration: float = 25.0,
    max_duration: float = 35.0,
) -> None:
    """Validate video duration using ffprobe.

    Args:
        file_path: Path to video file
        min_duration: Minimum duration in seconds
        max_duration: Maximum duration in seconds

    Raises:
        ValueError: If duration is outside expected range

    Note:
        WebM files from MediaRecorder API don't have duration metadata.
        For WebM files, we skip this validation and rely on client-provided
        duration passed to analyze_video() instead.
    """
    # Check if this is a WebM file
    file_ext = os.path.splitext(file_path)[1].lower()
    if file_ext == '.webm':
        logger.info(
            "Skipping duration validation for WebM file. "
            "Client-provided duration will be validated in analysis."
        )
        return

    # For other formats, validate duration
    try:
        duration = get_video_duration(file_path)

        if duration < min_duration:
            raise ValueError(
                f"Video duration ({duration:.1f}s) is too short. Expected {min_duration}s minimum."
            )

        if duration > max_duration:
            raise ValueError(
                f"Video duration ({duration:.1f}s) is too long. Expected {max_duration}s maximum."
            )

        logger.info(f"Video duration validation passed: {duration:.2f}s")

    except ValueError as e:
        # If duration check fails for non-WebM, log warning but don't fail
        # (some formats might not have duration in container)
        logger.warning(f"Duration validation failed: {e}. Proceeding anyway...")


async def validate_video(file_path: str) -> Tuple[bool, str]:
    """Validate video file.

    Args:
        file_path: Path to video file

    Returns:
        Tuple of (is_valid, error_message)
    """
    try:
        validate_video_file_size(file_path)
        validate_video_duration(file_path)
        return True, ""
    except ValueError as e:
        return False, str(e)


def cleanup_temp_file(file_path: str) -> None:
    """Delete temporary file.

    Args:
        file_path: Path to file to delete
    """
    try:
        if os.path.exists(file_path):
            os.unlink(file_path)
    except Exception:
        pass  # Best effort cleanup
