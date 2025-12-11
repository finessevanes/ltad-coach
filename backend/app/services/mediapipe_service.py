import cv2
import mediapipe as mp
import numpy as np
from scipy.signal import butter, filtfilt
from typing import List, Dict, Any, Optional
from app.models.assessment import FailureReason
from app.services.storage import storage_service

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils


class MediaPipeService:
    def __init__(self):
        self.pose = mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )

    def extract_landmarks_from_video(self, video_path: str) -> Dict[str, Any]:
        """
        Extract pose landmarks from video file

        Returns:
            {
                "frames": List of landmark data per frame,
                "fps": Video FPS,
                "total_frames": Total frame count,
                "duration": Video duration in seconds
            }
        """
        cap = cv2.VideoCapture(video_path)

        if not cap.isOpened():
            raise ValueError(f"Could not open video: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / fps if fps > 0 else 0

        frames_data = []
        frame_number = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            # Convert to RGB (MediaPipe expects RGB)
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            # Process frame
            results = self.pose.process(rgb_frame)

            timestamp = frame_number / fps

            if results.pose_landmarks:
                landmarks = []
                for lm in results.pose_landmarks.landmark:
                    landmarks.append({
                        "x": lm.x,
                        "y": lm.y,
                        "z": lm.z,
                        "visibility": lm.visibility
                    })

                frames_data.append({
                    "frame": frame_number,
                    "timestamp": timestamp,
                    "landmarks": landmarks
                })
            else:
                # No pose detected in frame
                frames_data.append({
                    "frame": frame_number,
                    "timestamp": timestamp,
                    "landmarks": None
                })

            frame_number += 1

        cap.release()

        return {
            "frames": frames_data,
            "fps": fps,
            "total_frames": total_frames,
            "duration": duration
        }

    def apply_lowpass_filter(
        self,
        data: np.ndarray,
        cutoff: float = 6.0,
        fs: float = 30.0,
        order: int = 2
    ) -> np.ndarray:
        """
        Apply Butterworth low-pass filter to reduce noise

        Args:
            data: 1D array of values
            cutoff: Cutoff frequency (Hz)
            fs: Sampling frequency (Hz)
            order: Filter order

        Returns:
            Filtered data
        """
        nyquist = 0.5 * fs
        normal_cutoff = cutoff / nyquist
        b, a = butter(order, normal_cutoff, btype='low', analog=False)
        filtered_data = filtfilt(b, a, data)
        return filtered_data

    def detect_failure(
        self,
        frames_data: List[Dict],
        standing_leg: str,  # "left" or "right"
        test_duration: float = 20.0
    ) -> Dict[str, Any]:
        """
        Detect failure events during balance test

        Returns:
            {
                "duration": seconds until failure,
                "failureReason": FailureReason enum,
                "failureFrame": frame number where failure occurred
            }
        """
        # Landmark indices
        LEFT_ANKLE = 27
        RIGHT_ANKLE = 28
        LEFT_HIP = 23
        RIGHT_HIP = 24
        LEFT_WRIST = 15
        RIGHT_WRIST = 16

        # Determine which foot is raised
        raised_ankle_idx = LEFT_ANKLE if standing_leg == "right" else RIGHT_ANKLE
        standing_ankle_idx = RIGHT_ANKLE if standing_leg == "right" else LEFT_ANKLE

        # Get initial standing foot position (average of first 10 frames)
        initial_standing_pos = None
        for frame in frames_data[:10]:
            if frame["landmarks"]:
                ankle = frame["landmarks"][standing_ankle_idx]
                if initial_standing_pos is None:
                    initial_standing_pos = {"x": ankle["x"], "y": ankle["y"]}
                break

        if not initial_standing_pos:
            raise ValueError("Could not detect initial pose")

        # Initial standing foot Y position (for touchdown detection)
        ground_level = initial_standing_pos["y"]

        for frame in frames_data:
            if not frame["landmarks"]:
                continue

            landmarks = frame["landmarks"]
            timestamp = frame["timestamp"]

            # Check if duration exceeded
            if timestamp >= test_duration:
                return {
                    "duration": test_duration,
                    "failureReason": FailureReason.TIME_COMPLETE,
                    "failureFrame": frame["frame"]
                }

            # Check foot touchdown
            raised_ankle = landmarks[raised_ankle_idx]
            if raised_ankle["y"] >= ground_level - 0.05:  # 5% tolerance
                return {
                    "duration": timestamp,
                    "failureReason": FailureReason.FOOT_TOUCHDOWN,
                    "failureFrame": frame["frame"]
                }

            # Check support foot movement
            standing_ankle = landmarks[standing_ankle_idx]
            distance_moved = np.sqrt(
                (standing_ankle["x"] - initial_standing_pos["x"]) ** 2 +
                (standing_ankle["y"] - initial_standing_pos["y"]) ** 2
            )
            if distance_moved > 0.15:  # 15% of frame width
                return {
                    "duration": timestamp,
                    "failureReason": FailureReason.SUPPORT_FOOT_MOVED,
                    "failureFrame": frame["frame"]
                }

            # Check hands left hips
            left_wrist = landmarks[LEFT_WRIST]
            right_wrist = landmarks[RIGHT_WRIST]
            left_hip = landmarks[LEFT_HIP]
            right_hip = landmarks[RIGHT_HIP]

            # Distance from wrists to hips
            left_distance = abs(left_wrist["y"] - left_hip["y"])
            right_distance = abs(right_wrist["y"] - right_hip["y"])

            # Hands should be close to hips (within 10% vertical distance)
            if left_distance > 0.1 or right_distance > 0.1:
                return {
                    "duration": timestamp,
                    "failureReason": FailureReason.HANDS_LEFT_HIPS,
                    "failureFrame": frame["frame"]
                }

        # If we reach here, test completed successfully
        return {
            "duration": test_duration,
            "failureReason": FailureReason.TIME_COMPLETE,
            "failureFrame": frames_data[-1]["frame"] if frames_data else 0
        }

    def calculate_sway_metrics(self, frames_data: List[Dict], duration: float) -> Dict[str, float]:
        """
        Calculate postural sway metrics from landmark data

        Args:
            frames_data: Landmark data from extract_landmarks_from_video
            duration: Test duration in seconds

        Returns:
            {
                "swayStdX": float,
                "swayStdY": float,
                "swayPathLength": float (cm),
                "swayVelocity": float (cm/s)
            }
        """
        LEFT_HIP = 23
        RIGHT_HIP = 24
        LEFT_SHOULDER = 11
        RIGHT_SHOULDER = 12

        # Extract hip midpoint trajectory
        hip_x = []
        hip_y = []
        timestamps = []

        # Estimate height for normalization (shoulder-to-hip distance)
        height_proxy = None

        for frame in frames_data:
            if not frame["landmarks"]:
                continue

            landmarks = frame["landmarks"]

            # Hip midpoint
            left_hip = landmarks[LEFT_HIP]
            right_hip = landmarks[RIGHT_HIP]
            mid_x = (left_hip["x"] + right_hip["x"]) / 2
            mid_y = (left_hip["y"] + right_hip["y"]) / 2

            hip_x.append(mid_x)
            hip_y.append(mid_y)
            timestamps.append(frame["timestamp"])

            # Calculate height proxy (once)
            if height_proxy is None:
                left_shoulder = landmarks[LEFT_SHOULDER]
                shoulder_y = (left_shoulder["y"] + landmarks[RIGHT_SHOULDER]["y"]) / 2
                hip_y_val = mid_y
                height_proxy = abs(shoulder_y - hip_y_val)

        if len(hip_x) < 10:
            raise ValueError("Insufficient pose data for sway analysis")

        # Convert to numpy arrays
        hip_x = np.array(hip_x)
        hip_y = np.array(hip_y)

        # Apply low-pass filter
        hip_x_filtered = self.apply_lowpass_filter(hip_x, cutoff=6.0, fs=30.0)
        hip_y_filtered = self.apply_lowpass_filter(hip_y, cutoff=6.0, fs=30.0)

        # Calculate standard deviations
        sway_std_x = float(np.std(hip_x_filtered))
        sway_std_y = float(np.std(hip_y_filtered))

        # Calculate path length (sum of distances between consecutive points)
        path_length = 0.0
        for i in range(1, len(hip_x_filtered)):
            dx = hip_x_filtered[i] - hip_x_filtered[i-1]
            dy = hip_y_filtered[i] - hip_y_filtered[i-1]
            path_length += np.sqrt(dx**2 + dy**2)

        # Normalize by height proxy and convert to cm
        # Assuming frame width represents ~1.5m, so multiply by 150cm
        cm_factor = 150.0
        if height_proxy and height_proxy > 0:
            path_length_cm = (path_length / height_proxy) * cm_factor
        else:
            path_length_cm = path_length * cm_factor

        # Calculate velocity
        sway_velocity = path_length_cm / duration if duration > 0 else 0

        return {
            "swayStdX": sway_std_x,
            "swayStdY": sway_std_y,
            "swayPathLength": path_length_cm,
            "swayVelocity": sway_velocity
        }

    def calculate_arm_metrics(self, frames_data: List[Dict]) -> Dict[str, float]:
        """
        Calculate arm excursion and asymmetry metrics

        Returns:
            {
                "armExcursionLeft": float,
                "armExcursionRight": float,
                "armAsymmetryRatio": float,
                "correctionsCount": int
            }
        """
        LEFT_WRIST = 15
        RIGHT_WRIST = 16
        LEFT_SHOULDER = 11
        RIGHT_SHOULDER = 12
        LEFT_HIP = 23
        RIGHT_HIP = 24

        left_wrist_positions = []
        right_wrist_positions = []
        hip_deviations = []

        for frame in frames_data:
            if not frame["landmarks"]:
                continue

            landmarks = frame["landmarks"]

            # Wrist positions relative to shoulders
            left_wrist = landmarks[LEFT_WRIST]
            right_wrist = landmarks[RIGHT_WRIST]
            left_shoulder = landmarks[LEFT_SHOULDER]
            right_shoulder = landmarks[RIGHT_SHOULDER]

            # Calculate relative positions
            left_rel_x = abs(left_wrist["x"] - left_shoulder["x"])
            left_rel_y = abs(left_wrist["y"] - left_shoulder["y"])
            right_rel_x = abs(right_wrist["x"] - right_shoulder["x"])
            right_rel_y = abs(right_wrist["y"] - right_shoulder["y"])

            left_distance = np.sqrt(left_rel_x**2 + left_rel_y**2)
            right_distance = np.sqrt(right_rel_x**2 + right_rel_y**2)

            left_wrist_positions.append(left_distance)
            right_wrist_positions.append(right_distance)

            # Hip position for corrections count
            left_hip = landmarks[LEFT_HIP]
            right_hip = landmarks[RIGHT_HIP]
            hip_x = (left_hip["x"] + right_hip["x"]) / 2
            hip_deviations.append(hip_x)

        # Arm excursion = range of movement
        arm_excursion_left = float(np.ptp(left_wrist_positions)) if left_wrist_positions else 0
        arm_excursion_right = float(np.ptp(right_wrist_positions)) if right_wrist_positions else 0

        # Asymmetry ratio
        if arm_excursion_right > 0:
            arm_asymmetry = arm_excursion_left / arm_excursion_right
        else:
            arm_asymmetry = 1.0 if arm_excursion_left == 0 else float('inf')

        # Corrections count (threshold crossings)
        corrections_count = self._count_threshold_crossings(hip_deviations)

        return {
            "armExcursionLeft": arm_excursion_left,
            "armExcursionRight": arm_excursion_right,
            "armAsymmetryRatio": arm_asymmetry,
            "correctionsCount": corrections_count
        }

    def _count_threshold_crossings(self, positions: List[float], threshold_std: float = 2.0) -> int:
        """
        Count number of times position exceeds threshold and returns

        Args:
            positions: List of position values
            threshold_std: Threshold in standard deviations

        Returns:
            Number of corrections
        """
        if len(positions) < 10:
            return 0

        positions_array = np.array(positions)
        mean = np.mean(positions_array)
        std = np.std(positions_array)
        threshold = threshold_std * std

        corrections = 0
        outside_threshold = False

        for pos in positions_array:
            deviation = abs(pos - mean)

            if deviation > threshold:
                if not outside_threshold:
                    corrections += 1
                    outside_threshold = True
            else:
                outside_threshold = False

        return corrections

    def calculate_stability_score(
        self,
        sway_metrics: Dict[str, float],
        arm_metrics: Dict[str, float],
        duration: float,
        max_duration: float = 20.0
    ) -> float:
        """
        Calculate composite stability score (0-100)

        Higher score = better stability

        Args:
            sway_metrics: From calculate_sway_metrics
            arm_metrics: From calculate_arm_metrics
            duration: Test duration in seconds
            max_duration: Maximum possible duration

        Returns:
            Stability score (0-100)
        """
        # Normalize metrics to 0-1 scale
        # These values are empirically derived - may need calibration

        # Sway velocity: 0-20 cm/s typical range
        sway_score = min(sway_metrics["swayVelocity"] / 20.0, 1.0)

        # Arm excursion: 0-0.5 typical range
        arm_score = min(
            (arm_metrics["armExcursionLeft"] + arm_metrics["armExcursionRight"]) / 1.0,
            1.0
        )

        # Corrections: 0-10 typical range
        corrections_score = min(arm_metrics["correctionsCount"] / 10.0, 1.0)

        # Duration penalty: shorter duration = lower score
        duration_score = duration / max_duration

        # Weights (sum to 1.0)
        w_sway = 0.35
        w_arm = 0.25
        w_corrections = 0.20
        w_duration = 0.20

        # Calculate composite (invert bad metrics, use duration as-is)
        quality_score = (
            w_duration * duration_score +
            w_sway * (1 - sway_score) +
            w_arm * (1 - arm_score) +
            w_corrections * (1 - corrections_score)
        )

        # Scale to 0-100
        stability_score = quality_score * 100

        return round(stability_score, 2)

    def save_raw_keypoints(self, frames_data: List[Dict], assessment_id: str) -> str:
        """
        Save raw landmark data to Firebase Storage

        Args:
            frames_data: Full landmark data from extract_landmarks_from_video
            assessment_id: Assessment ID for path generation

        Returns:
            Storage path
        """
        # Prepare data for storage
        keypoints_data = {
            "assessmentId": assessment_id,
            "totalFrames": len(frames_data),
            "frames": frames_data
        }

        # Upload to storage
        storage_path = storage_service.upload_json(
            data=keypoints_data,
            assessment_id=assessment_id,
            filename="raw_keypoints.json"
        )

        return storage_path


# Global instance
mediapipe_service = MediaPipeService()
