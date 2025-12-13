"""Metrics scoring utilities.

These functions provide backend-only scoring calculations.
All raw metrics are now calculated client-side via MediaPipe.js.
"""

from typing import Tuple
from app.constants import scoring


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
