"""Signal filtering utilities."""

import numpy as np
from scipy import signal
from typing import List, Tuple


def butter_lowpass_filter(
    data: np.ndarray,
    cutoff: float = 2.0,
    fs: float = 30.0,
    order: int = 2,
) -> np.ndarray:
    """Apply Butterworth low-pass filter to smooth data.

    Args:
        data: Input signal (1D array)
        cutoff: Cutoff frequency in Hz
        fs: Sampling frequency in Hz
        order: Filter order

    Returns:
        Filtered signal
    """
    nyquist = 0.5 * fs
    normal_cutoff = cutoff / nyquist

    # Design filter
    b, a = signal.butter(order, normal_cutoff, btype='low', analog=False)

    # Pad data to avoid edge effects
    pad_length = min(len(data) - 1, 10)
    if pad_length > 0:
        padded = np.pad(data, (pad_length, pad_length), mode='edge')
        filtered_padded = signal.filtfilt(b, a, padded)
        filtered = filtered_padded[pad_length:-pad_length]
    else:
        filtered = signal.filtfilt(b, a, data)

    return filtered


def filter_landmarks(
    landmarks: List[List[Tuple[float, float, float, float]]],
    fps: float = 30.0,
) -> List[List[Tuple[float, float, float, float]]]:
    """Apply low-pass filter to landmark trajectories.

    Args:
        landmarks: List of frames, each frame is list of (x, y, z, visibility) tuples
        fps: Frames per second

    Returns:
        Filtered landmarks in same format
    """
    if not landmarks or len(landmarks) < 3:
        return landmarks

    num_frames = len(landmarks)
    num_landmarks = len(landmarks[0])

    # Extract x, y coordinates into arrays
    x_coords = np.array([[lm[0] for lm in frame] for frame in landmarks])  # (frames, landmarks)
    y_coords = np.array([[lm[1] for lm in frame] for frame in landmarks])

    # Filter each landmark's trajectory
    filtered_x = np.zeros_like(x_coords)
    filtered_y = np.zeros_like(y_coords)

    for lm_idx in range(num_landmarks):
        filtered_x[:, lm_idx] = butter_lowpass_filter(x_coords[:, lm_idx], fs=fps)
        filtered_y[:, lm_idx] = butter_lowpass_filter(y_coords[:, lm_idx], fs=fps)

    # Reconstruct landmarks with filtered x, y and original z, visibility
    filtered_landmarks = []
    for frame_idx in range(num_frames):
        frame = []
        for lm_idx in range(num_landmarks):
            original = landmarks[frame_idx][lm_idx]
            filtered_lm = (
                filtered_x[frame_idx, lm_idx],
                filtered_y[frame_idx, lm_idx],
                original[2],  # Keep original z
                original[3],  # Keep original visibility
            )
            frame.append(filtered_lm)
        filtered_landmarks.append(frame)

    return filtered_landmarks
