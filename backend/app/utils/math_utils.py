"""Mathematical utility functions."""

import numpy as np
from typing import Tuple, List


def calculate_euclidean_distance(
    p1: Tuple[float, float],
    p2: Tuple[float, float],
) -> float:
    """Calculate Euclidean distance between two 2D points.

    Args:
        p1: First point (x, y)
        p2: Second point (x, y)

    Returns:
        Distance
    """
    return np.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2)


def calculate_path_length(points: List[Tuple[float, float]]) -> float:
    """Calculate total path length from sequence of 2D points.

    Args:
        points: List of (x, y) points

    Returns:
        Total path length
    """
    if len(points) < 2:
        return 0.0

    length = 0.0
    for i in range(1, len(points)):
        length += calculate_euclidean_distance(points[i - 1], points[i])

    return length


def count_threshold_crossings(
    values: np.ndarray,
    threshold: float,
    center: float,
) -> int:
    """Count number of times signal crosses threshold distance from center.

    This detects balance corrections - moments when the athlete moves
    significantly from center and then returns.

    Args:
        values: Signal values (1D array)
        threshold: Threshold distance from center
        center: Center value

    Returns:
        Number of corrections (threshold crossings)
    """
    corrections = 0
    outside = False

    for value in values:
        distance_from_center = abs(value - center)

        if not outside and distance_from_center > threshold:
            # Moved outside threshold
            outside = True
        elif outside and distance_from_center < threshold:
            # Returned inside threshold - count as correction
            corrections += 1
            outside = False

    return corrections
