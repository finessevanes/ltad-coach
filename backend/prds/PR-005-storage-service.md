---
id: BE-005
depends_on: [BE-002]
blocks: [BE-012, BE-019]
---

# BE-005: Firebase Storage Service Wrapper

## Scope

**In Scope:**
- Create Firebase Storage client wrapper
- Implement file upload with automatic path generation
- Generate signed URLs for file access
- Handle video and JSON file types

**Out of Scope:**
- File compression/optimization
- CDN configuration
- Storage rules (configured in Firebase Console)

## Technical Decisions

- **Storage Structure**:
  ```
  videos/{athleteId}/{assessmentId}/{timestamp}.mp4
  keypoints/{assessmentId}/raw_keypoints.json
  ```
- **URL Type**: Signed URLs with 7-day expiration (renewable)
- **Upload Method**: Direct bytes/blob upload
- **File Size Limit**: 100MB per file (enforced at API level)
- **Location**: `app/services/storage.py`

## Acceptance Criteria

- [ ] Storage client initialized from Firebase Admin SDK
- [ ] `upload_video()` method returns storage path
- [ ] `upload_json()` method for keypoints
- [ ] `get_signed_url()` method for file access
- [ ] `delete_file()` method for cleanup
- [ ] Automatic content-type detection
- [ ] Path generation ensures no collisions

## Files to Create/Modify

- `app/services/storage.py` (create)

## Implementation Notes

**app/services/storage.py**:
```python
from firebase_admin import storage
from app.core.firebase import get_firebase_app
from typing import Optional
from datetime import timedelta
import json
from uuid import uuid4

class StorageService:
    def __init__(self):
        get_firebase_app()
        self.bucket = storage.bucket()

    def upload_video(
        self,
        video_bytes: bytes,
        athlete_id: str,
        assessment_id: str,
        file_extension: str = "mp4"
    ) -> str:
        """
        Upload video file to Firebase Storage

        Returns: storage path (e.g., "videos/athlete123/assess456/video.mp4")
        """
        timestamp = uuid4().hex[:8]
        file_path = f"videos/{athlete_id}/{assessment_id}/{timestamp}.{file_extension}"

        blob = self.bucket.blob(file_path)
        blob.upload_from_string(
            video_bytes,
            content_type=self._get_video_content_type(file_extension)
        )

        return file_path

    def upload_json(self, data: dict, assessment_id: str, filename: str = "raw_keypoints.json") -> str:
        """
        Upload JSON data (e.g., MediaPipe keypoints)

        Returns: storage path
        """
        file_path = f"keypoints/{assessment_id}/{filename}"

        blob = self.bucket.blob(file_path)
        blob.upload_from_string(
            json.dumps(data),
            content_type="application/json"
        )

        return file_path

    def get_signed_url(self, file_path: str, expiration_days: int = 7) -> str:
        """
        Generate signed URL for file access

        Args:
            file_path: Storage path (e.g., "videos/...")
            expiration_days: URL validity period

        Returns: Signed URL string
        """
        blob = self.bucket.blob(file_path)
        url = blob.generate_signed_url(
            expiration=timedelta(days=expiration_days),
            version="v4"
        )
        return url

    def delete_file(self, file_path: str) -> bool:
        """Delete a file from storage"""
        blob = self.bucket.blob(file_path)
        blob.delete()
        return True

    def file_exists(self, file_path: str) -> bool:
        """Check if file exists"""
        blob = self.bucket.blob(file_path)
        return blob.exists()

    def _get_video_content_type(self, extension: str) -> str:
        """Map file extension to content type"""
        content_types = {
            "mp4": "video/mp4",
            "mov": "video/quicktime",
            "avi": "video/x-msvideo",
            "m4v": "video/x-m4v",
        }
        return content_types.get(extension.lower(), "video/mp4")

# Global instance
storage_service = StorageService()
```

## Testing

Add test endpoint:
```python
from app.services.storage import storage_service
import json

@app.post("/test-storage")
async def test_storage():
    # Test JSON upload
    test_data = {"landmarks": [{"x": 0.5, "y": 0.5}]}
    json_path = storage_service.upload_json(test_data, "test-assessment-123")

    # Test video upload (small dummy file)
    dummy_video = b"fake video content"
    video_path = storage_service.upload_video(
        dummy_video,
        "athlete-123",
        "assessment-456",
        "mp4"
    )

    # Generate signed URLs
    json_url = storage_service.get_signed_url(json_path)
    video_url = storage_service.get_signed_url(video_path)

    # Cleanup
    storage_service.delete_file(json_path)
    storage_service.delete_file(video_path)

    return {
        "json_path": json_path,
        "video_path": video_path,
        "urls_generated": True
    }
```

## Estimated Complexity

**Size**: M (Medium - ~2 hours)

## Notes

- Firebase Storage requires bucket to be created in Firebase Console first
- Default bucket is `{project-id}.appspot.com`
- Storage rules should allow authenticated writes, public reads with tokens
- Signed URLs work even with strict security rules
- For MVP, indefinite storage is acceptable (no auto-deletion)
