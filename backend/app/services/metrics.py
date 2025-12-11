"""Metrics calculation from pose landmarks."""

import numpy as np
from typing import Dict, List, Tuple
import logging

from app.constants import landmarks as lm
from app.constants import scoring
from app.utils.math_utils import (
    calculate_path_length,
    count_threshold_crossings,
)

logger = logging.getLogger(__name__)


class MetricsCalculator:
    """Calculate balance metrics from filtered landmarks."""

    def __init__(
        self,
        filtered_landmarks: List[List[Tuple[float, float, float, float]]],
        timestamps: List[float],
        duration: float,
        failure_reason: str,
        leg_tested: str,
    ):
        """Initialize calculator.

        Args:
            filtered_landmarks: Filtered landmark frames
            timestamps: Frame timestamps
            duration: Total duration in seconds
            failure_reason: Test failure reason
            leg_tested: Which leg was tested
        """
        self.landmarks = filtered_landmarks
        self.timestamps = timestamps
        self.duration = duration
        self.failure_reason = failure_reason
        self.leg_tested = leg_tested

    def calculate_all(self) -> Dict:
        """Calculate all metrics.

        Returns:
            Dictionary with all metrics
        """
        if not self.landmarks:
            return self._empty_metrics()

        # Extract hip trajectory (center of mass proxy)
        hip_trajectory = self._get_hip_trajectory()

        # Calculate sway metrics
        sway_std_x, sway_std_y = self._calculate_sway_std(hip_trajectory)
        sway_path_length = calculate_path_length(hip_trajectory)
        sway_velocity = sway_path_length / self.duration if self.duration > 0 else 0

        # Calculate arm excursion
        arm_left, arm_right = self._calculate_arm_excursion()
        arm_asymmetry = arm_left / arm_right if arm_right > 0 else 1.0

        # Count corrections
        corrections = self._count_corrections(hip_trajectory)

        # Calculate stability score (0-100, higher is better)
        stability_score = self._calculate_stability_score(
            sway_std_x + sway_std_y,  # Combined sway
            sway_velocity,
            (arm_left + arm_right) / 2,  # Average arm movement
            corrections,
        )

        # Get duration score (LTAD 1-5)
        duration_score, duration_label = get_duration_score(self.duration)

        return {
            "duration_seconds": round(self.duration, 2),
            "stability_score": round(stability_score, 2),
            "sway_std_x": round(sway_std_x, 6),
            "sway_std_y": round(sway_std_y, 6),
            "sway_path_length": round(sway_path_length, 6),
            "sway_velocity": round(sway_velocity, 6),
            "arm_excursion_left": round(arm_left, 2),
            "arm_excursion_right": round(arm_right, 2),
            "arm_asymmetry_ratio": round(arm_asymmetry, 2),
            "corrections_count": corrections,
            "duration_score": duration_score,
            "duration_score_label": duration_label,
        }

    def _get_hip_trajectory(self) -> List[Tuple[float, float]]:
        """Extract hip center trajectory.

        Returns:
            List of (x, y) hip center points
        """
        trajectory = []
        for frame in self.landmarks:
            left_hip = frame[lm.LEFT_HIP]
            right_hip = frame[lm.RIGHT_HIP]

            # Hip center = midpoint
            center_x = (left_hip[0] + right_hip[0]) / 2
            center_y = (left_hip[1] + right_hip[1]) / 2

            trajectory.append((center_x, center_y))

        return trajectory

    def _calculate_sway_std(
        self,
        hip_trajectory: List[Tuple[float, float]],
    ) -> Tuple[float, float]:
        """Calculate sway standard deviation.

        Args:
            hip_trajectory: List of (x, y) points

        Returns:
            (std_x, std_y)
        """
        if not hip_trajectory:
            return 0.0, 0.0

        x_values = [p[0] for p in hip_trajectory]
        y_values = [p[1] for p in hip_trajectory]

        return np.std(x_values), np.std(y_values)

    def _calculate_arm_excursion(self) -> Tuple[float, float]:
        """Calculate total arm angular movement.

        Returns:
            (left_arm_excursion_degrees, right_arm_excursion_degrees)
        """
        left_total = 0.0
        right_total = 0.0

        for i in range(1, len(self.landmarks)):
            prev_frame = self.landmarks[i - 1]
            curr_frame = self.landmarks[i]

            # Left arm: shoulder to wrist angle
            left_shoulder_prev = prev_frame[lm.LEFT_SHOULDER]
            left_wrist_prev = prev_frame[lm.LEFT_WRIST]
            left_shoulder_curr = curr_frame[lm.LEFT_SHOULDER]
            left_wrist_curr = curr_frame[lm.LEFT_WRIST]

            angle_prev = np.arctan2(
                left_wrist_prev[1] - left_shoulder_prev[1],
                left_wrist_prev[0] - left_shoulder_prev[0],
            )
            angle_curr = np.arctan2(
                left_wrist_curr[1] - left_shoulder_curr[1],
                left_wrist_curr[0] - left_shoulder_curr[0],
            )
            left_total += abs(np.degrees(angle_curr - angle_prev))

            # Right arm
            right_shoulder_prev = prev_frame[lm.RIGHT_SHOULDER]
            right_wrist_prev = prev_frame[lm.RIGHT_WRIST]
            right_shoulder_curr = curr_frame[lm.RIGHT_SHOULDER]
            right_wrist_curr = curr_frame[lm.RIGHT_WRIST]

            angle_prev = np.arctan2(
                right_wrist_prev[1] - right_shoulder_prev[1],
                right_wrist_prev[0] - right_shoulder_prev[0],
            )
            angle_curr = np.arctan2(
                right_wrist_curr[1] - right_shoulder_curr[1],
                right_wrist_curr[0] - right_shoulder_curr[0],
            )
            right_total += abs(np.degrees(angle_curr - angle_prev))

        return left_total, right_total

    def _count_corrections(
        self,
        hip_trajectory: List[Tuple[float, float]],
    ) -> int:
        """Count balance corrections.

        Args:
            hip_trajectory: List of (x, y) points

        Returns:
            Number of corrections
        """
        if not hip_trajectory:
            return 0

        x_values = np.array([p[0] for p in hip_trajectory])
        center_x = np.mean(x_values)

        return count_threshold_crossings(
            x_values,
            scoring.CORRECTION_THRESHOLD,
            center_x,
        )

    def _calculate_stability_score(
        self,
        sway_std: float,
        sway_velocity: float,
        arm_excursion: float,
        corrections: int,
    ) -> float:
        """Calculate composite stability score (0-100).

        Args:
            sway_std: Combined sway standard deviation
            sway_velocity: Sway velocity
            arm_excursion: Average arm excursion
            corrections: Number of corrections

        Returns:
            Stability score (0-100, higher is better)
        """
        # Normalize each metric to [0, 1] using reference values
        norm_sway = min(
            sway_std / scoring.REFERENCE_VALUES["sway_std_max"],
            1.0
        )
        norm_velocity = min(
            sway_velocity / scoring.REFERENCE_VALUES["sway_velocity_max"],
            1.0
        )
        norm_arm = min(
            arm_excursion / scoring.REFERENCE_VALUES["arm_excursion_max"],
            1.0
        )
        norm_corrections = min(
            corrections / scoring.REFERENCE_VALUES["corrections_max"],
            1.0
        )

        # Weighted average (lower is better for all metrics)
        weighted_avg = (
            scoring.STABILITY_WEIGHTS["sway_std"] * norm_sway +
            scoring.STABILITY_WEIGHTS["sway_velocity"] * norm_velocity +
            scoring.STABILITY_WEIGHTS["arm_excursion"] * norm_arm +
            scoring.STABILITY_WEIGHTS["corrections"] * norm_corrections
        )

        # Convert to 0-100 scale (higher is better)
        stability_score = (1 - weighted_avg) * 100

        return max(0, min(100, stability_score))

    def _empty_metrics(self) -> Dict:
        """Return empty metrics for failed analysis."""
        return {
            "duration_seconds": 0.0,
            "stability_score": 0.0,
            "sway_std_x": 0.0,
            "sway_std_y": 0.0,
            "sway_path_length": 0.0,
            "sway_velocity": 0.0,
            "arm_excursion_left": 0.0,
            "arm_excursion_right": 0.0,
            "arm_asymmetry_ratio": 1.0,
            "corrections_count": 0,
            "duration_score": 1,
            "duration_score_label": "Beginning",
        }


def get_duration_score(duration: float) -> Tuple[int, str]:
    """Map duration to LTAD score (1-5).

    Args:
        duration: Duration in seconds

    Returns:
        (score, label)
    """
    for score, (min_dur, max_dur) in scoring.DURATION_SCORE_THRESHOLDS.items():
        if min_dur <= duration <= max_dur:
            label = scoring.DURATION_SCORE_LABELS[score]
            return score, label

    # Fallback
    return 1, "Beginning"


def get_age_expectation(age: int, score: int) -> str:
    """Compare score to age expectation.

    Args:
        age: Athlete age
        score: Duration score (1-5)

    Returns:
        "meets", "above", or "below"
    """
    expected_score = None
    for (min_age, max_age), exp_score in scoring.AGE_EXPECTED_SCORES.items():
        if min_age <= age <= max_age:
            expected_score = exp_score
            break

    if expected_score is None:
        return "meets"  # Unknown age range

    if score > expected_score:
        return "above"
    elif score < expected_score:
        return "below"
    else:
        return "meets"
