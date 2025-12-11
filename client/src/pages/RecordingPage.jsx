import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Stop, FiberManualRecord } from '@mui/icons-material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import useCamera from '../hooks/useCamera';
import useVideoRecording from '../hooks/useVideoRecording';
import SkeletonOverlay from '../components/Assessment/SkeletonOverlay';
import CountdownTimer from '../components/Assessment/CountdownTimer';
import { generateRoute } from '../utils/routes';
import api from '../services/api';

const COUNTDOWN_DURATION = 3; // 3 seconds countdown
const RECORDING_DURATION = 20; // 20 seconds recording

const RecordingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [athlete, setAthlete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(COUNTDOWN_DURATION);
  const [recordingTime, setRecordingTime] = useState(RECORDING_DURATION);
  const [phase, setPhase] = useState('ready'); // 'ready', 'countdown', 'recording', 'complete'

  const { stream, videoRef, startCamera } = useCamera();
  const {
    isRecording,
    recordedBlob,
    error: recordingError,
    startRecording,
    stopRecording,
  } = useVideoRecording(stream);

  useEffect(() => {
    fetchAthlete();
    initializeCamera();
  }, [id]);

  const fetchAthlete = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/athletes/${id}`);
      setAthlete(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load athlete');
    } finally {
      setLoading(false);
    }
  };

  const initializeCamera = async () => {
    try {
      await startCamera();
    } catch (err) {
      setError('Failed to initialize camera');
    }
  };

  // Countdown timer
  useEffect(() => {
    if (phase === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'countdown' && countdown === 0) {
      // Start recording after countdown
      setPhase('recording');
      startRecording();
    }
  }, [phase, countdown, startRecording]);

  // Recording timer
  useEffect(() => {
    if (phase === 'recording' && isRecording && recordingTime > 0) {
      const timer = setTimeout(() => {
        setRecordingTime(recordingTime - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'recording' && recordingTime === 0) {
      // Auto-stop recording
      handleStopRecording();
    }
  }, [phase, isRecording, recordingTime]);

  // Navigate to preview when recording is complete
  useEffect(() => {
    if (recordedBlob) {
      navigate(generateRoute.recordingPreview(id), {
        state: { recordedBlob, athleteName: athlete?.name },
      });
    }
  }, [recordedBlob, id, navigate, athlete]);

  const handleStartCountdown = () => {
    setPhase('countdown');
    setCountdown(COUNTDOWN_DURATION);
  };

  const handleStopRecording = () => {
    stopRecording();
    setPhase('complete');
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !athlete) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Athlete not found'}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Recording Assessment
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Athlete: {athlete.name}
      </Typography>

      {(error || recordingError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || recordingError}
        </Alert>
      )}

      <Box sx={{ mt: 3, position: 'relative' }}>
        {/* Video preview with skeleton overlay */}
        <SkeletonOverlay videoRef={videoRef} enabled={phase === 'recording'} />

        {/* Countdown overlay */}
        {phase === 'countdown' && <CountdownTimer seconds={countdown} variant="countdown" />}

        {/* Recording timer */}
        {phase === 'recording' && (
          <CountdownTimer seconds={recordingTime} variant="recording" />
        )}

        {/* Recording indicator */}
        {isRecording && (
          <Box
            sx={{
              position: 'absolute',
              top: 20,
              left: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              px: 2,
              py: 1,
              borderRadius: 1,
              zIndex: 10,
            }}
          >
            <FiberManualRecord sx={{ color: 'red', fontSize: 20 }} />
            <Typography variant="body2" color="white">
              RECORDING
            </Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
        {phase === 'ready' && (
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<FiberManualRecord />}
            onClick={handleStartCountdown}
            disabled={!stream}
          >
            Start Recording
          </Button>
        )}

        {phase === 'countdown' && (
          <Alert severity="info" sx={{ width: '100%' }}>
            Get ready! Recording will start in {countdown}...
          </Alert>
        )}

        {phase === 'recording' && (
          <Button
            variant="contained"
            color="error"
            size="large"
            startIcon={<Stop />}
            onClick={handleStopRecording}
          >
            Stop Recording
          </Button>
        )}

        {phase === 'complete' && (
          <Alert severity="success" sx={{ width: '100%' }}>
            Recording complete! Preparing preview...
          </Alert>
        )}
      </Box>

      {phase === 'ready' && (
        <Alert severity="info" sx={{ mt: 2 }}>
          When you click "Start Recording", there will be a 3-second countdown before the
          20-second recording begins. Make sure the athlete is positioned within the frame.
        </Alert>
      )}
    </Container>
  );
};

export default RecordingPage;
