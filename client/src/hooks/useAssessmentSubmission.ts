import { ClientMetrics, DualLegMetrics, SymmetryAnalysis } from '../types/assessment';
import { TestResult } from '../types/balanceTest';
import assessmentsService from '../services/assessments';

interface UploadResult {
  url: string;
  path: string;
}

interface LegTestData {
  blob: Blob;
  duration: number;
  result: TestResult;
}

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

/**
 * Calculate symmetry analysis from left and right leg test results.
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

export interface UseAssessmentSubmissionResult {
  submit: (
    athleteId: string,
    leftLegData: LegTestData,
    rightLegData: LegTestData,
    leftUploadResult: UploadResult,
    rightUploadResult: UploadResult
  ) => Promise<string>; // Returns assessment ID
  submitting: boolean;
  error: string | null;
}

/**
 * Custom hook for submitting dual-leg assessments to the backend.
 * Handles:
 * - Metric conversion (TestResult → ClientMetrics)
 * - Symmetry calculation
 * - Label swapping (support-leg convention)
 * - Payload construction
 * - Backend submission
 */
export function useAssessmentSubmission(): UseAssessmentSubmissionResult {
  // No state management needed - this is a pure submission function wrapper
  // Submitting state and error handling managed by parent component via useDualLegUpload

  const submit = async (
    athleteId: string,
    leftLegData: LegTestData,
    rightLegData: LegTestData,
    leftUploadResult: UploadResult,
    rightUploadResult: UploadResult
  ): Promise<string> => {
    console.log('[useAssessmentSubmission] Submitting dual-leg assessment');
    console.log('[useAssessmentSubmission] Left leg data (raised LEFT foot = RIGHT leg support):', {
      duration: leftLegData.duration,
      holdTime: leftLegData.result.holdTime,
      corrections: leftLegData.result.correctionsCount,
      success: leftLegData.result.success,
    });
    console.log('[useAssessmentSubmission] Right leg data (raised RIGHT foot = LEFT leg support):', {
      duration: rightLegData.duration,
      holdTime: rightLegData.result.holdTime,
      corrections: rightLegData.result.correctionsCount,
      success: rightLegData.result.success,
    });

    // Convert TestResult to ClientMetrics (strips landmarkHistory - reduces payload from 2.5MB to ~50KB)
    const leftClientMetrics = convertToClientMetrics(leftLegData.result);
    const rightClientMetrics = convertToClientMetrics(rightLegData.result);

    // Calculate symmetry from converted metrics
    const symmetryAnalysis = calculateSymmetry(leftClientMetrics, rightClientMetrics);
    console.log('[useAssessmentSubmission] Symmetry analysis calculated:', symmetryAnalysis);

    // Validate metrics before submitting
    if (!leftClientMetrics.segmentedMetrics) {
      console.warn('[useAssessmentSubmission] Left leg missing segmented metrics data');
    }
    if (!rightClientMetrics.segmentedMetrics) {
      console.warn('[useAssessmentSubmission] Right leg missing segmented metrics data');
    }

    console.log('[useAssessmentSubmission] Converted to ClientMetrics - payload now excludes landmarkHistory');

    /**
     * CRITICAL FIX: Swap metric labels to reflect SUPPORT leg (the leg being tested)
     * ============================================================================
     * Convention:
     * - "leftLeg" metrics = athlete raised RIGHT foot (left leg was support/tested)
     * - "rightLeg" metrics = athlete raised LEFT foot (right leg was support/tested)
     *
     * Data flow:
     * 1. Test 1: User raises LEFT foot → leftClientMetrics contains data from RIGHT support leg
     * 2. Test 2: User raises RIGHT foot → rightClientMetrics contains data from LEFT support leg
     * 3. We swap labels here so database and AI receive support-leg-based labels
     *
     * This ensures:
     * - Database stores metrics labeled by support leg (correct)
     * - AI receives "Left Leg: X seconds" where left leg actually held for X seconds
     * - Display in TwoLegResultsView.tsx will use direct metrics (no compensation needed)
     */
    const dualLegMetrics: DualLegMetrics = {
      leftLeg: rightClientMetrics,   // RIGHT foot raised = LEFT leg tested (support)
      rightLeg: leftClientMetrics,   // LEFT foot raised = RIGHT leg tested (support)
    };

    console.log('[useAssessmentSubmission] DualLegMetrics payload:', {
      leftLegKeys: Object.keys(dualLegMetrics.leftLeg),
      rightLegKeys: Object.keys(dualLegMetrics.rightLeg),
      hasLeftSegments: !!dualLegMetrics.leftLeg.segmentedMetrics,
      hasRightSegments: !!dualLegMetrics.rightLeg.segmentedMetrics,
    });

    // Log symmetry analysis for debugging (not sent to backend)
    console.log('[useAssessmentSubmission] Client-calculated symmetry (for display only):', symmetryAnalysis);

    // Submit to backend (field names from FE-018)
    // SWAP: leftLegData captured raising LEFT foot (testing RIGHT leg)
    // So leftLegData video should be labeled as right leg video
    const payload = {
      athleteId,
      testType: 'one_leg_balance' as const,
      legTested: 'both' as const,

      // SWAPPED: Videos now match support leg convention
      leftVideoUrl: rightUploadResult.url,   // RIGHT foot raised = LEFT leg support
      leftVideoPath: rightUploadResult.path,
      leftDuration: rightLegData.duration,

      rightVideoUrl: leftUploadResult.url,   // LEFT foot raised = RIGHT leg support
      rightVideoPath: leftUploadResult.path,
      rightDuration: leftLegData.duration,

      dualLegMetrics,
    };

    console.log('[useAssessmentSubmission] Full payload to backend:', {
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
      console.log('[useAssessmentSubmission] Backend response:', response);
      return response.id;
    } catch (err: any) {
      console.error('[useAssessmentSubmission] Backend submission failed:', err);
      console.error('[useAssessmentSubmission] Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      throw err;
    }
  };

  return {
    submit,
    submitting: false, // Managed by parent via useDualLegUpload
    error: null, // Managed by parent via useDualLegUpload
  };
}
