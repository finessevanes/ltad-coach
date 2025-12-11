import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Alert,
  LinearProgress,
  Paper,
} from '@mui/material';
import { Send, CheckCircle } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import FileUploader from '../components/Assessment/FileUploader';
import { generateRoute } from '../utils/routes';
import api from '../services/api';

const UploadVideoPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [athlete, setAthlete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

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

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a video file');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);

      // Create FormData for video upload
      const formData = new FormData();
      formData.append('video', selectedFile);
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
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload video');
      setUploading(false);
    }
  };

  if (success) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Upload Successful!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your video has been uploaded and analysis is in progress. Redirecting to results...
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Upload Video
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Athlete: {athlete?.name || 'Loading...'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mt: 3 }}>
        <FileUploader onFileSelect={handleFileSelect} />

        {uploading && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" gutterBottom>
              Uploading and analyzing video... {uploadProgress}%
            </Typography>
            <LinearProgress variant="determinate" value={uploadProgress} />
          </Box>
        )}

        <Button
          variant="contained"
          color="primary"
          size="large"
          fullWidth
          startIcon={<Send />}
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          sx={{ mt: 3 }}
        >
          {uploading ? 'Uploading...' : 'Upload and Analyze'}
        </Button>
      </Paper>

      <Alert severity="info" sx={{ mt: 2 }}>
        Upload a pre-recorded video of the athlete performing athletic movements. The video
        will be analyzed to assess their performance and development.
      </Alert>
    </Container>
  );
};

export default UploadVideoPage;
