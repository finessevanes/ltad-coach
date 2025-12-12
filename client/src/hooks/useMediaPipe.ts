import { useEffect, useRef, useState, useCallback } from 'react';
import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';
import { PoseResult } from '../types/mediapipe';
import { LegTested } from '../types/assessment';

interface UseMediaPipeResult {
  loading: boolean;
  error: string | null;
  poseResult: PoseResult | null;
  fps: number;
  isPersonDetected: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  legTested: LegTested;
  setLegTested: (leg: LegTested) => void;
}

export function useMediaPipe(
  videoRef: React.RefObject<HTMLVideoElement>,
  enabled: boolean = true
): UseMediaPipeResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [poseResult, setPoseResult] = useState<PoseResult | null>(null);
  const [fps, setFps] = useState(0);
  const [isPersonDetected, setIsPersonDetected] = useState(false);
  const [legTested, setLegTested] = useState<LegTested>('right');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const fpsCountRef = useRef<number>(0);

  // Initialize MediaPipe
  useEffect(() => {
    async function init() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm'
        );

        landmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
        });

        setLoading(false);
      } catch (err) {
        setError('Failed to load pose detection model');
        setLoading(false);
      }
    }

    init();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      // Close MediaPipe landmarker to free resources
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
    };
  }, []);

  // Detection loop
  const detectPose = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = landmarkerRef.current;

    if (!video || !canvas || !landmarker || !enabled) {
      animationRef.current = requestAnimationFrame(detectPose);
      return;
    }

    if (video.readyState < 2) {
      animationRef.current = requestAnimationFrame(detectPose);
      return;
    }

    const now = performance.now();

    // FPS calculation
    fpsCountRef.current++;
    if (now - lastTimeRef.current >= 1000) {
      setFps(fpsCountRef.current);
      fpsCountRef.current = 0;
      lastTimeRef.current = now;
    }

    // Detect pose
    const result = landmarker.detectForVideo(video, now);

    // Update canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (result.landmarks && result.landmarks.length > 0) {
        setIsPersonDetected(true);
        setPoseResult({
          landmarks: result.landmarks[0],
          worldLandmarks: result.worldLandmarks?.[0] || [],
        });

        // Draw skeleton
        const drawingUtils = new DrawingUtils(ctx);
        drawingUtils.drawLandmarks(result.landmarks[0], {
          radius: 3,
          color: '#00FF00',
        });
        drawingUtils.drawConnectors(
          result.landmarks[0],
          PoseLandmarker.POSE_CONNECTIONS,
          { color: '#00FF00', lineWidth: 2 }
        );
      } else {
        setIsPersonDetected(false);
        setPoseResult(null);
      }
    }

    animationRef.current = requestAnimationFrame(detectPose);
  }, [enabled, videoRef]);

  useEffect(() => {
    if (!loading && enabled) {
      animationRef.current = requestAnimationFrame(detectPose);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [loading, enabled, detectPose]);

  return {
    loading,
    error,
    poseResult,
    fps,
    isPersonDetected,
    canvasRef,
    legTested,
    setLegTested,
  };
}
