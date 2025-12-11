import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
} from '@mui/material';
import { DropZone } from './components/DropZone';
import { LegTested } from '../../types/assessment';
import { UploadStep } from './steps/UploadStep';

export default function BackupUpload() {
  const { athleteId } = useParams<{ athleteId: string }>();
  const navigate = useNavigate();

  const [legTested, setLegTested] = useState<LegTested>('left');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [uploading, setUploading] = useState(false);

  if (!athleteId) {
    navigate('/athletes');
    return null;
  }

  const handleComplete = (assessmentId: string) => {
    navigate(`/assessments/${assessmentId}`);
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);

    // Extract video duration
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      setVideoDuration(video.duration);
    };

    video.src = URL.createObjectURL(file);
  };

  if (uploading && selectedFile) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <UploadStep
          athleteId={athleteId}
          videoBlob={selectedFile}
          videoDuration={videoDuration}
          testType="one_leg_balance"
          legTested={legTested}
          onComplete={handleComplete}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Upload Video for Analysis
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Upload a pre-recorded one-leg balance test video
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Select Standing Leg
        </Typography>
        <ToggleButtonGroup
          value={legTested}
          exclusive
          onChange={(_, value) => value && setLegTested(value)}
          fullWidth
          sx={{ mb: 3 }}
        >
          <ToggleButton value="left">Left Leg</ToggleButton>
          <ToggleButton value="right">Right Leg</ToggleButton>
        </ToggleButtonGroup>

        <Typography variant="subtitle1" gutterBottom>
          Select Video File
        </Typography>
        <DropZone onFileSelect={handleFileSelect} />

        {selectedFile && (
          <Alert severity="info" sx={{ mt: 2 }}>
            File selected: {selectedFile.name}
          </Alert>
        )}
      </Paper>

      <Box display="flex" gap={2}>
        <Button variant="outlined" onClick={() => navigate('/athletes')}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => setUploading(true)}
          disabled={!selectedFile}
          sx={{ flex: 1 }}
        >
          Upload and Analyze
        </Button>
      </Box>
    </Container>
  );
}
