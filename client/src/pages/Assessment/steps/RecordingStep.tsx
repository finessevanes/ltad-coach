import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Paper,
  Box,
  Button,
  Typography,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
} from '@mui/material';
import {
  Stop as StopIcon,
  CheckCircle as ReadyIcon,
  Videocam as CameraIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useCamera } from '../../../hooks/useCamera';
import { useMediaPipe } from '../../../hooks/useMediaPipe';
import { useVideoRecorder } from '../../../hooks/useVideoRecorder';
import { VideoPreview } from '../components/VideoPreview';
import { CountdownOverlay } from '../components/CountdownOverlay';
import { RecordingTimer } from '../components/RecordingTimer';
import { CameraSelector } from '../components/CameraSelector';
import { EarlyStopWarningModal } from '../components/EarlyStopWarningModal';
import { TestType, LegTested } from '../../../types/assessment';

type RecordingPhase = 'setup' | 'countdown' | 'recording';

const TEST_DURATION = 30; // seconds
const COMPOSITE_FPS = 30;
const MIN_RECORDING_DURATION = 5; // seconds - minimum before warning

interface RecordingStepProps {
  athleteId: string;
  selectedDevice: string | null;
  onDeviceSelect: (deviceId: string) => void;
  testType: TestType;
  legTested: LegTested;
  onRecordingComplete: (blob: Blob, duration: number) => void;
  onBack: () => void;
}

