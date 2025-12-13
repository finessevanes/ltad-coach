import { useState, useCallback, useRef, useEffect } from 'react';
import { PoseResult } from '../types/mediapipe';
import { LegTested } from '../types/assessment';
import type { TestResult } from '../types/balanceTest';
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

  const startTest = useCallback(() => {
    console.log('[BalanceTest] Starting test, transitioning to READY state');
    setTestState('ready');
    setHoldTime(0);
    setFailureReason(null);
    setTestResult(null);
    positionHoldStartRef.current = null;
    holdingStartTimeRef.current = null;
    initialPositionsRef.current = null;
    landmarkHistoryRef.current = [];
    consecutiveTouchdownFramesRef.current = 0;
    consecutiveMovementFramesRef.current = 0;
  }, []);

  const resetTest = useCallback(() => {
    setTestState('idle');
    setHoldTime(0);
    setFailureReason(null);
    setPositionStatus(null);
    setTestResult(null);
    positionHoldStartRef.current = null;
    holdingStartTimeRef.current = null;
    initialPositionsRef.current = null;
    landmarkHistoryRef.current = [];
    consecutiveTouchdownFramesRef.current = 0;
    consecutiveMovementFramesRef.current = 0;
    if (holdTimeIntervalRef.current) {
      clearInterval(holdTimeIntervalRef.current);
      holdTimeIntervalRef.current = null;
    }
  }, []);

  const endTest = useCallback(
    (success: boolean, reason?: string) => {
      console.log('[BalanceTest] Ending test:', { success, reason });

      if (holdTimeIntervalRef.current) {
        clearInterval(holdTimeIntervalRef.current);
        holdTimeIntervalRef.current = null;
      }

      const finalHoldTime = holdingStartTimeRef.current
        ? (Date.now() - holdingStartTimeRef.current) / 1000
        : 0;

      console.log('[BalanceTest] Final hold time:', finalHoldTime);

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
          stabilityScore: 0,
          temporal: {
            firstThird: { armAngleLeft: 0, armAngleRight: 0, swayVelocity: 0, correctionsCount: 0 },
            middleThird: { armAngleLeft: 0, armAngleRight: 0, swayVelocity: 0, correctionsCount: 0 },
            lastThird: { armAngleLeft: 0, armAngleRight: 0, swayVelocity: 0, correctionsCount: 0 },
          },
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
        stabilityScore: metrics.stabilityScore,
        temporal: metrics.temporal,
        // Enhanced temporal data for LLM
        fiveSecondSegments: metrics.fiveSecondSegments,
        events: metrics.events,
      };

      console.log('[BalanceTest] Setting test result with metrics:', result);
      console.log('[BalanceTest] Metrics (cm, degrees):', {
        swayStdX: metrics.swayStdX,
        swayStdY: metrics.swayStdY,
        swayVelocity: metrics.swayVelocity,
        armAngleLeft: metrics.armAngleLeft,
        armAngleRight: metrics.armAngleRight,
        stabilityScore: metrics.stabilityScore,
      });
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
          console.log('[BalanceTest] Position detected, starting 1s buffer...');
          positionHoldStartRef.current = now;
        } else if (now - positionHoldStartRef.current >= POSITION_HOLD_BUFFER_MS) {
          // Position held for required buffer time - transition to HOLDING
          console.log('[BalanceTest] Position held for 1s, transitioning to HOLDING');
          const positions = getInitialPositions(landmarks, legTested);
          console.log('[BalanceTest] Initial positions:', positions);
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
      const standingAnkle = legTested === 'left'
        ? landmarks[LANDMARK_INDEX.RIGHT_ANKLE]
        : landmarks[LANDMARK_INDEX.LEFT_ANKLE];
      const raisedAnkle = legTested === 'left'
        ? landmarks[LANDMARK_INDEX.LEFT_ANKLE]
        : landmarks[LANDMARK_INDEX.RIGHT_ANKLE];

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
        console.log('[BalanceTest] Foot touchdown detected!', {
          yDifference: touchdownResult.yDifference,
          descent: touchdownResult.descent,
          consecutiveFrames: consecutiveTouchdownFramesRef.current,
        });
        endTest(false, 'Foot touched down');
        return;
      }

      // Check for support foot movement (requires consecutive frames to prevent false positives)
      if (consecutiveMovementFramesRef.current >= CONSECUTIVE_FAIL_FRAMES_REQUIRED) {
        console.log('[BalanceTest] Support foot moved!', {
          xShift: movementResult.xShift,
          yShift: movementResult.yShift,
          displacement: movementResult.displacement,
          consecutiveFrames: consecutiveMovementFramesRef.current,
        });
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
    startTest,
    resetTest,
  };
}
