"""LTAD scoring thresholds and age expectations."""

from typing import Dict, Tuple

# Duration to LTAD Score Mapping (1-5 scale)
# Based on Jeremy Frisch balance assessment benchmarks
DURATION_SCORE_THRESHOLDS: Dict[int, Tuple[float, float]] = {
    1: (1.0, 9.9),      # Beginning: 1-9 seconds
    2: (10.0, 14.9),    # Developing: 10-14 seconds
    3: (15.0, 19.9),    # Competent: 15-19 seconds
    4: (20.0, 24.9),    # Proficient: 20-24 seconds
    5: (25.0, 30.0),    # Advanced: 25-30 seconds
}

# LTAD Score Labels
DURATION_SCORE_LABELS: Dict[int, str] = {
    1: "Beginning",
    2: "Developing",
    3: "Competent",
    4: "Proficient",
    5: "Advanced",
}

# Age-Based Expected Scores (age range -> expected score)
# Based on LTAD developmental stages for ages 5-13
AGE_EXPECTED_SCORES: Dict[Tuple[int, int], int] = {
    (5, 6): 1,    # Ages 5-6: Beginning expected
    (7, 7): 2,    # Age 7: Developing expected
    (8, 9): 3,    # Ages 8-9: Competent expected
    (10, 11): 4,  # Ages 10-11: Proficient expected
    (12, 13): 5,  # Ages 12-13: Advanced expected
}

# Stability Score Composite Weights
# Weights for calculating overall stability score (0-100)
STABILITY_WEIGHTS = {
    "sway_std": 0.25,        # Weight for sway standard deviation
    "sway_velocity": 0.30,    # Weight for sway velocity (most important)
    "arm_excursion": 0.25,    # Weight for arm movement
    "corrections": 0.20,      # Weight for number of corrections
}

# Correction Threshold (in meters - world coordinates)
CORRECTION_THRESHOLD = 0.02  # 2cm threshold for detecting balance corrections

# Reference Values for Stability Score Calculation
# All metrics in real-world units (cm, degrees)
# Used to normalize metrics to 0-1 range before applying weights
REFERENCE_VALUES = {
    "sway_std_max": 8.0,          # Max expected sway std in cm
    "sway_velocity_max": 5.0,     # Max expected sway velocity in cm/s
    "arm_angle_max": 45.0,        # Max expected arm angle drop in degrees
    "corrections_max": 15,        # Max expected corrections
}
