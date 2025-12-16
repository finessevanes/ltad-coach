import { useState, useCallback, useRef, useEffect } from 'react';
import { PoseResult } from '../types/mediapipe';
import { LegTested } from '../types/assessment';
import type { TestResult, CurrentMetrics } from '../types/balanceTest';
import {
  TestState,
  PositionStatus,
  TimestampedLandmarks,
  POSITION_HOLD_BUFFER_MS,
  TRACKING_LOST_TIMEOUT_MS,
  DEFAULT_TARGET_DURATION,
  FOOT_TOUCHDOWN_THRESHOLD,
  RAISED_FOOT_DESCENT_THRESHOLD,
  MIN_ANKLE_VISIBILITY,
  SUPPORT_FOOT_MOVEMENT_THRESHOLD,
  CONSECUTIVE_FAIL_FRAMES_REQUIRED,
  LANDMARK_INDEX,
  REQUIRED_LANDMARK_INDICES,
} from '../types/balanceTest';
import {
  checkBalancePosition,
  checkFootTouchdown,
  checkSupportFootMoved,
  getInitialPositions,
  InitialPositions,
} from '../utils/positionDetection';
import { calculateMetrics } from '../utils/metricsCalculation';

// Constants for real-time metrics calculation
const AVERAGE_SHOULDER_WIDTH_CM = 40.0;
const FALLBACK_SCALE_CM = 150.0;
const CORRECTION_THRESHOLD_CM = 2.0;
const BALANCE_STABLE_THRESHOLD_CM = 5.0; // Threshold for STABLE vs UNSTABLE status

interface UseBalanceTestOptions {
  targetDuration?: number;
  debug?: boolean;
}

// Debug info for understanding failure detection
export interface DebugInfo {
  // Current ankle positions
  standingAnkleX: number;
  standingAnkleY: number;
  raisedAnkleY: number;
  // Initial positions (captured at test start)
  initialStandingAnkleX: number;
  initialStandingAnkleY: number;
  initialRaisedAnkleY: number;
  // Calculated values
  footTouchdownDiff: number;  // Difference between raised and standing ankle Y
  raisedFootDescent: number;  // How much raised foot has descended from initial
  // Support foot movement values
  supportFootXShift: number;     // Horizontal shift from initial
  supportFootYShift: number;     // Vertical shift from initial
  supportFootDisplacement: number; // Total displacement from initial
  // Visibility/confidence scores (0-1)
  standingAnkleVisibility: number;
  raisedAnkleVisibility: number;
  minVisibilityThreshold: number;
  visibilityPassed: boolean;  // Both ankles above threshold
  // Thresholds for comparison
  touchdownThreshold: number;
  movementThreshold: number;
  descentThreshold: number;
  // Status
  wouldTriggerTouchdown: boolean;
  wouldTriggerMovement: boolean;
  skippedDueToLowConfidence: boolean;
  // Consecutive failure frame tracking
  consecutiveTouchdownFrames: number;
  consecutiveMovementFrames: number;
  consecutiveFramesRequired: number;
}

interface UseBalanceTestResult {
  testState: TestState;
  holdTime: number;
  failureReason: string | null;
  positionStatus: PositionStatus | null;
  testResult: TestResult | null;
  debugInfo: DebugInfo | null;
  /** Real-time metrics (only available during HOLDING state) */
  currentMetrics: CurrentMetrics | null;
  startTest: () => void;
  resetTest: () => void;
}

