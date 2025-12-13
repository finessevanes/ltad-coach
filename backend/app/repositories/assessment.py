"""Assessment repository for database operations."""

from typing import Optional, List, Dict
from datetime import datetime
from app.repositories.base import BaseRepository
from app.models.assessment import Assessment, AssessmentStatus, MetricsData, ClientMetricsData


class AssessmentRepository(BaseRepository[Assessment]):
    """Repository for assessment CRUD operations."""

    def __init__(self):
        """Initialize repository."""
        super().__init__("assessments", Assessment)

    async def create_for_analysis(
        self,
        coach_id: str,
        athlete_id: str,
        test_type: str,
        leg_tested: str,
        video_url: str,
        video_path: str,
        client_metrics: Optional[Dict] = None,
    ) -> Assessment:
        """Create assessment in processing state (legacy method).

        Args:
            coach_id: Coach user ID
            athlete_id: Athlete ID
            test_type: Type of test
            leg_tested: Which leg was tested
            video_url: Firebase Storage download URL
            video_path: Firebase Storage path
            client_metrics: Optional client-side metrics for comparison

        Returns:
            Created assessment
        """
        data = {
            "coach_id": coach_id,
            "athlete_id": athlete_id,
            "test_type": test_type,
            "leg_tested": leg_tested,
            "video_url": video_url,
            "video_path": video_path,
            "status": AssessmentStatus.PROCESSING.value,
            "created_at": datetime.utcnow(),
            "raw_keypoints_url": None,
            "metrics": None,
            "client_metrics": client_metrics,
            "ai_feedback": None,
            "failure_reason": None,
            "error_message": None,
        }

        assessment_id = await self.create(data)
        assessment = await self.get(assessment_id)
        return assessment

    async def create_completed(
        self,
        coach_id: str,
        athlete_id: str,
        test_type: str,
        leg_tested: str,
        video_url: str,
        video_path: str,
        metrics: Dict,
        client_metrics: Dict,
        failure_reason: Optional[str] = None,
    ) -> Assessment:
        """Create assessment in completed state with client-calculated metrics.

        This is the new primary method - the client calculates all metrics,
        and the backend just validates and stores them.

        Args:
            coach_id: Coach user ID
            athlete_id: Athlete ID
            test_type: Type of test
            leg_tested: Which leg was tested
            video_url: Firebase Storage download URL
            video_path: Firebase Storage path
            metrics: Full metrics dict (client metrics + backend scores)
            client_metrics: Original client metrics for reference
            failure_reason: Optional failure reason from client

        Returns:
            Created assessment in completed state
        """
        data = {
            "coach_id": coach_id,
            "athlete_id": athlete_id,
            "test_type": test_type,
            "leg_tested": leg_tested,
            "video_url": video_url,
            "video_path": video_path,
            "status": AssessmentStatus.COMPLETED.value,
            "created_at": datetime.utcnow(),
            "raw_keypoints_url": None,
            "metrics": metrics,
            "client_metrics": client_metrics,
            "ai_feedback": None,  # Populated in Phase 7
            "failure_reason": failure_reason,
            "error_message": None,
        }

        assessment_id = await self.create(data)
        assessment = await self.get(assessment_id)
        return assessment

    async def update_with_results(
        self,
        assessment_id: str,
        metrics: Dict,
        raw_keypoints_url: str,
        ai_feedback: str = "",
    ) -> bool:
        """Update assessment with analysis results.

        Args:
            assessment_id: Assessment ID
            metrics: Calculated metrics dictionary
            raw_keypoints_url: URL to raw keypoints JSON
            ai_feedback: AI-generated feedback (populated in Phase 7)

        Returns:
            True if successful
        """
        update_data = {
            "status": AssessmentStatus.COMPLETED.value,
            "metrics": metrics,
            "raw_keypoints_url": raw_keypoints_url,
            "ai_feedback": ai_feedback,
        }
        return await self.update(assessment_id, update_data)

    async def mark_failed(
        self,
        assessment_id: str,
        error_message: str,
        failure_reason: Optional[str] = None,
    ) -> bool:
        """Mark assessment as failed.

        Args:
            assessment_id: Assessment ID
            error_message: Error description
            failure_reason: Optional failure reason code

        Returns:
            True if successful
        """
        update_data = {
            "status": AssessmentStatus.FAILED.value,
            "error_message": error_message,
            "failure_reason": failure_reason,
        }
        return await self.update(assessment_id, update_data)

    async def get_by_athlete(
        self,
        athlete_id: str,
        limit: Optional[int] = None,
    ) -> List[Assessment]:
        """Get assessments for an athlete.

        Args:
            athlete_id: Athlete ID
            limit: Optional limit

        Returns:
            List of assessments
        """
        return await self.list_by_field("athlete_id", athlete_id, limit)

    async def get_by_coach(
        self,
        coach_id: str,
        limit: Optional[int] = None,
    ) -> List[Assessment]:
        """Get assessments for a coach.

        Args:
            coach_id: Coach ID
            limit: Optional limit

        Returns:
            List of assessments
        """
        return await self.list_by_field("coach_id", coach_id, limit)

    async def get_if_owned(
        self,
        assessment_id: str,
        coach_id: str,
    ) -> Optional[Assessment]:
        """Get assessment if owned by coach.

        Args:
            assessment_id: Assessment ID
            coach_id: Coach ID

        Returns:
            Assessment if owned by coach, None otherwise
        """
        assessment = await self.get(assessment_id)
        if assessment and assessment.coach_id == coach_id:
            return assessment
        return None
