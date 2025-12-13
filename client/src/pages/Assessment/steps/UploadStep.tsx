import { useState, useEffect } from 'react';
import { Box, Typography, LinearProgress, Alert, CircularProgress } from '@mui/material';
import { useFirebaseUpload } from '../../../hooks/useFirebaseUpload';
import assessmentsService from '../../../services/assessments';
import { useSnackbar } from '../../../contexts/SnackbarContext';
import { TestType, LegTested, ClientMetrics } from '../../../types/assessment';
import { TestResult } from '../../../types/balanceTest';
import { printMetricsComparison } from '../../../utils/metricsComparison';

interface UploadStepProps {
  athleteId: string;
  videoBlob: Blob | null;
  videoDuration: number;
  testType: TestType;
  legTested: LegTested;
  testResult?: TestResult | null;
  onComplete: (assessmentId: string) => void;
}

export const UploadStep: React.FC<UploadStepProps> = ({
  athleteId,
  videoBlob,
  videoDuration,
  testType,
  legTested,
  testResult,
  onComplete,
}) => {
  const { showSnackbar } = useSnackbar();
  const { upload, progress, uploading } = useFirebaseUpload();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!videoBlob) {
      setError('No video to upload');
      return;
    }

    // Log metrics comparison (normalized vs world landmarks) to console
    if (testResult?.landmarkHistory && testResult.landmarkHistory.length > 0) {
      console.log('\n🔬 METRICS COMPARISON - Check console for normalized vs world landmark analysis');
      printMetricsComparison(testResult.landmarkHistory, testResult.holdTime);
    }

    async function uploadAndSave() {
      try {
        // Upload to Firebase Storage
        const { url, path } = await upload(videoBlob!, athleteId);

        setSaving(true);

        // Build client metrics from test result (now includes all sway/stability metrics)
        const clientMetrics: ClientMetrics | undefined = testResult
          ? {
              success: testResult.success,
              holdTime: testResult.holdTime,
              failureReason: testResult.failureReason,
              armDeviationLeft: testResult.armDeviationLeft,
              armDeviationRight: testResult.armDeviationRight,
              armAsymmetryRatio: testResult.armAsymmetryRatio,
              swayStdX: testResult.swayStdX,
              swayStdY: testResult.swayStdY,
              swayPathLength: testResult.swayPathLength,
              swayVelocity: testResult.swayVelocity,
              correctionsCount: testResult.correctionsCount,
              stabilityScore: testResult.stabilityScore,
            }
          : undefined;

        // Submit to backend - now completes immediately (no polling needed)
        const result = await assessmentsService.analyzeVideo({
          athleteId,
          testType,
          legTested,
          videoUrl: url,
          videoPath: path,
          duration: videoDuration,
          clientMetrics,
        });

        showSnackbar('Assessment saved!', 'success');
        onComplete(result.id);
      } catch (err: any) {
        setError(err.message || 'Upload failed');
        showSnackbar('Upload failed', 'error');
      } finally {
        setSaving(false);
      }
    }

    uploadAndSave();
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

      {!uploading && saving && (
        <>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Saving Assessment...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This should only take a moment
          </Typography>
        </>
      )}
    </Box>
  );
};
