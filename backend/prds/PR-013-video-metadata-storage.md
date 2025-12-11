COMPLETED

---
id: BE-013
depends_on: [BE-004, BE-012]
blocks: [BE-014, BE-029]
status: COMPLETED
---

# BE-013: Video Metadata Storage

## Scope

**In Scope:**
- Store video metadata in Firestore after upload
- Track upload status and timestamps
- Associate video with athlete and coach
- Retrieve video metadata by ID
- Update video processing status

**Out of Scope:**
- Video processing/analysis (BE-014)
- Assessment creation (BE-029)
- Video file storage (handled in BE-012)

## Technical Decisions

- **Collection**: `video_uploads` in Firestore
- **ID Strategy**: Use uploadId from BE-012 as document ID
- **Status Values**: `uploaded`, `processing`, `completed`, `failed`
- **Metadata Fields**:
  - Storage path, athlete ID, coach ID
  - File size, format, duration
  - Upload timestamp, processing timestamps
  - Processing status and error messages (if any)
- **Service Location**: `app/services/video_metadata.py`

## Acceptance Criteria

- [ ] Store video metadata immediately after upload
- [ ] Retrieve video metadata by uploadId
- [ ] Update processing status (uploaded → processing → completed/failed)
- [ ] Query videos by athlete ID
- [ ] Query videos by coach ID
- [ ] Include timestamps for audit trail
- [ ] Handle missing/invalid upload IDs gracefully

## Files to Create/Modify

- `app/services/video_metadata.py` (create)
- `app/models/video.py` (create)
- `app/api/assessments.py` (modify - save metadata after upload)

## Implementation Notes

**app/models/video.py**:
```python
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class VideoStatus(str, Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class VideoMetadata(BaseModel):
    id: Optional[str] = None
    uploadId: str
    athleteId: str
    coachId: str
    storagePath: str
    size: int  # bytes
    format: str  # mp4, mov, etc.
    duration: Optional[float] = None  # seconds, populated after processing
    status: VideoStatus = VideoStatus.UPLOADED
    errorMessage: Optional[str] = None
    uploadedAt: Optional[datetime] = None
    processingStartedAt: Optional[datetime] = None
    processingCompletedAt: Optional[datetime] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True
```

**app/services/video_metadata.py**:
```python
from app.services.database import db, Collections
from app.models.video import VideoMetadata, VideoStatus
from typing import Optional, List
from datetime import datetime

# Add to Collections class in database.py
# VIDEO_UPLOADS = "video_uploads"

class VideoMetadataService:
    def __init__(self):
        self.collection = "video_uploads"

    def create_metadata(
        self,
        upload_id: str,
        athlete_id: str,
        coach_id: str,
        storage_path: str,
        size: int,
        format: str
    ) -> str:
        """
        Store video metadata after upload

        Returns: document ID (same as upload_id)
        """
        metadata = {
            "uploadId": upload_id,
            "athleteId": athlete_id,
            "coachId": coach_id,
            "storagePath": storage_path,
            "size": size,
            "format": format,
            "status": VideoStatus.UPLOADED.value,
            "uploadedAt": datetime.utcnow(),
        }

        doc_id = db.create(self.collection, metadata, doc_id=upload_id)
        return doc_id

    def get_metadata(self, upload_id: str) -> Optional[VideoMetadata]:
        """Get video metadata by uploadId"""
        data = db.get(self.collection, upload_id)

        if not data:
            return None

        return VideoMetadata(**data)

    def update_status(
        self,
        upload_id: str,
        status: VideoStatus,
        error_message: Optional[str] = None,
        duration: Optional[float] = None
    ) -> bool:
        """
        Update video processing status

        Args:
            upload_id: Video upload ID
            status: New status
            error_message: Error message if status is FAILED
            duration: Video duration in seconds (set when processing completes)
        """
        update_data = {"status": status.value}

        if status == VideoStatus.PROCESSING:
            update_data["processingStartedAt"] = datetime.utcnow()
        elif status in [VideoStatus.COMPLETED, VideoStatus.FAILED]:
            update_data["processingCompletedAt"] = datetime.utcnow()

        if error_message:
            update_data["errorMessage"] = error_message

        if duration:
            update_data["duration"] = duration

        return db.update(self.collection, upload_id, update_data)

    def get_videos_by_athlete(self, athlete_id: str, limit: int = 50) -> List[VideoMetadata]:
        """Get all videos for an athlete"""
        results = db.query(
            self.collection,
            filters=[("athleteId", "==", athlete_id)],
            order_by="uploadedAt",
            limit=limit
        )

        return [VideoMetadata(**data) for data in results]

    def get_videos_by_coach(self, coach_id: str, limit: int = 100) -> List[VideoMetadata]:
        """Get all videos uploaded by a coach"""
        results = db.query(
            self.collection,
            filters=[("coachId", "==", coach_id)],
            order_by="uploadedAt",
            limit=limit
        )

        return [VideoMetadata(**data) for data in results]

# Global instance
video_metadata_service = VideoMetadataService()
```

**app/api/assessments.py** (modify `upload_video` endpoint):
```python
from app.services.video_metadata import video_metadata_service

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
    # ... existing validation and upload logic ...

    try:
        storage_path = storage_service.upload_video(
            video_bytes=content,
            athlete_id=athlete_id,
            assessment_id=temp_assessment_id,
            file_extension=extension
        )

        # NEW: Store video metadata in Firestore
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
            "status": "uploaded"  # NEW
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {str(e)}"
        )
```

**Update app/services/database.py Collections class**:
```python
class Collections:
    USERS = "users"
    ATHLETES = "athletes"
    ASSESSMENTS = "assessments"
    PARENT_REPORTS = "parent_reports"
    BENCHMARKS = "benchmarks"
    VIDEO_UPLOADS = "video_uploads"  # NEW
```

## Testing

```bash
# 1. Upload a video (should now also create metadata)
curl -X POST http://localhost:8000/api/assessments/upload-video \
  -H "Authorization: Bearer <token>" \
  -F "file=@test-video.mp4" \
  -F "athlete_id=athlete-123"

# Response should include "status": "uploaded"

# 2. Verify metadata was stored (add test endpoint)
curl http://localhost:8000/api/videos/<uploadId> \
  -H "Authorization: Bearer <token>"

# 3. Query videos by athlete
curl http://localhost:8000/api/videos/athlete/<athleteId> \
  -H "Authorization: Bearer <token>"
```

**Optional Test Endpoints** (add to assessments.py):
```python
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
```

## Estimated Complexity

**Size**: S (Small - ~1.5 hours)

## Notes

- Video metadata is separate from assessment records
- One video upload can be used for multiple assessments (future enhancement)
- Status tracking enables progress indicators in UI
- Duration is populated after MediaPipe processing (BE-014)
- Error tracking helps with debugging failed video processing
- CoachId enables filtering videos by coach for admin/reporting