export const RecordingStep: React.FC<RecordingStepProps> = ({
  selectedDevice: parentSelectedDevice,
  onDeviceSelect,
  onRecordingComplete,
  onBack,
}) => {
  const [phase, setPhase] = useState<RecordingPhase>('setup');
  const [timeRemaining, setTimeRemaining] = useState(TEST_DURATION);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [compositeStream, setCompositeStream] = useState<MediaStream | null>(null);
  const [showEarlyStopWarning, setShowEarlyStopWarning] = useState(false);
  const [showPositioningTips, setShowPositioningTips] = useState(false);

  // Camera hook - manages device list and stream
  const {
    devices,
    selectedDevice,
    setSelectedDevice,
    error: cameraError,
    loading: cameraLoading,
    videoRef,
  } = useCamera(parentSelectedDevice);

  // MediaPipe hook - skeleton + validation
  const {
    loading: mpLoading,
    error: mpError,
    fps,
    isPersonDetected,
    canvasRef,
  } = useMediaPipe(videoRef, true);

  // Create composite canvas for recording video + skeleton
  const compositeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const compositeStreamRef = useRef<MediaStream | null>(null);
  const compositeAnimationRef = useRef<number>(0);

  const { startRecording, stopRecording, videoBlob } = useVideoRecorder(compositeStream);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const error = cameraError || mpError;
  const loading = cameraLoading || mpLoading;

  // Initialize composite canvas
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    compositeCanvasRef.current = canvas;

    // Get stream from composite canvas
    const stream = canvas.captureStream(COMPOSITE_FPS);
    compositeStreamRef.current = stream;
    setCompositeStream(stream);

    return () => {
      // Stop composite canvas stream
      if (compositeStreamRef.current) {
        compositeStreamRef.current.getTracks().forEach((track) => track.stop());
        compositeStreamRef.current = null;
      }
      if (compositeAnimationRef.current) {
        cancelAnimationFrame(compositeAnimationRef.current);
      }
    };
  }, []);

  // Composite render loop (draws video + skeleton to composite canvas)
  const renderComposite = useCallback(() => {
    const video = videoRef.current;
    const skeletonCanvas = canvasRef.current;
    const compositeCanvas = compositeCanvasRef.current;

    if (!video || !compositeCanvas || phase !== 'recording') {
      return;
    }

    const ctx = compositeCanvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame
    if (video.readyState >= 2) {
      ctx.drawImage(video, 0, 0, compositeCanvas.width, compositeCanvas.height);
    }

    // Draw skeleton overlay if available
    if (skeletonCanvas) {
      ctx.drawImage(skeletonCanvas, 0, 0, compositeCanvas.width, compositeCanvas.height);
    }

    compositeAnimationRef.current = requestAnimationFrame(renderComposite);
  }, [videoRef, canvasRef, phase]);

  // Start composite rendering when recording
  useEffect(() => {
    if (phase === 'recording') {
      renderComposite();
    } else {
      if (compositeAnimationRef.current) {
        cancelAnimationFrame(compositeAnimationRef.current);
      }
    }
  }, [phase, renderComposite]);

  // Camera device change - sync to parent
  const handleDeviceChange = (deviceId: string) => {
    setSelectedDevice(deviceId);
    onDeviceSelect(deviceId);
  };

  // Start Test button (setup → countdown)
  const handleStartTest = useCallback(() => {
    if (!isPersonDetected) return;
    setPhase('countdown');
  }, [isPersonDetected]);

  const handleCountdownComplete = useCallback(() => {
    setPhase('recording');
    setElapsedTime(0);
    startRecording();

    // Start 30-second timer
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          stopRecording();
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    timerRef.current = interval;
  }, [startRecording, stopRecording]);

  // Stop Early button click
  const handleStopEarly = useCallback(() => {
    if (elapsedTime < MIN_RECORDING_DURATION) {
      setShowEarlyStopWarning(true);
    } else {
      stopRecording();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, [elapsedTime, stopRecording]);

  // Early stop warning - confirm stop
  const handleConfirmEarlyStop = () => {
    setShowEarlyStopWarning(false);
    stopRecording();
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  // Early stop warning - cancel
  const handleCancelEarlyStop = () => {
    setShowEarlyStopWarning(false);
  };

  useEffect(() => {
    if (videoBlob) {
      onRecordingComplete(videoBlob, elapsedTime);
    }
  }, [videoBlob, elapsedTime, onRecordingComplete]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // Stop composite stream
      if (compositeStreamRef.current) {
        compositeStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      // Cancel animation frame
      if (compositeAnimationRef.current) {
        cancelAnimationFrame(compositeAnimationRef.current);
      }
    };
  }, []);

  // Auto-collapse positioning tips when person detected
  useEffect(() => {
    if (isPersonDetected) {
      setShowPositioningTips(false);
    }
  }, [isPersonDetected]);

  return (
    <Box>
      {/* Header - only show in setup phase */}
      {phase === 'setup' && (
        <Box mb={2}>
          <Typography variant="h5" gutterBottom>
            Recording Setup
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Select your camera and position the athlete in frame
          </Typography>
        </Box>
      )}

      {/* Error Alert */}
      {error && phase === 'setup' && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Camera Selector - only in setup phase */}
      {phase === 'setup' && (
        <Box mb={2}>
          <CameraSelector
            devices={devices}
            selectedDevice={selectedDevice}
            onSelect={handleDeviceChange}
            disabled={loading}
          />
        </Box>
      )}

      <Paper
        sx={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/9',
          overflow: 'hidden',
          bgcolor: 'black',
          mb: 3,
        }}
      >
        {/* Loading Overlay - only in setup */}
        {loading && phase === 'setup' && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0,0,0,0.7)',
              zIndex: 10,
            }}
          >
            <Box textAlign="center">
              <CircularProgress sx={{ mb: 2 }} />
              <Typography color="white">
                {cameraLoading ? 'Accessing camera...' : 'Loading pose detection...'}
              </Typography>
            </Box>
          </Box>
        )}

        <VideoPreview videoRef={videoRef} canvasRef={canvasRef} mirrored />

        {/* Person Positioning Guide - only when no person detected in setup */}
        {!isPersonDetected && phase === 'setup' && !loading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              zIndex: 3,
            }}
          >
            <Box
              sx={{
                width: '30%',
                height: '80%',
                border: '2px dashed rgba(255,255,255,0.5)',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography color="white" sx={{ opacity: 0.7 }}>
                Position athlete here
              </Typography>
            </Box>
          </Box>
        )}

        {phase === 'countdown' && (
          <CountdownOverlay onComplete={handleCountdownComplete} />
        )}

        {phase === 'recording' && (
          <>
            <RecordingTimer timeRemaining={timeRemaining} />
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                left: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                zIndex: 5,
              }}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: 'error.main',
                  animation: 'pulse 1s infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                  },
                }}
              />
              <Typography color="white" fontWeight="bold">
                REC
              </Typography>
            </Box>
          </>
        )}

        {/* Status Chips - top-right corner */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            gap: 1,
            zIndex: 5,
          }}
        >
          {/* FPS Chip - always visible */}
          <Chip
            size="small"
            label={`${fps} FPS`}
            color={fps >= 15 ? 'success' : 'warning'}
          />

          {/* Person Detection Chip - only in setup */}
          {phase === 'setup' && (
            <Chip
              size="small"
              icon={isPersonDetected ? <ReadyIcon /> : <CameraIcon />}
              label={isPersonDetected ? 'Ready' : 'No Person'}
              color={isPersonDetected ? 'success' : 'default'}
            />
          )}
        </Box>
      </Paper>

      {/* Positioning Tips Accordion - only in setup */}
      {phase === 'setup' && (
        <Accordion
          expanded={showPositioningTips}
          onChange={(_, expanded) => setShowPositioningTips(expanded)}
          sx={{ mb: 3 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body2">
              <InfoIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
              Positioning Tips
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>Full body should be visible in frame</li>
              <li>Ensure good lighting on the athlete</li>
              <li>Avoid busy backgrounds if possible</li>
              <li>Camera should be at athlete's chest height</li>
            </ul>
          </AccordionDetails>
        </Accordion>
      )}

      <Box display="flex" justifyContent="center" gap={2}>
        {phase === 'setup' && (
          <>
            <Button variant="outlined" onClick={onBack}>
              Back
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="large"
              disabled={!isPersonDetected || loading}
              onClick={handleStartTest}
            >
              {!isPersonDetected ? 'Waiting for Athlete...' : 'Start Test'}
            </Button>
          </>
        )}

        {phase === 'recording' && (
          <Button
            variant="contained"
            color="error"
            size="large"
            startIcon={<StopIcon />}
            onClick={handleStopEarly}
          >
            Stop Early
          </Button>
        )}
      </Box>

      {/* Helper Text - setup only */}
      {phase === 'setup' && (
        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
          sx={{ mt: 2 }}
        >
          {!isPersonDetected
            ? 'Position athlete in frame until green skeleton appears'
            : 'Ready to start! Click "Start Test" to begin the 30-second recording.'}
        </Typography>
      )}

      {/* Early Stop Warning Modal */}
      <EarlyStopWarningModal
        open={showEarlyStopWarning}
        elapsedTime={elapsedTime}
        onConfirm={handleConfirmEarlyStop}
        onCancel={handleCancelEarlyStop}
      />
    </Box>
  );
};
