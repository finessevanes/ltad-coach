import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Paper,
  CircularProgress,
} from '@mui/material';
import { VideoCall, Videocam } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import useCamera from '../hooks/useCamera';
import CameraPreview from '../components/Assessment/CameraPreview';
import { generateRoute } from '../utils/routes';
import api from '../services/api';

const CameraSetupPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    stream,
    devices,
    selectedDeviceId,
    error: cameraError,
    isLoading: cameraLoading,
    videoRef,
    startCamera,
    switchCamera,
  } = useCamera();

  const [athlete, setAthlete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAthlete();
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

  const handleStartCamera = async () => {
    try {
      await startCamera();
    } catch (err) {
      // Error is already handled by useCamera hook
    }
  };

  const handleDeviceChange = async (event) => {
    await switchCamera(event.target.value);
  };

  const handleStartRecording = () => {
    if (stream) {
      navigate(generateRoute.recording(id), { state: { stream } });
    }
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
        Camera Setup
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Athlete: {athlete.name}
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        {cameraError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {cameraError}
          </Alert>
        )}

        {!stream && (
          <Box textAlign="center" py={4}>
            <Videocam sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Camera Access Required
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              To record an assessment, we need access to your camera. Click the button
              below to grant permission.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<VideoCall />}
              onClick={handleStartCamera}
              disabled={cameraLoading}
            >
              {cameraLoading ? 'Starting Camera...' : 'Enable Camera'}
            </Button>
          </Box>
        )}

        {stream && (
          <>
            <Box sx={{ mb: 3 }}>
              <CameraPreview videoRef={videoRef} stream={stream} showFramingGuide />
            </Box>

            {devices.length > 1 && (
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Camera Source</InputLabel>
                <Select
                  value={selectedDeviceId || ''}
                  onChange={handleDeviceChange}
                  label="Camera Source"
                >
                  {devices.map((device) => (
                    <MenuItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${device.deviceId.substring(0, 5)}...`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Alert severity="info" sx={{ mb: 2 }}>
              Position the athlete so their full body is visible within the frame. Make sure
              there is good lighting and a clear background.
            </Alert>

            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              startIcon={<VideoCall />}
              onClick={handleStartRecording}
            >
              Start Recording
            </Button>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default CameraSetupPage;
