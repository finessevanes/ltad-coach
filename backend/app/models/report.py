from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class ReportGenerate(BaseModel):
    """Request to generate report preview"""
    pass  # No body needed, athlete ID from URL


class ReportPreview(BaseModel):
    """Preview response before sending (not stored until sent)"""
    report_id: Optional[str] = None  # None until sent
    athlete_id: str
    athlete_name: str
    content: str
    assessment_count: int
    latest_score: Optional[int] = None
    assessment_ids: List[str]  # Needed for send request


class ReportCreate(BaseModel):
    """Store report for sending"""
    athlete_id: str
    content: str
    assessment_ids: List[str]


class Report(BaseModel):
    id: str
    athlete_id: str
    coach_id: str
    created_at: datetime
    expires_at: datetime  # 90-day expiry
    access_pin_hash: str  # Hashed PIN
    report_content: str
    assessment_ids: List[str]
    sent_at: Optional[datetime] = None


class ReportSendRequest(BaseModel):
    """Request to send report to parent (includes content from preview)"""
    content: str
    assessment_ids: List[str]
    assessment_count: int
    latest_score: Optional[int] = None


class ReportSendResponse(BaseModel):
    id: str
    pin: str  # Shown only once
    message: str


class ReportVerifyRequest(BaseModel):
    pin: str


class ReportViewResponse(BaseModel):
    athlete_name: str
    report_content: str
    created_at: datetime


class ReportListItem(BaseModel):
    """Item for report history list (FE-012)"""
    id: str
    athlete_id: str
    created_at: datetime
    sent_at: Optional[datetime] = None


class ReportResendResponse(BaseModel):
    """Response from resending a report"""
    pin: str
    message: str
