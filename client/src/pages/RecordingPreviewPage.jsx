import { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Alert,
  LinearProgress,
  Paper,
} from '@mui/material';
import { Send, Replay, CheckCircle } from '@mui/icons-material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import VideoPlayer from '../components/Assessment/VideoPlayer';
import { generateRoute } from '../utils/routes';
import api from '../services/api';

const RecordingPreviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { recordedBlob, athleteName } = location.state || {};

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleAnalyze = async () => {
    if (!recordedBlob) {
      setError('No recording available');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);

      // Create FormData for video upload
      const formData = new FormData();
      formData.append('video', recordedBlob, 'assessment-video.webm');
      formData.append('athlete_id', id);

      // Upload video
      const uploadResponse = await api.post('/api/assessments/upload-video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      });

      const { assessment_id } = uploadResponse.data;

      // Trigger analysis
      await api.post('/api/assessments/analyze', {
        assessment_id,
      });

      setSuccess(true);

      // Navigate to results after a short delay
      setTimeout(() => {
        navigate(generateRoute.assessmentResults(assessment_id));
      }, 2000);
    } catch (err) {
      console.error('Upload/analysis error:', err);
      setError(err.message || 'Failed to upload and analyze video');
      setUploading(false);
    }
  };

  const handleReshoot = () => {
    navigate(generateRoute.cameraSetup(id));
  };

  if (!recordedBlob) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">No recording found. Please record a video first.</Alert>
        <Button
          variant="contained"
          onClick={() => navigate(generateRoute.cameraSetup(id))}
          sx={{ mt: 2 }}
        >
          Go to Camera Setup
        </Button>
      </Container>
    );
  }

  if (success) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Analysis Started!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your video has been uploaded and analysis is in progress. Redirecting to results...
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Review Recording
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Athlete: {athleteName}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mt: 3 }}>
        <VideoPlayer videoBlob={recordedBlob} controls />
      </Box>

      {uploading && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" gutterBottom>
            Uploading and analyzing video... {uploadProgress}%
          </Typography>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      )}

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<Replay />}
          onClick={handleReshoot}
          disabled={uploading}
          size="large"
        >
          Reshoot
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Send />}
          onClick={handleAnalyze}
          disabled={uploading}
          size="large"
        >
          {uploading ? 'Uploading...' : 'Analyze Video'}
        </Button>
      </Box>

      <Alert severity="info" sx={{ mt: 2 }}>
        Review the recording above. If you're satisfied, click "Analyze Video" to process
        the assessment. Otherwise, click "Reshoot" to record again.
      </Alert>
    </Container>
  );
};

export default RecordingPreviewPage;
