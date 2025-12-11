from app.services.database import db, Collections
from app.models.video import VideoMetadata, VideoStatus
from typing import Optional, List
from datetime import datetime


class VideoMetadataService:
    def __init__(self):
        self.collection = Collections.VIDEO_UPLOADS

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
