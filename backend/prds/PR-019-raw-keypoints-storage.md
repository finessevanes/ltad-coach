COMPLETED

---
id: BE-019
depends_on: [BE-014, BE-005]
blocks: []
status: COMPLETED
---

# BE-019: Raw Keypoints Storage

## Scope

**In Scope:**
- Save raw landmark data to Firebase Storage
- Generate storage path for keypoints JSON
- Link keypoints to assessment record

**Out of Scope:**
- Keypoint extraction (BE-014)
- Assessment record creation (BE-029)

## Technical Decisions

- **Storage Path**: `keypoints/{assessmentId}/raw_keypoints.json`
- **Data Format**: JSON with all frame data from MediaPipe
- **Purpose**: Context offloading (reduce tokens sent to LLM)
- **Access**: Store path in assessment document, retrieve if needed

## Acceptance Criteria

- [ ] Save full landmark data to Storage
- [ ] Return storage path
- [ ] File accessible via signed URL
- [ ] Handles large files (>1MB) efficiently

## Files to Create/Modify

- `app/services/mediapipe_service.py` (modify - add save method)

## Implementation Notes

**app/services/mediapipe_service.py** (add method):
```python
from app.services.storage import storage_service

class MediaPipeService:
    # ... existing code ...

    def save_raw_keypoints(self, frames_data: List[Dict], assessment_id: str) -> str:
        """
        Save raw landmark data to Firebase Storage

        Args:
            frames_data: Full landmark data from extract_landmarks_from_video
            assessment_id: Assessment ID for path generation

        Returns:
            Storage path
        """
        # Prepare data for storage
        keypoints_data = {
            "assessmentId": assessment_id,
            "totalFrames": len(frames_data),
            "frames": frames_data
        }

        # Upload to storage
        storage_path = storage_service.upload_json(
            data=keypoints_data,
            assessment_id=assessment_id,
            filename="raw_keypoints.json"
        )

        return storage_path
```

## Testing

Test with MediaPipe output:
```python
# After landmark extraction
storage_path = mediapipe_service.save_raw_keypoints(frames_data, "test-assessment-123")

# Verify file exists
exists = storage_service.file_exists(storage_path)
assert exists == True

# Get signed URL and verify content
url = storage_service.get_signed_url(storage_path)
# Download and verify JSON structure
```

## Estimated Complexity

**Size**: S (Small - ~0.5 hours)
