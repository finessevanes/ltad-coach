import { useState, useEffect, useRef } from 'react';
import { Box, Typography, LinearProgress, Alert, CircularProgress } from '@mui/material';
import { useFirebaseUpload } from '../../../hooks/useFirebaseUpload';
import assessmentsService from '../../../services/assessments';
import { useSnackbar } from '../../../contexts/SnackbarContext';
import { TestType, LegTested, ClientMetrics } from '../../../types/assessment';
import { TestResult } from '../../../types/balanceTest';

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
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    if (!videoBlob) {
      setError('No video to upload');
      return;
    }

    async function uploadAndSave() {
      try {
        // Upload to Firebase Storage
        const { url, path } = await upload(videoBlob!, athleteId);

        setSaving(true);

        // Build client metrics from test result (real-world units: cm, degrees)
        const clientMetrics: ClientMetrics | undefined = testResult
          ? {
              success: testResult.success,
              holdTime: testResult.holdTime,
              failureReason: testResult.failureReason,
              // Sway metrics (cm)
              swayStdX: testResult.swayStdX,
              swayStdY: testResult.swayStdY,
              swayPathLength: testResult.swayPathLength,
              swayVelocity: testResult.swayVelocity,
              correctionsCount: testResult.correctionsCount,
              // Arm metrics (degrees)
              armAngleLeft: testResult.armAngleLeft,
              armAngleRight: testResult.armAngleRight,
              armAsymmetryRatio: testResult.armAsymmetryRatio,
              // Temporal analysis
              temporal: testResult.temporal,
              // Enhanced temporal data for LLM
              fiveSecondSegments: testResult.fiveSecondSegments,
              events: testResult.events,
            }
          : undefined;

        // Submit to backend - now completes immediately (no polling needed)
        const result = await assessmentsService.analyzeVideo({
          athleteId,
          testType,
          legTested,
          leftVideoUrl: url,      // UPDATED: renamed from videoUrl
          leftVideoPath: path,     // UPDATED: renamed from videoPath
          leftDuration: videoDuration,  // UPDATED: renamed from duration
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
