"""Deterministic trend analyzer for assessment history.

Replaces AI-based compression with code-based trend detection to ensure
reliable and consistent trend classification without hallucination.
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from pydantic import BaseModel
import statistics

logger = logging.getLogger(__name__)


class TrendAnalysis(BaseModel):
    """Structured trend analysis result."""

    trend: str  # "improving", "declining", "stable"
    trend_strength: str  # "significant", "moderate", "slight"
    direction_changes: List[Dict[str, Any]]  # Where trend reversed
    score_trajectory: Dict[str, Any]  # First, peak, current stats
    consistency: float  # 0-1, based on variance (1 = very consistent)
    first_to_current_delta: float  # Change from first to current
    peak_to_current_delta: float  # Change from peak to current
    athlete_name: str
    assessment_count: int

    def to_narrative_summary(self) -> str:
        """Convert structured data to prose for AI agent.

        Returns:
            Clear, factual prose that the Progress Agent can trust
        """
        traj = self.score_trajectory
        first = traj["first"]
        current = traj["current"]
        peak = traj["peak"]

        # Start with trend keyword (CRITICAL for Progress Agent)
        if self.trend == "improving":
            opening = f"{self.athlete_name}'s balance is **improving**."
        elif self.trend == "declining":
            opening = f"{self.athlete_name}'s balance is **declining**."
        else:
            opening = f"{self.athlete_name}'s balance is **stable**."

        # Add trajectory details
        first_line = (
            f" They started at {first['hold_time']:.1f} seconds "
            f"(score {first['duration_score']}/5) in {first['date']}."
        )

        current_line = (
            f" Their most recent test showed {current['hold_time']:.1f} seconds "
            f"(score {current['duration_score']}/5) in {current['date']}."
        )

        # Peak performance context
        if peak["hold_time"] > current["hold_time"]:
            peak_line = (
                f" Their best performance was {peak['hold_time']:.1f} seconds "
                f"in {peak['date']}, which is {self.peak_to_current_delta:.1f} seconds "
                f"higher than their current level."
            )
        else:
            peak_line = (
                f" They are currently at their peak performance of "
                f"{peak['hold_time']:.1f} seconds."
            )

        # Overall change
        if self.first_to_current_delta > 0:
            delta_line = (
                f" Overall, they have improved by {self.first_to_current_delta:.1f} seconds "
                f"since their first assessment."
            )
        elif self.first_to_current_delta < 0:
            delta_line = (
                f" Overall, they have declined by {abs(self.first_to_current_delta):.1f} seconds "
                f"since their first assessment."
            )
        else:
            delta_line = " Their performance has remained at the same level."

        # Consistency note
        if self.consistency >= 0.85:
            consistency_note = " Performance has been very consistent."
        elif self.consistency >= 0.70:
            consistency_note = " Performance shows moderate variability."
        else:
            consistency_note = " Performance has been inconsistent."

        # Direction changes (trend reversals)
        if self.direction_changes:
            last_change = self.direction_changes[-1]
            change_note = (
                f" The current {self.trend} trend began at assessment #{last_change['at_index'] + 1}, "
                f"when performance shifted from {last_change['from_direction']} to {last_change['to_direction']}."
            )
        else:
            change_note = f" The {self.trend} trend has been consistent throughout all assessments."

        summary = (
            opening + first_line + current_line + peak_line +
            delta_line + consistency_note + change_note
        )

        return summary


def _detect_direction_changes(
    scores: List[float],
    dates: List[str]
) -> List[Dict[str, Any]]:
    """Detect direction changes (reversals) in performance trajectory.

    Args:
        scores: Hold times in chronological order (oldest → newest)
        dates: Date strings corresponding to each score

    Returns:
        List of direction change events
    """
    direction_changes = []
    current_direction = None

    for i in range(1, len(scores)):
        prev_score = scores[i-1]
        curr_score = scores[i]

        # Determine this step's direction (5% threshold to avoid noise)
        if curr_score > prev_score * 1.05:
            step_direction = "up"
        elif curr_score < prev_score * 0.95:
            step_direction = "down"
        else:
            step_direction = "flat"

        # Check if direction changed (flag reversal)
        if current_direction and step_direction != "flat" and step_direction != current_direction:
            direction_changes.append({
                "at_index": i,
                "date": dates[i],
                "from_direction": current_direction,
                "to_direction": step_direction,
                "from_score": prev_score,
                "to_score": curr_score
            })

        # Update current direction (ignore flat movements)
        if step_direction != "flat":
            current_direction = step_direction

    return direction_changes


def _detect_trend(
    scores: List[float],
    dates: List[str]
) -> Tuple[str, str, List[Dict[str, Any]]]:
    """Detect trend using window-based comparison.

    Compares recent performance (last 3 assessments) to older performance
    (earlier assessments) to determine overall trend direction.

    Args:
        scores: Hold times in chronological order (oldest → newest)
        dates: Date strings corresponding to each score

    Returns:
        (current_trend, trend_strength, direction_changes)
    """
    if len(scores) < 2:
        return "stable", "slight", []

    # Track direction changes for narrative context
    direction_changes = _detect_direction_changes(scores, dates)

    # Window-based trend detection
    if len(scores) >= 4:
        # Compare recent window (last 3) vs older window (all before that)
        recent_window = scores[-3:]
        older_window = scores[:-3]

        recent_avg = sum(recent_window) / len(recent_window)
        older_avg = sum(older_window) / len(older_window)

        # Determine trend (10% threshold)
        if recent_avg > older_avg * 1.10:
            trend = "improving"
            strength = "significant" if recent_avg > older_avg * 1.25 else "moderate"
        elif recent_avg < older_avg * 0.90:
            trend = "declining"
            strength = "significant" if recent_avg < older_avg * 0.75 else "moderate"
        else:
            trend = "stable"
            strength = "slight"
    else:
        # Fallback for 2-3 assessments: Simple first-to-last comparison
        first_score = scores[0]
        last_score = scores[-1]
        pct_change = ((last_score - first_score) / first_score) * 100

        if pct_change > 10:
            trend = "improving"
        elif pct_change < -10:
            trend = "declining"
        else:
            trend = "stable"

        strength = "significant" if abs(pct_change) >= 25 else ("moderate" if abs(pct_change) >= 10 else "slight")

    return trend, strength, direction_changes


def analyze_trend(
    assessments: List[Dict[str, Any]],
    athlete_name: str,
    athlete_age: int
) -> TrendAnalysis:
    """Analyze assessment trend using deterministic logic.

    Args:
        assessments: List of assessment dicts (most recent first from DB)
        athlete_name: Athlete's name
        athlete_age: Athlete's age

    Returns:
        Structured trend analysis
    """
    if not assessments:
        # Return empty/default analysis for no data
        return TrendAnalysis(
            trend="stable",
            trend_strength="slight",
            direction_changes=[],
            score_trajectory={
                "first": {"hold_time": 0, "duration_score": 0, "date": "N/A"},
                "current": {"hold_time": 0, "duration_score": 0, "date": "N/A"},
                "peak": {"hold_time": 0, "duration_score": 0, "date": "N/A"},
            },
            consistency=1.0,
            first_to_current_delta=0.0,
            peak_to_current_delta=0.0,
            athlete_name=athlete_name,
            assessment_count=0
        )

    # Sort chronologically (oldest → newest)
    sorted_assessments = sorted(assessments, key=lambda a: a["created_at"])

    # Extract hold times and dates
    hold_times = []
    duration_scores = []
    dates = []

    for assessment in sorted_assessments:
        metrics = assessment.get("metrics", {})

        # Skip assessments with missing metrics
        if not metrics:
            logger.warning(f"Assessment {assessment.get('id', 'unknown')} has no metrics - skipping")
            continue

        hold_time = metrics.get("hold_time", 0)
        duration_score = metrics.get("duration_score", 0)
        created_at = assessment.get("created_at")

        hold_times.append(hold_time)
        duration_scores.append(duration_score)

        # Format date
        if isinstance(created_at, datetime):
            date_str = created_at.strftime("%b %Y")
        else:
            date_str = "Unknown"
        dates.append(date_str)

    if not hold_times:
        logger.error(f"No valid metrics found for {athlete_name}")
        # Return minimal analysis
        return TrendAnalysis(
            trend="stable",
            trend_strength="slight",
            direction_changes=[],
            score_trajectory={
                "first": {"hold_time": 0, "duration_score": 0, "date": "N/A"},
                "current": {"hold_time": 0, "duration_score": 0, "date": "N/A"},
                "peak": {"hold_time": 0, "duration_score": 0, "date": "N/A"},
            },
            consistency=1.0,
            first_to_current_delta=0.0,
            peak_to_current_delta=0.0,
            athlete_name=athlete_name,
            assessment_count=len(assessments)
        )

    # Detect trend using core algorithm
    trend, strength, direction_changes = _detect_trend(hold_times, dates)

    # Find peak performance
    peak_index = hold_times.index(max(hold_times))

    # Build score trajectory
    first_index = 0
    current_index = len(hold_times) - 1

    score_trajectory = {
        "first": {
            "hold_time": hold_times[first_index],
            "duration_score": duration_scores[first_index],
            "date": dates[first_index]
        },
        "current": {
            "hold_time": hold_times[current_index],
            "duration_score": duration_scores[current_index],
            "date": dates[current_index]
        },
        "peak": {
            "hold_time": hold_times[peak_index],
            "duration_score": duration_scores[peak_index],
            "date": dates[peak_index]
        }
    }

    # Calculate consistency (inverse of coefficient of variation)
    if len(hold_times) >= 2:
        mean_time = statistics.mean(hold_times)
        if mean_time > 0:
            std_dev = statistics.stdev(hold_times)
            cv = std_dev / mean_time  # Coefficient of variation
            consistency = max(0, 1 - cv)  # Inverse (1 = perfect consistency)
        else:
            consistency = 0.5
    else:
        consistency = 1.0

    # Calculate deltas
    first_to_current_delta = hold_times[current_index] - hold_times[first_index]
    peak_to_current_delta = hold_times[peak_index] - hold_times[current_index]

    return TrendAnalysis(
        trend=trend,
        trend_strength=strength,
        direction_changes=direction_changes,
        score_trajectory=score_trajectory,
        consistency=consistency,
        first_to_current_delta=first_to_current_delta,
        peak_to_current_delta=peak_to_current_delta,
        athlete_name=athlete_name,
        assessment_count=len(assessments)
    )
