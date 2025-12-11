import { useEffect, useRef, useState } from 'react';
import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';

const useMediaPipe = (videoElement, canvasElement, enabled = true) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const poseRef = useRef(null);
  const cameraRef = useRef(null);
  const canvasCtxRef = useRef(null);

  useEffect(() => {
    if (!enabled || !videoElement || !canvasElement) {
      return;
    }

    const initMediaPipe = async () => {
      try {
        // Initialize canvas context
        canvasCtxRef.current = canvasElement.getContext('2d');

        // Initialize Pose
        const pose = new Pose({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
          },
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        pose.onResults(onResults);

        poseRef.current = pose;

        // Initialize Camera
        if (videoElement) {
          const camera = new Camera(videoElement, {
            onFrame: async () => {
              if (poseRef.current && videoElement) {
                await poseRef.current.send({ image: videoElement });
              }
            },
            width: 1280,
            height: 720,
          });

          cameraRef.current = camera;
          await camera.start();
          setIsReady(true);
        }
      } catch (err) {
        console.error('Error initializing MediaPipe:', err);
        setError('Failed to initialize pose detection');
      }
    };

    const onResults = (results) => {
      if (!canvasCtxRef.current || !canvasElement) return;

      const ctx = canvasCtxRef.current;
      const width = canvasElement.width;
      const height = canvasElement.height;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      if (results.poseLandmarks) {
        // Draw skeleton
        drawSkeleton(ctx, results.poseLandmarks, width, height);
      }
    };

    initMediaPipe();

    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      if (poseRef.current) {
        poseRef.current.close();
      }
    };
  }, [videoElement, canvasElement, enabled]);

  const drawSkeleton = (ctx, landmarks, width, height) => {
    // Define connections between landmarks
    const connections = [
      // Face
      [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
      // Upper body
      [9, 10], [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21],
      [12, 14], [14, 16], [16, 18], [16, 20], [16, 22],
      // Torso
      [11, 23], [12, 24], [23, 24],
      // Lower body
      [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
      [24, 26], [26, 28], [28, 30], [28, 32], [30, 32],
    ];

    // Draw connections
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;

    connections.forEach(([start, end]) => {
      const startLandmark = landmarks[start];
      const endLandmark = landmarks[end];

      if (startLandmark && endLandmark) {
        ctx.beginPath();
        ctx.moveTo(startLandmark.x * width, startLandmark.y * height);
        ctx.lineTo(endLandmark.x * width, endLandmark.y * height);
        ctx.stroke();
      }
    });

    // Draw landmarks
    ctx.fillStyle = '#FF0000';
    landmarks.forEach((landmark) => {
      ctx.beginPath();
      ctx.arc(landmark.x * width, landmark.y * height, 5, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  return {
    isReady,
    error,
  };
};

export default useMediaPipe;
