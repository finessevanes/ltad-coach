"""MediaPipe landmark indices and thresholds."""

# MediaPipe Pose Landmark Indices (33 total, 0-indexed)
# Reference: https://developers.google.com/mediapipe/solutions/vision/pose_landmarker

# Head
NOSE = 0
LEFT_EYE_INNER = 1
LEFT_EYE = 2
LEFT_EYE_OUTER = 3
RIGHT_EYE_INNER = 4
RIGHT_EYE = 5
RIGHT_EYE_OUTER = 6
LEFT_EAR = 7
RIGHT_EAR = 8
MOUTH_LEFT = 9
MOUTH_RIGHT = 10

# Upper Body
LEFT_SHOULDER = 11
RIGHT_SHOULDER = 12
LEFT_ELBOW = 13
RIGHT_ELBOW = 14
LEFT_WRIST = 15
RIGHT_WRIST = 16

# Torso
LEFT_PINKY = 17
RIGHT_PINKY = 18
LEFT_INDEX = 19
RIGHT_INDEX = 20
LEFT_THUMB = 21
RIGHT_THUMB = 22

# Lower Body
LEFT_HIP = 23
RIGHT_HIP = 24
LEFT_KNEE = 25
RIGHT_KNEE = 26
LEFT_ANKLE = 27
RIGHT_ANKLE = 28
LEFT_HEEL = 29
RIGHT_HEEL = 30
LEFT_FOOT_INDEX = 31
RIGHT_FOOT_INDEX = 32

# Failure Detection Thresholds (normalized coordinates)
HIP_TO_WRIST_THRESHOLD = 0.15  # Distance for "hands on hips" detection
FOOT_TOUCHDOWN_THRESHOLD = 0.05  # Y-distance for foot touchdown detection
SUPPORT_FOOT_MOVEMENT_THRESHOLD = 0.05  # Ankle displacement threshold
MINIMUM_POSE_CONFIDENCE = 0.5  # Minimum confidence to consider pose valid

# Visibility threshold
MIN_VISIBILITY = 0.5  # Minimum visibility score for landmark to be considered valid
