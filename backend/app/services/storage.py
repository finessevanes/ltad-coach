from firebase_admin import storage
import json
from typing import Any, Dict, Optional
from datetime import timedelta


class StorageService:
    """Firebase Storage service"""

    def __init__(self):
        self.bucket = storage.bucket()

    def upload_video(
        self,
        video_bytes: bytes,
        athlete_id: str,
        assessment_id: str,
        file_extension: str
    ) -> str:
        """
        Upload video to Firebase Storage

        Args:
            video_bytes: Video file bytes
            athlete_id: Athlete ID
            assessment_id: Assessment ID
            file_extension: File extension (mp4, mov, etc.)

        Returns:
            Storage path
        """
        blob_path = f"videos/{athlete_id}/{assessment_id}/video.{file_extension}"
        blob = self.bucket.blob(blob_path)

        # Set content type based on extension
        content_type_map = {
            "mp4": "video/mp4",
            "mov": "video/quicktime",
            "avi": "video/x-msvideo",
            "m4v": "video/x-m4v",
            "hevc": "video/hevc"
        }
        content_type = content_type_map.get(file_extension.lower(), "video/mp4")

        blob.upload_from_string(video_bytes, content_type=content_type)

        return blob_path

    def upload_json(
        self,
        data: Dict[str, Any],
        assessment_id: str,
        filename: str = "raw_keypoints.json"
    ) -> str:
        """
        Upload JSON data to Firebase Storage

        Args:
            data: JSON-serializable data
            assessment_id: Assessment ID
            filename: Filename

        Returns:
            Storage path
        """
        blob_path = f"keypoints/{assessment_id}/{filename}"
        blob = self.bucket.blob(blob_path)

        json_string = json.dumps(data, indent=2)
        blob.upload_from_string(json_string, content_type="application/json")

        return blob_path

    def download_file(self, storage_path: str) -> bytes:
        """
        Download file from Firebase Storage

        Args:
            storage_path: Storage path

        Returns:
            File bytes
        """
        blob = self.bucket.blob(storage_path)
        return blob.download_as_bytes()

    def download_to_file(self, storage_path: str, local_path: str) -> None:
        """
        Download file to local filesystem

        Args:
            storage_path: Storage path
            local_path: Local file path
        """
        blob = self.bucket.blob(storage_path)
        blob.download_to_filename(local_path)

    def get_signed_url(self, storage_path: str, expiration_minutes: int = 60) -> str:
        """
        Generate signed URL for file access

        Args:
            storage_path: Storage path
            expiration_minutes: URL expiration time in minutes

        Returns:
            Signed URL
        """
        blob = self.bucket.blob(storage_path)
        url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(minutes=expiration_minutes),
            method="GET"
        )
        return url

    def file_exists(self, storage_path: str) -> bool:
        """
        Check if file exists

        Args:
            storage_path: Storage path

        Returns:
            True if file exists
        """
        blob = self.bucket.blob(storage_path)
        return blob.exists()

    def delete_file(self, storage_path: str) -> bool:
        """
        Delete file from storage

        Args:
            storage_path: Storage path

        Returns:
            True if successful
        """
        blob = self.bucket.blob(storage_path)
        blob.delete()
        return True


# Global instance
storage_service = StorageService()
