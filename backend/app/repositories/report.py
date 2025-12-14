"""Report repository for parent reports with PIN protection."""

import hashlib
from datetime import datetime, timedelta
from typing import Optional, List
from collections import defaultdict

from app.repositories.base import BaseRepository
from app.models.report import Report


class PINVerificationLimiter:
    """Track PIN verification attempts per report to prevent brute force attacks."""

    def __init__(self):
        self.attempts = defaultdict(list)  # report_id -> [timestamp, ...]
        self.failed_counts = defaultdict(int)  # report_id -> total failures

    def check_rate_limit(self, report_id: str) -> bool:
        """Check if rate limited (5 attempts per minute).

        Args:
            report_id: Report ID to check

        Returns:
            bool: True if under rate limit, False if rate limited
        """
        now = datetime.utcnow()
        cutoff = now - timedelta(minutes=1)

        # Remove old attempts
        self.attempts[report_id] = [
            ts for ts in self.attempts[report_id] if ts > cutoff
        ]

        return len(self.attempts[report_id]) < 5

    def is_locked_out(self, report_id: str) -> bool:
        """Check if locked out (10+ total failures).

        Args:
            report_id: Report ID to check

        Returns:
            bool: True if locked out, False otherwise
        """
        return self.failed_counts[report_id] >= 10

    def record_attempt(self, report_id: str, success: bool):
        """Record a verification attempt.

        Args:
            report_id: Report ID
            success: Whether the attempt succeeded
        """
        self.attempts[report_id].append(datetime.utcnow())
        if not success:
            self.failed_counts[report_id] += 1

    def reset_on_success(self, report_id: str):
        """Reset failure count on successful verification.

        Args:
            report_id: Report ID
        """
        self.failed_counts[report_id] = 0


# Singleton instance
pin_limiter = PINVerificationLimiter()


class ReportRepository(BaseRepository[Report]):
    """Repository for parent reports."""

    def __init__(self):
        super().__init__("parent_reports", Report)

    @staticmethod
    def hash_pin(pin: str) -> str:
        """Hash PIN for secure storage.

        Args:
            pin: Plain text PIN

        Returns:
            str: SHA-256 hash of the PIN
        """
        return hashlib.sha256(pin.encode()).hexdigest()

    @staticmethod
    def verify_pin(pin: str, hash: str) -> bool:
        """Verify PIN against stored hash.

        Args:
            pin: Plain text PIN to verify
            hash: Stored hash to compare against

        Returns:
            bool: True if PIN matches hash
        """
        return hashlib.sha256(pin.encode()).hexdigest() == hash

    async def create_report(
        self,
        coach_id: str,
        athlete_id: str,
        content: str,
        assessment_ids: List[str],
        pin: str
    ) -> Report:
        """Create new report with hashed PIN and 90-day expiry.

        Args:
            coach_id: Coach who created the report
            athlete_id: Athlete the report is about
            content: Report content (AI-generated)
            assessment_ids: List of assessment IDs included
            pin: Plain text PIN (will be hashed)

        Returns:
            Report: Created report instance
        """
        report_data = {
            "athlete_id": athlete_id,
            "coach_id": coach_id,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(days=90),  # 90-day expiry
            "access_pin_hash": self.hash_pin(pin),
            "report_content": content,
            "assessment_ids": assessment_ids,
            "sent_at": None,
        }

        doc_ref = self.collection.document()
        doc_ref.set(report_data)

        return Report(id=doc_ref.id, **report_data)

    async def get_by_athlete(
        self,
        athlete_id: str,
        limit: int = 10
    ) -> List[Report]:
        """Get reports for an athlete, ordered by creation date.

        Args:
            athlete_id: Athlete ID
            limit: Maximum number of reports to return

        Returns:
            List[Report]: List of reports
        """
        docs = (
            self.collection
            .where("athlete_id", "==", athlete_id)
            .order_by("created_at", direction="DESCENDING")
            .limit(limit)
            .stream()
        )

        results = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            results.append(Report(**data))

        return results

    async def mark_sent(self, report_id: str):
        """Mark report as sent with timestamp.

        Args:
            report_id: Report ID
        """
        await self.update(report_id, {"sent_at": datetime.utcnow()})