export function useBalanceTest(
  poseResult: PoseResult | null,
  legTested: LegTested,
  options: UseBalanceTestOptions = {}
): UseBalanceTestResult {
  const { targetDuration = DEFAULT_TARGET_DURATION, debug = false } = options;

  const [testState, setTestState] = useState<TestState>('idle');
  const [holdTime, setHoldTime] = useState(0);
  const [failureReason, setFailureReason] = useState<string | null>(null);
  const [positionStatus, setPositionStatus] = useState<PositionStatus | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [currentMetrics, setCurrentMetrics] = useState<CurrentMetrics | null>(null);

  // Refs for tracking state without triggering re-renders
  const positionHoldStartRef = useRef<number | null>(null);
  const holdingStartTimeRef = useRef<number | null>(null);
  const lastTrackingTimeRef = useRef<number>(Date.now());
  const initialPositionsRef = useRef<InitialPositions | null>(null);
  const landmarkHistoryRef = useRef<TimestampedLandmarks[]>([]);
  const holdTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  // Consecutive failure frame tracking (prevents false positives from occlusion)
  const consecutiveTouchdownFramesRef = useRef(0);
  const consecutiveMovementFramesRef = useRef(0);
  // Real-time metrics tracking
  const initialHipPositionRef = useRef<{ x: number; y: number } | null>(null);
  const scaleFactorRef = useRef<number | null>(null); // cm per normalized unit
  const correctionsCountRef = useRef(0);
  const wasOutsideThresholdRef = useRef(false); // For correction detection

  const startTest = useCallback(() => {
    setTestState('ready');
    setHoldTime(0);
    setFailureReason(null);
    setTestResult(null);
    setCurrentMetrics(null);
    positionHoldStartRef.current = null;
    holdingStartTimeRef.current = null;
    initialPositionsRef.current = null;
    landmarkHistoryRef.current = [];
    consecutiveTouchdownFramesRef.current = 0;
    consecutiveMovementFramesRef.current = 0;
    initialHipPositionRef.current = null;
    scaleFactorRef.current = null;
    correctionsCountRef.current = 0;
    wasOutsideThresholdRef.current = false;
  }, []);

  const resetTest = useCallback(() => {
    setTestState('idle');
    setHoldTime(0);
    setFailureReason(null);
    setPositionStatus(null);
    setTestResult(null);
    setCurrentMetrics(null);
    positionHoldStartRef.current = null;
    holdingStartTimeRef.current = null;
    initialPositionsRef.current = null;
    landmarkHistoryRef.current = [];
    consecutiveTouchdownFramesRef.current = 0;
    consecutiveMovementFramesRef.current = 0;
    initialHipPositionRef.current = null;
    scaleFactorRef.current = null;
    correctionsCountRef.current = 0;
    wasOutsideThresholdRef.current = false;
    if (holdTimeIntervalRef.current) {
      clearInterval(holdTimeIntervalRef.current);
      holdTimeIntervalRef.current = null;
    }
  }, []);

  const endTest = useCallback(
    (success: boolean, reason?: string) => {
      if (holdTimeIntervalRef.current) {
        clearInterval(holdTimeIntervalRef.current);
        holdTimeIntervalRef.current = null;
      }

      const finalHoldTime = holdingStartTimeRef.current
        ? (Date.now() - holdingStartTimeRef.current) / 1000
        : 0;

      console.log('🛑 TEST ENDED:', {
        success,
        reason,
        holdTime: finalHoldTime.toFixed(2) + 's',
      });

      setTestState(success ? 'completed' : 'failed');
      setFailureReason(reason || null);
      setHoldTime(finalHoldTime);

      // Calculate metrics from landmark history (world landmarks - real units: cm, degrees)
      const metrics = calculateMetrics(
        landmarkHistoryRef.current,
        finalHoldTime
      );

      if (!metrics) {
        console.error('[BalanceTest] Failed to calculate metrics - world landmarks not available');
        // Create result with zero metrics as fallback
        const result: TestResult = {
          success: false,
          holdTime: Math.round(finalHoldTime * 100) / 100,
          failureReason: 'Failed to calculate metrics',
          landmarkHistory: [...landmarkHistoryRef.current],
          swayStdX: 0,
          swayStdY: 0,
          swayPathLength: 0,
          swayVelocity: 0,
          correctionsCount: 0,
          armAngleLeft: 0,
          armAngleRight: 0,
          armAsymmetryRatio: 1,
          segmentedMetrics: { segmentDuration: 1.0, segments: [] },
        };
        setTestResult(result);
        return;
      }

      const result: TestResult = {
        success,
        holdTime: Math.round(finalHoldTime * 100) / 100,
        failureReason: reason,
        landmarkHistory: [...landmarkHistoryRef.current],
        // Metrics in real-world units (cm, degrees)
        swayStdX: metrics.swayStdX,
        swayStdY: metrics.swayStdY,
        swayPathLength: metrics.swayPathLength,
        swayVelocity: metrics.swayVelocity,
        correctionsCount: metrics.correctionsCount,
        armAngleLeft: metrics.armAngleLeft,
        armAngleRight: metrics.armAngleRight,
        armAsymmetryRatio: metrics.armAsymmetryRatio,
        segmentedMetrics: metrics.segmentedMetrics,
        events: metrics.events,
      };

      setTestResult(result);
    },
    []
  );

  // Main detection loop - runs on each pose result update
  useEffect(() => {
    if (testState === 'idle' || testState === 'completed' || testState === 'failed') {
      return;
    }

    const now = Date.now();

    // Check for lost tracking
    if (!poseResult || !poseResult.landmarks || poseResult.landmarks.length === 0) {
      if (testState === 'holding') {
        const timeSinceLastTracking = now - lastTrackingTimeRef.current;
        if (timeSinceLastTracking > TRACKING_LOST_TIMEOUT_MS) {
          endTest(false, 'Lost tracking');
        }
      }
      return;
    }

    lastTrackingTimeRef.current = now;
    const landmarks = poseResult.landmarks;

    // Record only the 8 required landmarks during test (READY and HOLDING states)
    // This reduces storage/memory while keeping all data needed for metrics calculation
    const filteredLandmarks = REQUIRED_LANDMARK_INDICES.map((idx) => landmarks[idx]);
    const filteredWorldLandmarks = poseResult.worldLandmarks
      ? REQUIRED_LANDMARK_INDICES.map((idx) => poseResult.worldLandmarks![idx])
      : [];

    landmarkHistoryRef.current.push({
      timestamp: now,
      landmarks: filteredLandmarks,
      worldLandmarks: filteredWorldLandmarks,
    });

    // READY state logic
    if (testState === 'ready') {
      const status = checkBalancePosition(landmarks, legTested);
      setPositionStatus(status);

      if (status.isInPosition) {
        if (positionHoldStartRef.current === null) {
          positionHoldStartRef.current = now;
        } else if (now - positionHoldStartRef.current >= POSITION_HOLD_BUFFER_MS) {
          // Position held for required buffer time - transition to HOLDING
          const positions = getInitialPositions(landmarks, legTested);
          initialPositionsRef.current = positions;
          holdingStartTimeRef.current = now;
          setTestState('holding');
          setPositionStatus(null);

          // Start hold time counter
          holdTimeIntervalRef.current = setInterval(() => {
            if (holdingStartTimeRef.current) {
              const elapsed = (Date.now() - holdingStartTimeRef.current) / 1000;
              setHoldTime(elapsed);

              // Check for completion
              if (elapsed >= targetDuration) {
                endTest(true);
              }
            }
          }, 100);
        }
      } else {
        // Position lost - reset buffer
        positionHoldStartRef.current = null;
      }
    }

    // HOLDING state logic
    if (testState === 'holding' && initialPositionsRef.current) {
      // Get current ankle positions for debug
      // NOTE: Swapped to account for mirrored video
      const standingAnkle = legTested === 'left'
        ? landmarks[LANDMARK_INDEX.LEFT_ANKLE]
        : landmarks[LANDMARK_INDEX.RIGHT_ANKLE];
      const raisedAnkle = legTested === 'left'
        ? landmarks[LANDMARK_INDEX.RIGHT_ANKLE]
        : landmarks[LANDMARK_INDEX.LEFT_ANKLE];

      // Run detection checks (now returns detailed results)
      const touchdownResult = checkFootTouchdown(
        landmarks,
        legTested,
        initialPositionsRef.current.raisedAnkleY
      );
      const movementResult = checkSupportFootMoved(
        landmarks,
        legTested,
        initialPositionsRef.current.standingAnkleX,
        initialPositionsRef.current.standingAnkleY
      );

      // Calculate debug values
      const raisedFootDescent = raisedAnkle.y - initialPositionsRef.current.raisedAnkleY;
      const visibilityPassed =
        touchdownResult.standingVisibility >= MIN_ANKLE_VISIBILITY &&
        touchdownResult.raisedVisibility >= MIN_ANKLE_VISIBILITY;
      const skippedDueToLowConfidence =
        touchdownResult.skippedDueToLowConfidence || movementResult.skippedDueToLowConfidence;

      // Track consecutive failure frames (prevents false positives from occlusion)
      if (touchdownResult.triggered) {
        consecutiveTouchdownFramesRef.current++;
      } else {
        consecutiveTouchdownFramesRef.current = 0;
      }

      if (movementResult.triggered) {
        consecutiveMovementFramesRef.current++;
      } else {
        consecutiveMovementFramesRef.current = 0;
      }

      // ===== REAL-TIME METRICS CALCULATION =====
      // Calculate metrics for coaching overlay using correct coordinate system
      if (poseResult.worldLandmarks && poseResult.worldLandmarks.length > 0) {
        const worldLandmarks = poseResult.worldLandmarks;

        // Calculate arm angles (using world landmarks for accuracy) ✅
        const calculateArmAngle = (shoulder: { x: number; y: number; z: number }, wrist: { x: number; y: number; z: number }): number => {
          const dx = wrist.x - shoulder.x;
          const dy = wrist.y - shoulder.y;
          const angleRad = Math.atan2(dy, Math.abs(dx));
          const angleDeg = angleRad * (180 / Math.PI);
          return Math.round(angleDeg * 10) / 10;
        };

        const leftArmAngle = calculateArmAngle(
          worldLandmarks[LANDMARK_INDEX.LEFT_SHOULDER],
          worldLandmarks[LANDMARK_INDEX.LEFT_WRIST]
        );
        const rightArmAngle = calculateArmAngle(
          worldLandmarks[LANDMARK_INDEX.RIGHT_SHOULDER],
          worldLandmarks[LANDMARK_INDEX.RIGHT_WRIST]
        );

        // Calculate hip sway using NORMALIZED coordinates with shoulder calibration ✅
        const leftShoulder = landmarks[LANDMARK_INDEX.LEFT_SHOULDER];
        const rightShoulder = landmarks[LANDMARK_INDEX.RIGHT_SHOULDER];
        const leftHip = landmarks[LANDMARK_INDEX.LEFT_HIP];
        const rightHip = landmarks[LANDMARK_INDEX.RIGHT_HIP];

        if (leftShoulder && rightShoulder && leftHip && rightHip) {
          // Step 1: Calculate scale factor (once at the start)
          if (scaleFactorRef.current === null) {
            const shoulderWidthNorm = Math.abs(rightShoulder.x - leftShoulder.x);
            if (shoulderWidthNorm > 0.05 && shoulderWidthNorm < 0.8) {
              scaleFactorRef.current = AVERAGE_SHOULDER_WIDTH_CM / shoulderWidthNorm;
            } else {
              scaleFactorRef.current = FALLBACK_SCALE_CM;
            }
          }

          // Step 2: Calculate current hip center in normalized coordinates
          const currentHipX = (leftHip.x + rightHip.x) / 2;
          const currentHipY = (leftHip.y + rightHip.y) / 2;

          // Step 3: Store initial position on first frame
          if (initialHipPositionRef.current === null) {
            initialHipPositionRef.current = { x: currentHipX, y: currentHipY };
          }

          // Step 4: Calculate displacement from initial position in normalized coords
          const displacementNormX = currentHipX - initialHipPositionRef.current.x;
          const displacementNormY = currentHipY - initialHipPositionRef.current.y;

          // Step 5: Apply scale factor to convert to cm
          const hipSwayX = displacementNormX * scaleFactorRef.current;
          const hipSwayY = displacementNormY * scaleFactorRef.current;

          // Step 6: Calculate 2D distance from initial position
          const hipSwayCm = Math.sqrt(hipSwayX * hipSwayX + hipSwayY * hipSwayY);

          // Step 7: Track corrections (crossing threshold)
          const isOutsideThreshold = hipSwayCm > CORRECTION_THRESHOLD_CM;
          if (wasOutsideThresholdRef.current && !isOutsideThreshold) {
            // Returned inside threshold - count as a correction
            correctionsCountRef.current++;
          }
          wasOutsideThresholdRef.current = isOutsideThreshold;

          // Step 8: Calculate balance status
          const balanceStatus = hipSwayCm < BALANCE_STABLE_THRESHOLD_CM ? 'STABLE' : 'UNSTABLE';

          // Update current metrics state with all working metrics
          setCurrentMetrics({
            armAngleLeft: leftArmAngle,
            armAngleRight: rightArmAngle,
            hipSway: Math.round(hipSwayCm * 10) / 10,
            corrections: correctionsCountRef.current,
            balanceStatus,
          });
        } else {
          // Fallback if hip landmarks not available
          setCurrentMetrics({
            armAngleLeft: leftArmAngle,
            armAngleRight: rightArmAngle,
          });
        }
      }

      // Update debug info if debug mode is enabled
      if (debug) {
        setDebugInfo({
          standingAnkleX: standingAnkle.x,
          standingAnkleY: standingAnkle.y,
          raisedAnkleY: raisedAnkle.y,
          initialStandingAnkleX: initialPositionsRef.current.standingAnkleX,
          initialStandingAnkleY: initialPositionsRef.current.standingAnkleY,
          initialRaisedAnkleY: initialPositionsRef.current.raisedAnkleY,
          footTouchdownDiff: touchdownResult.yDifference,
          raisedFootDescent,
          supportFootXShift: movementResult.xShift,
          supportFootYShift: movementResult.yShift,
          supportFootDisplacement: movementResult.displacement,
          standingAnkleVisibility: touchdownResult.standingVisibility,
          raisedAnkleVisibility: touchdownResult.raisedVisibility,
          minVisibilityThreshold: MIN_ANKLE_VISIBILITY,
          visibilityPassed,
          touchdownThreshold: FOOT_TOUCHDOWN_THRESHOLD,
          movementThreshold: SUPPORT_FOOT_MOVEMENT_THRESHOLD,
          descentThreshold: RAISED_FOOT_DESCENT_THRESHOLD,
          wouldTriggerTouchdown: touchdownResult.triggered,
          wouldTriggerMovement: movementResult.triggered,
          skippedDueToLowConfidence,
          consecutiveTouchdownFrames: consecutiveTouchdownFramesRef.current,
          consecutiveMovementFrames: consecutiveMovementFramesRef.current,
          consecutiveFramesRequired: CONSECUTIVE_FAIL_FRAMES_REQUIRED,
        });
      }

      // Check for foot touchdown (requires consecutive frames to prevent false positives)
      if (consecutiveTouchdownFramesRef.current >= CONSECUTIVE_FAIL_FRAMES_REQUIRED) {
        endTest(false, 'Foot touched down');
        return;
      }

      // Check for support foot movement (requires consecutive frames to prevent false positives)
      if (consecutiveMovementFramesRef.current >= CONSECUTIVE_FAIL_FRAMES_REQUIRED) {
        endTest(false, 'Support foot moved');
        return;
      }
    }
  }, [poseResult, testState, legTested, targetDuration, endTest, debug]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdTimeIntervalRef.current) {
        clearInterval(holdTimeIntervalRef.current);
      }
    };
  }, []);

  return {
    testState,
    holdTime,
    failureReason,
    positionStatus,
    testResult,
    debugInfo,
    currentMetrics,
    startTest,
    resetTest,
  };
}
