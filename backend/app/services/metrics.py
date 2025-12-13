"""Metrics scoring utilities.

These functions provide backend-only scoring calculations.
All raw metrics are now calculated client-side via MediaPipe.js.

The LTAD Duration Score (1-5) is validated by Athletics Canada LTAD framework.
"""

from app.constants import scoring


def get_duration_score(duration: float) -> int:
    """Map duration to LTAD score (1-5).

    This score is validated by Athletics Canada LTAD framework.

    Args:
        duration: Duration in seconds

    Returns:
        LTAD score (1-5)
    """
    for score, (min_dur, max_dur) in scoring.DURATION_SCORE_THRESHOLDS.items():
        if min_dur <= duration <= max_dur:
            return score

    # Fallback for durations outside normal range
    if duration < 1.0:
        return 1
    return 5  # >= 25 seconds
