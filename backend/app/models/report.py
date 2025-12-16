from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class ReportGraphDataPoint(BaseModel):
    """Data point for the progress chart"""
    date: str  # "Dec 15"
    duration: float  # hold time in seconds


class ProgressSnapshot(BaseModel):
    """First vs current comparison for progress visualization"""
    started_date: str
    started_duration: float
    started_score: int
    current_date: str
    current_duration: float
    current_score: int


class MilestoneInfo(BaseModel):
    """Achievement milestone (if any)"""
    type: str  # "twenty_seconds" | "improvement"
    message: str  # Human-readable milestone message


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
    # New fields for enhanced parent reports
    graph_data: List[ReportGraphDataPoint] = []
    progress_snapshot: Optional[ProgressSnapshot] = None
    milestones: List[MilestoneInfo] = []


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
    # New fields for enhanced parent reports
    graph_data: List[ReportGraphDataPoint] = []
    progress_snapshot: Optional[ProgressSnapshot] = None
    milestones: List[MilestoneInfo] = []


class ReportSendRequest(BaseModel):
    """Request to send report to parent (includes content from preview)"""
    content: str
    assessment_ids: List[str]
    assessment_count: int
    latest_score: Optional[int] = None
    # New fields for enhanced parent reports
    graph_data: List[ReportGraphDataPoint] = []
    progress_snapshot: Optional[ProgressSnapshot] = None
    milestones: List[MilestoneInfo] = []


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
    # New fields for enhanced parent reports
    graph_data: List[ReportGraphDataPoint] = []
    progress_snapshot: Optional[ProgressSnapshot] = None
    milestones: List[MilestoneInfo] = []


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
