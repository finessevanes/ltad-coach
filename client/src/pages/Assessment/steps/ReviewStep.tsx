import { Paper, Typography, Box, Button } from '@mui/material';
import { Replay as ReplayIcon, CheckCircle as CheckIcon } from '@mui/icons-material';
import { useMemo } from 'react';

interface ReviewStepProps {
  videoBlob: Blob | null;
  onReshoot: () => void;
  onContinue: () => void;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  videoBlob,
  onReshoot,
  onContinue,
}) => {
  const videoUrl = useMemo(() => {
    if (!videoBlob) return null;
    return URL.createObjectURL(videoBlob);
  }, [videoBlob]);

  if (!videoUrl) {
    return (
      <Box textAlign="center" py={4}>
        <Typography>No video recorded</Typography>
        <Button onClick={onReshoot} sx={{ mt: 2 }}>
          Back to Recording
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Recording Complete
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Review the recording below
      </Typography>

      <Paper
        sx={{
          width: '100%',
          aspectRatio: '16/9',
          overflow: 'hidden',
          bgcolor: 'black',
          mb: 3,
        }}
      >
        <video
          src={videoUrl}
          controls
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </Paper>

      <Box display="flex" gap={2}>
        <Button
          variant="outlined"
          startIcon={<ReplayIcon />}
          onClick={onReshoot}
          sx={{ flex: 1 }}
        >
          Reshoot
        </Button>
        <Button
          variant="contained"
          startIcon={<CheckIcon />}
          onClick={onContinue}
          sx={{ flex: 1 }}
        >
          Continue
        </Button>
      </Box>
    </Box>
  );
};
