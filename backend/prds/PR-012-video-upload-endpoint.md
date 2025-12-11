COMPLETED

---
id: BE-012
depends_on: [BE-005, BE-006]
blocks: [BE-013, BE-014, BE-029]
status: COMPLETED
---

# BE-012: Video Upload Endpoint

## Scope

**In Scope:**
- POST `/api/assessments/upload-video` - Accept multipart video upload
- File validation (size, format)
- Upload to Firebase Storage
- Return storage path for processing

**Out of Scope:**
- Video processing/analysis (BE-014)
- Assessment record creation (BE-029)

## Technical Decisions

- **Upload Method**: Multipart form data
- **Max File Size**: 100MB
- **Allowed Formats**: .mp4, .mov, .avi, .m4v, HEVC
- **Storage**: Firebase Storage (using BE-005 service)
- **Response**: Return storage path + upload ID

## Acceptance Criteria

- [ ] Accepts multipart file upload
- [ ] Validates file size (<100MB)
- [ ] Validates file extension
- [ ] Uploads to Firebase Storage
- [ ] Returns storage path
- [ ] Proper error handling for invalid files

## Files to Create/Modify

- `app/api/assessments.py` (create)
- `app/main.py` (modify - include router)
- `requirements.txt` (modify - add python-multipart)

## Implementation Notes

**requirements.txt** (add):
```
python-multipart==0.0.6
```

**app/api/assessments.py**:
```python
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.core.auth import get_current_user
from app.services.storage import storage_service
from typing import Optional

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
    import uuid
    temp_assessment_id = str(uuid.uuid4())

    # Upload to storage
    try:
        storage_path = storage_service.upload_video(
            video_bytes=content,
            athlete_id=athlete_id,
            assessment_id=temp_assessment_id,
            file_extension=extension
        )

        return {
            "uploadId": temp_assessment_id,
            "storagePath": storage_path,
            "size": len(content),
            "format": extension
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {str(e)}"
        )
```

**app/main.py** (add):
```python
from app.api import assessments

app.include_router(assessments.router)
```

## Testing

```bash
# Test video upload
curl -X POST http://localhost:8000/api/assessments/upload-video \
  -H "Authorization: Bearer <token>" \
  -F "file=@test-video.mp4" \
  -F "athlete_id=athlete-123"
```

## Estimated Complexity

**Size**: M (Medium - ~2 hours)
