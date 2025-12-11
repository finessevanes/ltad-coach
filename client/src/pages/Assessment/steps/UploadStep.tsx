import { useState, useEffect } from 'react';
import { Box, Typography, LinearProgress, Alert, CircularProgress } from '@mui/material';
import { useFirebaseUpload } from '../../../hooks/useFirebaseUpload';
import { useAssessmentPolling } from '../../../hooks/useAssessmentPolling';
import assessmentsService from '../../../services/assessments';
import { useSnackbar } from '../../../contexts/SnackbarContext';
import { TestType, LegTested } from '../../../types/assessment';

interface UploadStepProps {
  athleteId: string;
  videoBlob: Blob | null;
  videoDuration: number;
  testType: TestType;
  legTested: LegTested;
  onComplete: (assessmentId: string) => void;
}

export const UploadStep: React.FC<UploadStepProps> = ({
  athleteId,
  videoBlob,
  videoDuration,
  testType,
  legTested,
  onComplete,
}) => {
  const { showSnackbar } = useSnackbar();
  const { upload, progress, uploading } = useFirebaseUpload();
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { assessment } = useAssessmentPolling({
    assessmentId,
    enabled: !!assessmentId,
    onComplete: (result) => {
      showSnackbar('Analysis complete!', 'success');
      onComplete(result.id);
    },
    onFailed: (result) => {
      setError(result.failureReason || 'Analysis failed');
      showSnackbar('Analysis failed', 'error');
    },
    onTimeout: () => {
      setError('Analysis is taking longer than expected. Please check back shortly.');
    },
  });

  useEffect(() => {
    if (!videoBlob) {
      setError('No video to upload');
      return;
    }

    async function uploadAndAnalyze() {
      try {
        // Upload to Firebase Storage
        const { url, path } = await upload(videoBlob!, athleteId);

        // Trigger backend analysis
        const result = await assessmentsService.analyzeVideo({
          athleteId,
          testType,
          legTested,
          videoUrl: url,
          videoPath: path,
          duration: videoDuration,
        });

        setAssessmentId(result.id);
      } catch (err: any) {
        setError(err.message || 'Upload failed');
        showSnackbar('Upload failed', 'error');
      }
    }

    uploadAndAnalyze();
  }, []);

  if (error) {
    return (
      <Alert severity="error">
        <Typography variant="body2">{error}</Typography>
      </Alert>
    );
  }

  return (
    <Box textAlign="center" py={4}>
      {uploading && (
        <>
          <Typography variant="h6" gutterBottom>
            Uploading Video...
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progress?.percentage || 0}
            sx={{ my: 3, maxWidth: 400, mx: 'auto' }}
          />
          <Typography variant="body2" color="text.secondary">
            {Math.round(progress?.percentage || 0)}%
          </Typography>
        </>
      )}

      {!uploading && assessmentId && (
        <>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Analyzing Video...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This may take up to 30 seconds
          </Typography>
          {assessment && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Status: {assessment.status}
            </Typography>
          )}
        </>
      )}
    </Box>
  );
};
