from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.core.auth import get_current_user
from app.services.storage import storage_service
from app.services.video_metadata import video_metadata_service
from typing import Optional
import uuid

router = APIRouter(prefix="/api/assessments", tags=["Assessments"])

ALLOWED_EXTENSIONS = {"mp4", "mov", "avi", "m4v", "hevc"}
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB


def validate_video_file(file: UploadFile) -> str:
    """Validate video file and return extension"""
    # Check extension
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    extension = file.filename.split(".")[-1].lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    return extension


@router.post("/upload-video")
async def upload_video(
    file: UploadFile = File(...),
    athlete_id: str = Form(...),
    user: dict = Depends(get_current_user)
):
    """
    Upload video file for assessment

    Returns storage path for subsequent processing
    """
    # Validate file
    extension = validate_video_file(file)

    # Read file content
    content = await file.read()

    # Check file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size: {MAX_FILE_SIZE / 1024 / 1024}MB"
        )

    # Generate assessment ID (temporary, will be replaced when assessment created)
    temp_assessment_id = str(uuid.uuid4())

    # Upload to storage
    try:
        storage_path = storage_service.upload_video(
            video_bytes=content,
            athlete_id=athlete_id,
            assessment_id=temp_assessment_id,
            file_extension=extension
        )

        # Store video metadata in Firestore
        video_metadata_service.create_metadata(
            upload_id=temp_assessment_id,
            athlete_id=athlete_id,
            coach_id=user["uid"],  # From auth token
            storage_path=storage_path,
            size=len(content),
            format=extension
        )

        return {
            "uploadId": temp_assessment_id,
            "storagePath": storage_path,
            "size": len(content),
            "format": extension,
            "status": "uploaded"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {str(e)}"
        )


@router.get("/videos/{upload_id}")
async def get_video_metadata(
    upload_id: str,
    user: dict = Depends(get_current_user)
):
    """Get video metadata by uploadId"""
    metadata = video_metadata_service.get_metadata(upload_id)

    if not metadata:
        raise HTTPException(status_code=404, detail="Video not found")

    return metadata


@router.get("/videos/athlete/{athlete_id}")
async def get_athlete_videos(
    athlete_id: str,
    user: dict = Depends(get_current_user)
):
    """Get all videos for an athlete"""
    videos = video_metadata_service.get_videos_by_athlete(athlete_id)
    return {"videos": videos, "count": len(videos)}
