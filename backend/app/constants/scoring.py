"""LTAD scoring thresholds.

The LTAD Duration Score (1-5) is validated by Athletics Canada LTAD framework.
"""

from typing import Dict, Tuple

# Duration to LTAD Score Mapping (1-5 scale)
# Based on Athletics Canada LTAD framework and Jeremy Frisch balance assessment benchmarks
DURATION_SCORE_THRESHOLDS: Dict[int, Tuple[float, float]] = {
    1: (1.0, 9.9),      # 1-9 seconds
    2: (10.0, 14.9),    # 10-14 seconds
    3: (15.0, 19.9),    # 15-19 seconds
    4: (20.0, 24.9),    # 20-24 seconds
    5: (25.0, 30.0),    # 25-30 seconds
}
