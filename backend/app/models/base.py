from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class FirestoreDocument(BaseModel):
    """Base model for Firestore documents"""
    id: Optional[str] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True
