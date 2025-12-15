import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Alert,
  Button,
  Card,
  CardContent,
  Stack,
  Divider,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDualLegUpload, LegTestData } from '../../../hooks/useDualLegUpload';
import { useAssessmentSubmission } from '../../../hooks/useAssessmentSubmission';

interface UploadResult {
  url: string;
  path: string;
}

interface DualLegUploadViewProps {
  athleteId: string;
  leftLegData: LegTestData;
  rightLegData: LegTestData;
  onComplete?: (assessmentId: string) => void;
}

/**
 * Presentation component for dual-leg video upload and assessment submission.
 * Displays upload progress and status, delegating business logic to custom hooks.
 *
 * This component is a thin UI wrapper around:
 * - useDualLegUpload: Orchestrates upload workflow
 * - useAssessmentSubmission: Handles backend submission logic
 */
export const DualLegUploadView: React.FC<DualLegUploadViewProps> = ({
  athleteId,
  leftLegData,
  rightLegData,
  onComplete,
}) => {
  const navigate = useNavigate();
  const { submit } = useAssessmentSubmission();

  // Orchestrate upload workflow
  const { phase, leftProgress, rightProgress, error, assessmentId, start, retry } = useDualLegUpload({
    athleteId,
    leftLegData,
    rightLegData,
    onSubmitAssessment: (leftResult: UploadResult, rightResult: UploadResult) =>
      submit(athleteId, leftLegData, rightLegData, leftResult, rightResult),
  });

  // Auto-start upload on mount
  useEffect(() => {
    start().catch((err) => {
      console.warn('[DualLegUploadView] Start failed:', err);
    });
  }, []);

  // Handle completion - navigate or call callback with assessment ID
  useEffect(() => {
    if (phase === 'complete' && assessmentId) {
      // Give backend a moment to process, then navigate or call callback
      const timer = setTimeout(() => {
        if (onComplete) {
          onComplete(assessmentId);
        } else {
          navigate(`/assessments/${assessmentId}`);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [phase, assessmentId, onComplete, navigate]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.50',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 600, width: '100%' }}>
        <CardContent>
          <Stack spacing={3}>
            {/* Header */}
            <Box display="flex" alignItems="center" gap={2}>
              <CloudUploadIcon fontSize="large" color="primary" />
              <Typography variant="h5" component="h1">
                Uploading Dual-Leg Assessment
              </Typography>
            </Box>

            <Divider />

            {/* Left Leg Upload */}
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="subtitle1" fontWeight="medium">
                  Left Leg Video
                </Typography>
                {leftProgress === 100 && (
                  <CheckCircleIcon color="success" fontSize="small" />
                )}
              </Box>
              <LinearProgress
                variant="determinate"
                value={leftProgress}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {leftProgress}%
              </Typography>
            </Box>

            {/* Right Leg Upload */}
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="subtitle1" fontWeight="medium">
                  Right Leg Video
                </Typography>
                {rightProgress === 100 && (
                  <CheckCircleIcon color="success" fontSize="small" />
                )}
              </Box>
              <LinearProgress
                variant="determinate"
                value={rightProgress}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {rightProgress}%
              </Typography>
            </Box>

            {/* Submission Status */}
            {phase === 'submitting' && (
              <Alert severity="info">
                Calculating symmetry and generating AI feedback...
              </Alert>
            )}

            {phase === 'complete' && (
              <Alert severity="success" icon={<CheckCircleIcon />}>
                Assessment complete! Redirecting to results...
              </Alert>
            )}

            {/* Error State */}
            {phase === 'error' && error && (
              <Alert
                severity="error"
                icon={<ErrorIcon />}
                action={
                  <Button color="inherit" size="small" onClick={retry}>
                    Retry
                  </Button>
                }
              >
                {error}
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
