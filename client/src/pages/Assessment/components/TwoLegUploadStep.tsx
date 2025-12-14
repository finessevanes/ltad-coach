import React, { useState, useEffect } from 'react';
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
import { useFirebaseUpload } from '../../../hooks/useFirebaseUpload';
import assessmentsService from '../../../services/assessments';
import { ClientMetrics, DualLegMetrics, SymmetryAnalysis } from '../../../types/assessment';
import { TestResult } from '../../../types/balanceTest';

interface LegTestData {
  blob: Blob;
  duration: number;
  result: TestResult;  // Full test result including landmark history
}

interface TwoLegUploadStepProps {
  athleteId: string;
  leftLegData: LegTestData;
  rightLegData: LegTestData;
  onComplete?: (assessmentId: string) => void;
}

type UploadPhase = 'uploading-left' | 'uploading-right' | 'submitting' | 'complete' | 'error';

/**
 * Convert TestResult to ClientMetrics (excludes landmarkHistory).
 * This prevents sending massive payloads (2.5MB → 50KB).
 *
 * TestResult includes landmarkHistory (all pose frames), but backend only needs
 * the calculated metrics, segmented temporal breakdown, and events.
 */
const convertToClientMetrics = (testResult: TestResult): ClientMetrics => ({
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
  // Temporal breakdown with configurable segment duration
  segmentedMetrics: testResult.segmentedMetrics,
  events: testResult.events,
});

