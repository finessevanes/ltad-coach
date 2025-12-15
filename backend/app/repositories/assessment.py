"""Assessment repository for database operations."""

from typing import Optional, List, Dict, Any
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
            "ai_coach_assessment": None,
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
    ) -> Assessment:
        """Create assessment in completed state with consolidated metrics.

        This is the primary method - the client calculates all metrics,
        backend adds LTAD scoring, and everything is stored in a single metrics object.

        Args:
            coach_id: Coach user ID
            athlete_id: Athlete ID
            test_type: Type of test
            leg_tested: Which leg was tested
            video_url: Firebase Storage download URL
            video_path: Firebase Storage path
            metrics: Consolidated metrics dict (client metrics + backend scores)

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
            "ai_coach_assessment": None,  # Populated in Phase 7
            "error_message": None,
        }

        assessment_id = await self.create(data)
        assessment = await self.get(assessment_id)
        return assessment

    async def create_completed_dual_leg(
        self,
        coach_id: str,
        athlete_id: str,
        test_type: str,
        left_leg_video_url: str,
        left_leg_video_path: str,
        left_leg_metrics: Dict[str, Any],
        right_leg_video_url: str,
        right_leg_video_path: str,
        right_leg_metrics: Dict[str, Any],
        bilateral_comparison: Dict[str, Any],
    ) -> Assessment:
        """Create a completed dual-leg assessment with bilateral comparison.

        Stores assessment with left and right leg metrics plus symmetry analysis.
        Status is always "completed" since client provides all metrics.

        Args:
            coach_id: ID of the coach who created the assessment
            athlete_id: ID of the athlete being assessed
            test_type: Type of test (e.g., "one_leg_balance")
            left_leg_video_url: Public URL to left leg video in Firebase Storage
            left_leg_video_path: Storage path for left leg video (e.g., "videos/abc123.mp4")
            left_leg_metrics: Dictionary of left leg metrics (includes temporal data)
            right_leg_video_url: Public URL to right leg video in Firebase Storage
            right_leg_video_path: Storage path for right leg video
            right_leg_metrics: Dictionary of right leg metrics (includes temporal data)
            bilateral_comparison: Dictionary of bilateral comparison metrics

        Returns:
            Assessment model instance with generated ID

        Example:
            >>> repo = AssessmentRepository()
            >>> assessment = await repo.create_completed_dual_leg(
            ...     coach_id="coach123",
            ...     athlete_id="athlete456",
            ...     test_type="one_leg_balance",
            ...     left_leg_video_url="https://storage.example.com/left.mp4",
            ...     left_leg_video_path="videos/left.mp4",
            ...     left_leg_metrics={"hold_time": 25.3, "duration_score": 4, ...},
            ...     right_leg_video_url="https://storage.example.com/right.mp4",
            ...     right_leg_video_path="videos/right.mp4",
            ...     right_leg_metrics={"hold_time": 23.8, "duration_score": 4, ...},
            ...     bilateral_comparison={"overall_symmetry_score": 82.0, ...},
            ... )
            >>> assert assessment.leg_tested == "both"
            >>> assert assessment.status == AssessmentStatus.COMPLETED
        """
        import logging
        logger = logging.getLogger(__name__)

        logger.info(f"Creating dual-leg assessment for athlete {athlete_id}")
        logger.info(f"Left metrics keys: {list(left_leg_metrics.keys())}")
        logger.info(f"Right metrics keys: {list(right_leg_metrics.keys())}")
        logger.info(f"Bilateral comparison keys: {list(bilateral_comparison.keys())}")

        data = {
            "coach_id": coach_id,
            "athlete_id": athlete_id,
            "test_type": test_type,
            "leg_tested": "both",
            "status": AssessmentStatus.COMPLETED.value,
            "created_at": datetime.utcnow(),
            # Left leg fields
            "left_leg_video_url": left_leg_video_url,
            "left_leg_video_path": left_leg_video_path,
            "left_leg_metrics": left_leg_metrics,
            # Right leg fields
            "right_leg_video_url": right_leg_video_url,
            "right_leg_video_path": right_leg_video_path,
            "right_leg_metrics": right_leg_metrics,
            # Bilateral comparison
            "bilateral_comparison": bilateral_comparison,
            # Optional fields (may be added later)
            "ai_coach_assessment": None,
            "error_message": None,
        }

        logger.info(f"Data dict keys before storage: {list(data.keys())}")
        logger.info(f"Data has left_leg_metrics: {bool(data.get('left_leg_metrics'))}")
        logger.info(f"Data has right_leg_metrics: {bool(data.get('right_leg_metrics'))}")
        logger.info(f"Data has bilateral_comparison: {bool(data.get('bilateral_comparison'))}")

        assessment_id = await self.create(data)
        logger.info(f"Assessment created with ID: {assessment_id}")

        assessment = await self.get(assessment_id)
        logger.info(f"Assessment retrieved - has left_leg_metrics: {bool(assessment.left_leg_metrics)}")
        logger.info(f"Assessment retrieved - has right_leg_metrics: {bool(assessment.right_leg_metrics)}")
        logger.info(f"Assessment retrieved - has bilateral_comparison: {bool(assessment.bilateral_comparison)}")

        return assessment

    async def update_with_results(
        self,
        assessment_id: str,
        metrics: Dict,
        raw_keypoints_url: str,
        ai_coach_assessment: str = "",
    ) -> bool:
        """Update assessment with analysis results.

        Args:
            assessment_id: Assessment ID
            metrics: Calculated metrics dictionary
            raw_keypoints_url: URL to raw keypoints JSON
            ai_coach_assessment: AI-generated coach-friendly assessment feedback (Phase 7)

        Returns:
            True if successful
        """
        update_data = {
            "status": AssessmentStatus.COMPLETED.value,
            "metrics": metrics,
            "raw_keypoints_url": raw_keypoints_url,
            "ai_coach_assessment": ai_coach_assessment,
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
        """Get assessments for an athlete, ordered by newest first.

        Args:
            athlete_id: Athlete ID
            limit: Optional limit

        Returns:
            List of assessments ordered by created_at descending
        """
        return await self.list_by_field(
            "athlete_id", athlete_id, limit,
            order_by="created_at", direction="DESCENDING"
        )

    async def get_by_coach(
        self,
        coach_id: str,
        limit: Optional[int] = None,
    ) -> List[Assessment]:
        """Get assessments for a coach, ordered by newest first.

        Args:
            coach_id: Coach ID
            limit: Optional limit

        Returns:
            List of assessments ordered by created_at descending
        """
        return await self.list_by_field(
            "coach_id", coach_id, limit,
            order_by="created_at", direction="DESCENDING"
        )

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
