"""Parent report API endpoints.

This module handles parent report generation, PIN-protected viewing,
and email sending for progress reports.
"""

import logging
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status

from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.report import (
    ReportPreview,
    ReportSendRequest,
    ReportSendResponse,
    ReportVerifyRequest,
    ReportViewResponse,
    ReportListItem,
    ReportResendResponse,
)
from app.repositories.athlete import AthleteRepository
from app.repositories.report import ReportRepository, pin_limiter
from app.services.reports import generate_report_content, generate_pin
from app.services.email import send_report_email

router = APIRouter(prefix="/reports", tags=["reports"])
logger = logging.getLogger(__name__)


@router.post("/generate/{athlete_id}", response_model=ReportPreview)
async def generate_report(
    athlete_id: str,
    user: User = Depends(get_current_user)
):
    """Generate parent report preview (not stored until sent).

    This endpoint generates a preview of the AI-powered parent report
    WITHOUT storing it in Firestore. The content stays in the frontend
    until the coach clicks Send, avoiding the need for complex Firestore
    queries and indexes.

    Regenerating the preview is fine - coaches likely want fresh content
    anyway if they navigate away and come back.

    Args:
        athlete_id: Athlete ID
        user: Current authenticated user (coach)

    Returns:
        ReportPreview with content and metadata (report_id=None)

    Raises:
        404: Athlete not found or coach doesn't own athlete
        400: No assessments found or other validation error
    """
    athlete_repo = AthleteRepository()

    # Validate ownership
    athlete = await athlete_repo.get_if_owned(athlete_id, user.id)
    if not athlete:
        logger.warning(f"Athlete {athlete_id} not found or not owned by {user.id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete not found"
        )

    # Generate content (don't store)
    try:
        content, metadata = await generate_report_content(user.id, athlete_id)
    except ValueError as e:
        logger.error(f"Failed to generate report for {athlete_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    logger.info(f"Generated report preview for {athlete.name} (ID: {athlete_id})")

    return ReportPreview(
        report_id=None,  # Not stored yet
        athlete_id=athlete_id,
        athlete_name=athlete.name,
        content=content,
        assessment_count=metadata["assessment_count"],
        latest_score=metadata["latest_score"],
        assessment_ids=metadata["assessment_ids"],
    )


@router.post("/{athlete_id}/send", response_model=ReportSendResponse)
async def send_report(
    athlete_id: str,
    data: ReportSendRequest,
    user: User = Depends(get_current_user)
):
    """Store report and send to parent.

    This endpoint:
    1. Receives report content from frontend (from preview)
    2. Generates PIN
    3. Stores report in Firestore with sent_at timestamp
    4. Sends email to parent with PIN
    5. Returns the PIN to the coach (shown only once)

    The report content comes from the frontend to guarantee WYSIWYG
    (what coach saw in preview IS what parent gets). No regeneration.

    Args:
        athlete_id: Athlete ID
        data: Report content and metadata from frontend
        user: Current authenticated user (coach)

    Returns:
        ReportSendResponse with report ID and PIN

    Raises:
        404: Athlete not found or coach doesn't own athlete
    """
    from datetime import datetime, timezone

    athlete_repo = AthleteRepository()
    report_repo = ReportRepository()

    # Validate ownership
    athlete = await athlete_repo.get_if_owned(athlete_id, user.id)
    if not athlete:
        logger.warning(f"Athlete {athlete_id} not found or not owned by {user.id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete not found"
        )

    # Generate PIN
    pin = generate_pin()

    # Store report (sent immediately)
    report = await report_repo.create_report(
        coach_id=user.id,
        athlete_id=athlete_id,
        content=data.content,
        assessment_ids=data.assessment_ids,
        pin=pin,
        sent_at=datetime.now(timezone.utc),  # Mark as sent immediately
    )

    logger.info(f"Created report {report.id} for {athlete.name} (ID: {athlete_id})")

    # Send email to parent
    email_sent = await send_report_email(
        parent_email=athlete.parent_email,
        athlete_name=athlete.name,
        coach_name=user.name,
        report_id=report.id,
        pin=pin,
    )

    if not email_sent:
        logger.warning(f"Failed to send report {report.id} email to {athlete.parent_email}")

    logger.info(f"Report {report.id} email sent to {athlete.parent_email}")

    return ReportSendResponse(
        id=report.id,
        pin=pin,  # Show to coach once
        message="Report sent to parent" if email_sent else "Report created but email failed",
    )


@router.get("/view/{report_id}")
async def get_report_info(report_id: str):
    """Get basic report info without requiring PIN (public endpoint).

    This endpoint provides minimal information about the report
    before PIN verification. Parents can see the athlete name and
    creation date to verify they have the right link.

    Args:
        report_id: Report ID

    Returns:
        Dict with basic report info (no content)

    Raises:
        404: Report not found
    """
    report_repo = ReportRepository()
    athlete_repo = AthleteRepository()

    report = await report_repo.get(report_id)
    if not report:
        logger.warning(f"Report {report_id} not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )

    athlete = await athlete_repo.get(report.athlete_id)

    return {
        "report_id": report_id,
        "athlete_name": athlete.name if athlete else "Unknown",
        "created_at": report.created_at.isoformat(),
        "requires_pin": True,
    }


@router.post("/view/{report_id}/verify", response_model=ReportViewResponse)
async def verify_and_view_report(
    report_id: str,
    data: ReportVerifyRequest
):
    """Verify PIN and return report content (public endpoint).

    This endpoint verifies the PIN and returns the full report content
    if verification succeeds. It includes rate limiting and lockout
    protection to prevent brute force attacks.

    Rate Limits:
    - 5 attempts per minute per report
    - 10 total failed attempts locks out the report

    Args:
        report_id: Report ID
        data: Request with PIN

    Returns:
        ReportViewResponse with athlete name and report content

    Raises:
        403: Report locked due to too many failed attempts
        429: Rate limited (too many attempts in the last minute)
        410: Report has expired (90 days)
        401: Invalid PIN
        404: Report not found
    """
    # Check lockout first
    if pin_limiter.is_locked_out(report_id):
        logger.warning(f"Report {report_id} is locked out due to failed attempts")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This report has been locked due to too many failed attempts. Contact the coach."
        )

    # Check rate limit
    if not pin_limiter.check_rate_limit(report_id):
        logger.warning(f"Report {report_id} is rate limited")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many attempts. Please wait a minute before trying again."
        )

    report_repo = ReportRepository()
    athlete_repo = AthleteRepository()

    report = await report_repo.get(report_id)
    if not report:
        logger.warning(f"Report {report_id} not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )

    # Check report expiration (90-day limit)
    # Use timezone-aware datetime for comparison
    from datetime import timezone
    now = datetime.now(timezone.utc)
    if report.expires_at < now:
        logger.warning(f"Report {report_id} has expired")
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This report has expired. Please contact the coach for a new report."
        )

    # Verify PIN
    if not report_repo.verify_pin(data.pin, report.access_pin_hash):
        pin_limiter.record_attempt(report_id, success=False)
        logger.warning(f"Invalid PIN attempt for report {report_id}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid PIN"
        )

    # Success - reset failure count
    pin_limiter.record_attempt(report_id, success=True)
    pin_limiter.reset_on_success(report_id)

    athlete = await athlete_repo.get(report.athlete_id)

    logger.info(f"Report {report_id} accessed successfully")

    return ReportViewResponse(
        athlete_name=athlete.name if athlete else "Unknown",
        report_content=report.report_content,
        created_at=report.created_at,
    )


