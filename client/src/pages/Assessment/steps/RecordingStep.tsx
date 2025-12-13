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
  Replay as ReplayIcon,
} from '@mui/icons-material';
import { useCamera } from '../../../hooks/useCamera';
import { useMediaPipe } from '../../../hooks/useMediaPipe';
import { useVideoRecorder } from '../../../hooks/useVideoRecorder';
import { useBalanceTest } from '../../../hooks/useBalanceTest';
import { VideoPreview } from '../components/VideoPreview';
import { CameraSelector } from '../components/CameraSelector';
import { BalanceTestOverlay } from '../../../components/BalanceTestOverlay';
import { TestType, LegTested } from '../../../types/assessment';
import { TestResult } from '../../../types/balanceTest';

type RecordingPhase = 'setup' | 'testing';

const COMPOSITE_FPS = 30;

interface RecordingStepProps {
  athleteId: string;
  selectedDevice: string | null;
  onDeviceSelect: (deviceId: string) => void;
  testType: TestType;
  legTested: LegTested;
  onRecordingComplete: (blob: Blob, duration: number, testResult?: TestResult) => void;
  onBack: () => void;
}

export const RecordingStep: React.FC<RecordingStepProps> = ({
  selectedDevice: parentSelectedDevice,
  onDeviceSelect,
  legTested: parentLegTested,
  onRecordingComplete,
  onBack,
}) => {
  const [phase, setPhase] = useState<RecordingPhase>('setup');
  const [compositeStream, setCompositeStream] = useState<MediaStream | null>(null);
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

  // MediaPipe hook - skeleton + leg tested state
  const {
    loading: mpLoading,
    error: mpError,
    poseResult,
    fps,
    isPersonDetected,
    canvasRef,
    legTested,
    setLegTested,
  } = useMediaPipe(videoRef, true);

  // Sync legTested from parent prop
  useEffect(() => {
    setLegTested(parentLegTested);
  }, [parentLegTested, setLegTested]);

  // Balance test state machine - debug mode enabled
  const {
    testState,
    holdTime,
    failureReason,
    positionStatus,
    testResult,
    debugInfo,
    startTest,
    resetTest,
  } = useBalanceTest(poseResult, legTested, { debug: true });

  // Create composite canvas for recording video + skeleton
  const compositeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const compositeStreamRef = useRef<MediaStream | null>(null);
  const compositeAnimationRef = useRef<number>(0);

  const { startRecording, stopRecording, videoBlob } = useVideoRecorder(compositeStream);

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

    if (!video || !compositeCanvas || phase !== 'testing') {
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

  // Start composite rendering when in testing phase
  useEffect(() => {
    if (phase === 'testing') {
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

  // Start Test button - enter testing phase and start recording
  const handleStartTest = useCallback(() => {
    if (!isPersonDetected) return;
    setPhase('testing');
    startRecording();
    startTest();
  }, [isPersonDetected, startRecording, startTest]);

  // Stop recording when test completes or fails
  useEffect(() => {
    if (testState === 'completed' || testState === 'failed') {
      stopRecording();
    }
  }, [testState, stopRecording]);

  // Handle recording complete - pass blob and test result to parent
  useEffect(() => {
    if (videoBlob && testResult) {
      onRecordingComplete(videoBlob, testResult.holdTime, testResult);
    }
  }, [videoBlob, testResult, onRecordingComplete]);

  // Reset and try again
  const handleTryAgain = useCallback(() => {
    resetTest();
    setPhase('setup');
  }, [resetTest]);

  // Cancel test (go back to setup without completing)
  const handleCancelTest = useCallback(() => {
    stopRecording();
    resetTest();
    setPhase('setup');
  }, [stopRecording, resetTest]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
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

  const isTestActive = testState === 'ready' || testState === 'holding';
  const isTestEnded = testState === 'completed' || testState === 'failed';

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

        {/* Balance Test Overlay - during testing phase */}
        {phase === 'testing' && (
          <BalanceTestOverlay
            testState={testState}
            holdTime={holdTime}
            failureReason={failureReason}
            positionStatus={positionStatus}
            debugInfo={debugInfo}
          />
        )}

        {/* Recording indicator - during active test */}
        {phase === 'testing' && isTestActive && (
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              zIndex: 15,
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
        )}

        {/* Status Chips - top-right corner */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            gap: 1,
            zIndex: 15,
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
              <li>Camera should be at athlete&apos;s chest height</li>
              <li>Athlete should raise their {legTested} foot for this test</li>
            </ul>
          </AccordionDetails>
        </Accordion>
      )}

      <Box display="flex" justifyContent="center" gap={2}>
        {/* Setup phase buttons */}
        {phase === 'setup' && (
          <>
            <Button variant="outlined" onClick={onBack}>
              Back
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="large"
              disabled={ loading}
              onClick={handleStartTest}
            >
              {'Start Test'}
            </Button>
          </>
        )}

        {/* Testing phase - active test buttons */}
        {phase === 'testing' && isTestActive && (
          <Button
            variant="contained"
            color="error"
            size="large"
            startIcon={<StopIcon />}
            onClick={handleCancelTest}
          >
            Cancel Test
          </Button>
        )}

        {/* Testing phase - test ended buttons */}
        {phase === 'testing' && isTestEnded && (
          <>
            <Button
              variant="outlined"
              size="large"
              startIcon={<ReplayIcon />}
              onClick={handleTryAgain}
            >
              Try Again
            </Button>
            {/* Note: Continue button could be added here if needed */}
          </>
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
            : `Ready to start! Click "Start Test" - the timer will begin when the athlete holds the ${legTested}-foot balance position for 1 second.`}
        </Typography>
      )}
    </Box>
  );
};