export const TwoLegUploadStep: React.FC<TwoLegUploadStepProps> = ({
  athleteId,
  leftLegData,
  rightLegData,
  onComplete,
}) => {
  const navigate = useNavigate();
  const { upload: uploadLeft } = useFirebaseUpload();
  const { upload: uploadRight } = useFirebaseUpload();

  // State
  const [phase, setPhase] = useState<UploadPhase>('uploading-left');
  const [leftProgress, setLeftProgress] = useState(0);
  const [rightProgress, setRightProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  /**
   * Calculate symmetry analysis from left and right leg test results.
   * Implements algorithm from TWO_LEG_IMPLEMENTATION_PLAN.md lines 358-378.
   */
  const calculateSymmetry = (
    leftResult: ClientMetrics,
    rightResult: ClientMetrics
  ): SymmetryAnalysis => {
    // Duration comparison
    const holdTimeDiff = Math.abs(leftResult.holdTime - rightResult.holdTime);
    const maxHoldTime = Math.max(leftResult.holdTime, rightResult.holdTime);
    const holdTimeDiffPct = maxHoldTime > 0 ? (holdTimeDiff / maxHoldTime) * 100 : 0;

    // Determine dominant leg (balanced if <20% difference)
    let dominantLeg: 'left' | 'right' | 'balanced';
    if (holdTimeDiffPct < 20) {
      dominantLeg = 'balanced';
    } else {
      dominantLeg = leftResult.holdTime > rightResult.holdTime ? 'left' : 'right';
    }

    // Sway comparison
    const swayDiff = Math.abs(leftResult.swayVelocity - rightResult.swayVelocity);
    const avgSway = (leftResult.swayVelocity + rightResult.swayVelocity) / 2;
    const swaySymmetryScore = avgSway > 0 ? 1 - Math.min(swayDiff / avgSway, 1.0) : 1.0;

    // Arm angle comparison (average of left and right arms)
    const leftAvgArm = (leftResult.armAngleLeft + leftResult.armAngleRight) / 2;
    const rightAvgArm = (rightResult.armAngleLeft + rightResult.armAngleRight) / 2;
    const armAngleDiff = Math.abs(leftAvgArm - rightAvgArm);

    // Corrections comparison (signed difference)
    const correctionsCountDiff = leftResult.correctionsCount - rightResult.correctionsCount;

    // Overall symmetry score (0-100)
    // Weighted combination: duration (50%), sway (30%), arm angles (10%), corrections (10%)
    const durationSymmetry = 1 - Math.min(holdTimeDiffPct / 100, 1.0);
    const armSymmetry = Math.max(0, 1 - armAngleDiff / 45); // Normalize by 45 degrees max expected diff
    const correctionsSymmetry = Math.max(0, 1 - Math.abs(correctionsCountDiff) / 10); // Normalize by 10 corrections

    const overallSymmetryScore = Math.round(
      durationSymmetry * 50 +
      swaySymmetryScore * 30 +
      armSymmetry * 10 +
      correctionsSymmetry * 10
    );

    // Qualitative assessment
    let symmetryAssessment: 'excellent' | 'good' | 'fair' | 'poor';
    if (overallSymmetryScore >= 85) {
      symmetryAssessment = 'excellent';
    } else if (overallSymmetryScore >= 70) {
      symmetryAssessment = 'good';
    } else if (overallSymmetryScore >= 50) {
      symmetryAssessment = 'fair';
    } else {
      symmetryAssessment = 'poor';
    }

    return {
      holdTimeDifference: holdTimeDiff,
      holdTimeDifferencePct: holdTimeDiffPct,
      dominantLeg,
      swayVelocityDifference: swayDiff,
      swaySymmetryScore,
      armAngleDifference: armAngleDiff,
      correctionsCountDifference: correctionsCountDiff,
      overallSymmetryScore,
      symmetryAssessment,
    };
  };

  const submitDualLegAssessment = async (
    leftUploadResult: { url: string; path: string },
    rightUploadResult: { url: string; path: string }
  ) => {
    console.log('[TwoLegUpload] Submitting dual-leg assessment');
    console.log('[TwoLegUpload] Left leg data:', {
      duration: leftLegData.duration,
      holdTime: leftLegData.result.holdTime,
      corrections: leftLegData.result.correctionsCount,
      success: leftLegData.result.success,
    });
    console.log('[TwoLegUpload] Right leg data:', {
      duration: rightLegData.duration,
      holdTime: rightLegData.result.holdTime,
      corrections: rightLegData.result.correctionsCount,
      success: rightLegData.result.success,
    });

    // Convert TestResult to ClientMetrics (strips landmarkHistory - reduces payload from 2.5MB to ~50KB)
    const leftClientMetrics = convertToClientMetrics(leftLegData.result);
    const rightClientMetrics = convertToClientMetrics(rightLegData.result);

    // Calculate symmetry from converted metrics
    const symmetryAnalysis = calculateSymmetry(
      leftClientMetrics,
      rightClientMetrics
    );
    console.log('[TwoLegUpload] Symmetry analysis calculated:', symmetryAnalysis);

    // Validate metrics before submitting
    if (!leftClientMetrics.segmentedMetrics) {
      console.warn('[TwoLegUpload] Left leg missing segmented metrics data');
    }
    if (!rightClientMetrics.segmentedMetrics) {
      console.warn('[TwoLegUpload] Right leg missing segmented metrics data');
    }

    console.log('[TwoLegUpload] Converted to ClientMetrics - payload now excludes landmarkHistory');

    // Build dual-leg metrics payload
    // NOTE: symmetryAnalysis is calculated by backend - we only send raw metrics
    const dualLegMetrics: DualLegMetrics = {
      leftLeg: leftClientMetrics,
      rightLeg: rightClientMetrics,
      // symmetryAnalysis removed - backend calculates this
    };

    console.log('[TwoLegUpload] DualLegMetrics payload:', {
      leftLegKeys: Object.keys(dualLegMetrics.leftLeg),
      rightLegKeys: Object.keys(dualLegMetrics.rightLeg),
      hasLeftSegments: !!dualLegMetrics.leftLeg.segmentedMetrics,
      hasRightSegments: !!dualLegMetrics.rightLeg.segmentedMetrics,
    });

    // Log symmetry analysis for debugging (not sent to backend)
    console.log('[TwoLegUpload] Client-calculated symmetry (for display only):', symmetryAnalysis);

    // Submit to backend (field names from FE-018)
    const payload = {
      athleteId,
      testType: 'one_leg_balance' as const,
      legTested: 'both' as const,

      // Consistent left/right naming
      leftVideoUrl: leftUploadResult.url,
      leftVideoPath: leftUploadResult.path,
      leftDuration: leftLegData.duration,

      rightVideoUrl: rightUploadResult.url,
      rightVideoPath: rightUploadResult.path,
      rightDuration: rightLegData.duration,

      dualLegMetrics,
    };

    console.log('[TwoLegUpload] Full payload to backend:', {
      athleteId: payload.athleteId,
      testType: payload.testType,
      legTested: payload.legTested,
      hasLeftVideo: !!payload.leftVideoUrl,
      hasRightVideo: !!payload.rightVideoUrl,
      leftDuration: payload.leftDuration,
      rightDuration: payload.rightDuration,
      hasDualLegMetrics: !!payload.dualLegMetrics,
    });

    try {
      const response = await assessmentsService.analyzeVideo(payload);
      console.log('[TwoLegUpload] Backend response:', response);
      setPhase('complete');

      // Navigate to results or call onComplete callback
      if (onComplete) {
        onComplete(response.id);
      } else {
        navigate(`/assessments/${response.id}`);
      }
    } catch (err: any) {
      console.error('[TwoLegUpload] Backend submission failed:', err);
      console.error('[TwoLegUpload] Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      throw err; // Re-throw to be caught by outer try-catch
    }
  };

  const uploadBothVideos = async () => {
    console.log('[TwoLegUpload] Starting upload process for athlete:', athleteId);
    console.log('[TwoLegUpload] Left leg blob size:', leftLegData.blob.size, 'bytes');
    console.log('[TwoLegUpload] Right leg blob size:', rightLegData.blob.size, 'bytes');

    try {
      // Step 1: Upload left leg video
      console.log('[TwoLegUpload] Phase: uploading-left');
      setPhase('uploading-left');
      setLeftProgress(0);
      const leftResult = await uploadLeft(leftLegData.blob, athleteId);
      console.log('[TwoLegUpload] Left video uploaded:', leftResult);
      setLeftProgress(100);

      // Step 2: Upload right leg video
      console.log('[TwoLegUpload] Phase: uploading-right');
      setPhase('uploading-right');
      setRightProgress(0);
      const rightResult = await uploadRight(rightLegData.blob, athleteId);
      console.log('[TwoLegUpload] Right video uploaded:', rightResult);
      setRightProgress(100);

      // Step 3: Calculate symmetry and submit
      console.log('[TwoLegUpload] Phase: submitting');
      setPhase('submitting');
      await submitDualLegAssessment(leftResult, rightResult);

    } catch (err: any) {
      console.error('[TwoLegUpload] Upload process failed:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Upload failed';
      console.error('[TwoLegUpload] User-facing error:', errorMessage);
      setError(errorMessage);
      setPhase('error');
    }
  };

  // Auto-start upload process on mount
  useEffect(() => {
    uploadBothVideos();
  }, []);

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
                  <Button color="inherit" size="small" onClick={uploadBothVideos}>
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