@router.get("/athlete/{athlete_id}", response_model=List[ReportListItem])
async def get_reports_by_athlete(
    athlete_id: str,
    user: User = Depends(get_current_user)
):
    """Get list of reports for an athlete (for report history).

    This endpoint is used by the athlete profile page (FE-012) to show
    report history. Coach must own the athlete to view their reports.

    Args:
        athlete_id: Athlete ID
        user: Current authenticated user (coach)

    Returns:
        List of ReportListItem with basic report info

    Raises:
        404: Athlete not found or coach doesn't own athlete
    """
    athlete_repo = AthleteRepository()
    report_repo = ReportRepository()

    # Validate ownership
    athlete = await athlete_repo.get_if_owned(athlete_id, user.id)
    if not athlete:
        logger.warning(f"Athlete {athlete_id} not found or not owned by {user.id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete not found"
        )

    reports = await report_repo.get_by_athlete(athlete_id)

    logger.info(f"Retrieved {len(reports)} reports for athlete {athlete_id}")

    return [
        ReportListItem(
            id=r.id,
            athlete_id=r.athlete_id,
            created_at=r.created_at,
            sent_at=r.sent_at,
        )
        for r in reports
    ]


@router.post("/{report_id}/resend", response_model=ReportResendResponse)
async def resend_report(
    report_id: str,
    user: User = Depends(get_current_user)
):
    """Resend report with new PIN.

    This endpoint:
    1. Validates coach ownership of the report's athlete
    2. Generates a new PIN (invalidates the old one)
    3. Updates the report with the new PIN hash
    4. Resets the rate limiter for the report

    Note: Email sending will be added in BE-014.
    For now, this just updates the PIN and returns it.

    Used when:
    - Parent lost the original PIN
    - PIN was locked out due to failed attempts
    - Report needs to be shared again

    Args:
        report_id: Report ID
        user: Current authenticated user (coach)

    Returns:
        ReportResendResponse with new PIN

    Raises:
        404: Report not found
        403: Coach doesn't own the athlete
    """
    report_repo = ReportRepository()
    athlete_repo = AthleteRepository()

    report = await report_repo.get(report_id)
    if not report:
        logger.warning(f"Report {report_id} not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )

    # Verify coach owns the athlete
    athlete = await athlete_repo.get_if_owned(report.athlete_id, user.id)
    if not athlete:
        logger.warning(f"User {user.id} not authorized to resend report {report_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to resend this report"
        )

    # Generate new PIN
    new_pin = generate_pin()
    new_pin_hash = report_repo.hash_pin(new_pin)

    # Update report with new PIN hash
    await report_repo.update(report_id, {
        "access_pin_hash": new_pin_hash,
    })

    # Reset rate limiter for this report
    pin_limiter.failed_counts[report_id] = 0

    # Send email with new PIN
    email_sent = await send_report_email(
        parent_email=athlete.parent_email,
        athlete_name=athlete.name,
        coach_name=user.name,
        report_id=report_id,
        pin=new_pin,
    )

    if email_sent:
        await report_repo.mark_sent(report_id)
        logger.info(f"Report {report_id} resent with new PIN to {athlete.parent_email}")
    else:
        logger.warning(f"Failed to resend report {report_id} email to {athlete.parent_email}")

    return ReportResendResponse(
        pin=new_pin,
        message="Report resent" if email_sent else "Email failed",
    )
