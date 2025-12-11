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
