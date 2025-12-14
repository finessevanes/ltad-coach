"""Bilateral comparison service for dual-leg assessments."""

from typing import Dict, Any


def calculate_bilateral_comparison(
    left_metrics: Dict[str, Any],
    right_metrics: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Calculate bilateral comparison metrics from left and right leg test data.

    Analyzes symmetry across duration, sway, arm angles, and corrections to provide
    a comprehensive bilateral assessment. Uses LTAD-aligned thresholds for clinical relevance.

    Args:
        left_metrics: Dictionary containing left leg metrics (hold_time, sway_velocity, etc.)
        right_metrics: Dictionary containing right leg metrics (hold_time, sway_velocity, etc.)

    Returns:
        Dictionary containing:
            - duration_difference: Absolute difference in hold time (seconds)
            - duration_difference_pct: Percentage difference (0-100)
            - dominant_leg: 'left', 'right', or 'balanced'
            - sway_difference: Absolute sway velocity difference (cm/s)
            - sway_symmetry_score: 0 (asymmetric) to 1 (perfect symmetry)
            - arm_angle_difference: Average arm angle difference (degrees)
            - corrections_difference: Signed difference in corrections count
            - overall_symmetry_score: Weighted symmetry score (0-100)
            - symmetry_assessment: 'excellent', 'good', 'fair', or 'poor'

    Example:
        >>> left = {"hold_time": 25.3, "sway_velocity": 2.1, ...}
        >>> right = {"hold_time": 23.8, "sway_velocity": 2.3, ...}
        >>> result = calculate_bilateral_comparison(left, right)
        >>> result["overall_symmetry_score"]
        82.5
        >>> result["symmetry_assessment"]
        'good'
    """
    # 1. Duration Comparison
    left_hold = left_metrics.get("hold_time", 0.0)
    right_hold = right_metrics.get("hold_time", 0.0)

    duration_difference = abs(left_hold - right_hold)
    max_duration = max(left_hold, right_hold)
    duration_difference_pct = (
        (duration_difference / max_duration * 100) if max_duration > 0 else 0.0
    )

    # Determine dominant leg (20% threshold for "balanced")
    if duration_difference_pct < 20:
        dominant_leg = "balanced"
    elif left_hold > right_hold:
        dominant_leg = "left"
    else:
        dominant_leg = "right"

    # 2. Sway Comparison
    left_sway = left_metrics.get("sway_velocity", 0.0)
    right_sway = right_metrics.get("sway_velocity", 0.0)

    sway_difference = abs(left_sway - right_sway)
    avg_sway = (left_sway + right_sway) / 2

    # Sway symmetry: 1 = perfect symmetry, 0 = completely different
    sway_symmetry_score = (
        1.0 - min(sway_difference / avg_sway, 1.0) if avg_sway > 0 else 1.0
    )

    # 3. Arm Angle Comparison
    # Average both arms for each leg, then compare
    left_arm_avg = (
        left_metrics.get("arm_angle_left", 0.0) + left_metrics.get("arm_angle_right", 0.0)
    ) / 2
    right_arm_avg = (
        right_metrics.get("arm_angle_left", 0.0) + right_metrics.get("arm_angle_right", 0.0)
    ) / 2

    arm_angle_difference = abs(left_arm_avg - right_arm_avg)

    # 4. Corrections Comparison (signed)
    left_corrections = left_metrics.get("corrections_count", 0)
    right_corrections = right_metrics.get("corrections_count", 0)
    corrections_difference = left_corrections - right_corrections  # Signed

    # 5. Overall Symmetry Score (0-100 scale)
    # Duration symmetry component (50% weight)
    duration_symmetry = max(0, 100 - duration_difference_pct)

    # Sway symmetry component (30% weight)
    sway_symmetry_pct = sway_symmetry_score * 100

    # Arm symmetry component (10% weight)
    # Assume 15 degrees is max acceptable difference (maps to 0)
    arm_symmetry_pct = max(0, 100 - (arm_angle_difference / 15 * 100))

    # Corrections symmetry component (10% weight)
    # Assume 5 corrections difference is max acceptable (maps to 0)
    corrections_symmetry_pct = max(0, 100 - (abs(corrections_difference) / 5 * 100))

    overall_symmetry_score = (
        duration_symmetry * 0.5 +
        sway_symmetry_pct * 0.3 +
        arm_symmetry_pct * 0.1 +
        corrections_symmetry_pct * 0.1
    )

    # Clamp to 0-100 range
    overall_symmetry_score = max(0.0, min(100.0, overall_symmetry_score))

    # 6. Symmetry Assessment Classification
    if overall_symmetry_score >= 85:
        symmetry_assessment = "excellent"
    elif overall_symmetry_score >= 70:
        symmetry_assessment = "good"
    elif overall_symmetry_score >= 50:
        symmetry_assessment = "fair"
    else:
        symmetry_assessment = "poor"

    # Return all metrics rounded to 1 decimal place
    return {
        "duration_difference": round(duration_difference, 1),
        "duration_difference_pct": round(duration_difference_pct, 1),
        "dominant_leg": dominant_leg,
        "sway_difference": round(sway_difference, 1),
        "sway_symmetry_score": round(sway_symmetry_score, 2),
        "arm_angle_difference": round(arm_angle_difference, 1),
        "corrections_difference": corrections_difference,
        "overall_symmetry_score": round(overall_symmetry_score, 1),
        "symmetry_assessment": symmetry_assessment,
    }
