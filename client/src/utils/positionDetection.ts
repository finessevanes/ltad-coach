import { PoseLandmark } from '../types/mediapipe';
import { LegTested } from '../types/assessment';
import {
  PositionCheck,
  PositionStatus,
  LANDMARK_INDEX,
  FOOT_TOUCHDOWN_THRESHOLD,
  MIN_FOOT_RAISE_THRESHOLD,
  MIN_ANKLE_VISIBILITY,
  RAISED_FOOT_DESCENT_THRESHOLD,
  SUPPORT_FOOT_MOVEMENT_THRESHOLD,
} from '../types/balanceTest';

/**
 * Check if the athlete is in correct one-leg balance position.
 * Used in READY state to determine when to start the test.
 */
export function checkBalancePosition(
  landmarks: PoseLandmark[],
  legTested: LegTested
): PositionStatus {
  const checks: PositionCheck[] = [];

  // Get relevant landmarks
  const leftAnkle = landmarks[LANDMARK_INDEX.LEFT_ANKLE];
  const rightAnkle = landmarks[LANDMARK_INDEX.RIGHT_ANKLE];
  const leftShoulder = landmarks[LANDMARK_INDEX.LEFT_SHOULDER];
  const rightShoulder = landmarks[LANDMARK_INDEX.RIGHT_SHOULDER];

  // Determine which leg should be raised vs standing
  const raisedAnkle = legTested === 'left' ? leftAnkle : rightAnkle;
  const standingAnkle = legTested === 'left' ? rightAnkle : leftAnkle;

  // Check 1: Raised foot is elevated
  // In normalized coordinates, Y increases downward, so raised foot has lower Y
  const ankleHeightDiff = standingAnkle.y - raisedAnkle.y;
  const footIsRaised = ankleHeightDiff >= MIN_FOOT_RAISE_THRESHOLD;

  checks.push({
    name: 'footRaised',
    passed: footIsRaised,
    message: footIsRaised
      ? `${legTested} foot raised`
      : `Raise your ${legTested} foot higher`,
  });

  // Check 2: Body is roughly upright (shoulders level)
  const shoulderLevelDiff = Math.abs(leftShoulder.y - rightShoulder.y);
  const maxShoulderTilt = 0.08; // 8% of frame height
  const isUpright = shoulderLevelDiff <= maxShoulderTilt;

  checks.push({
    name: 'bodyUpright',
    passed: isUpright,
    message: isUpright ? 'Body upright' : 'Stand up straighter',
  });

  const failedChecks = checks.filter((c) => !c.passed).map((c) => c.message);
  const isInPosition = failedChecks.length === 0 && footIsRaised;

  return {
    isInPosition,
    checks,
    failedChecks,
  };
}

/**
 * Result from foot touchdown check with detailed info for debugging.
 */
export interface FootTouchdownResult {
  triggered: boolean;           // Whether touchdown was detected
  skippedDueToLowConfidence: boolean;  // Frame skipped due to low visibility
  yDifference: number;          // Current difference between ankles
  descent: number;              // How much raised foot descended from initial
  standingVisibility: number;   // Confidence of standing ankle detection
  raisedVisibility: number;     // Confidence of raised ankle detection
}

/**
 * Check if the raised foot has touched down during the test.
 * Used in HOLDING state for failure detection.
 *
 * Now requires BOTH conditions for a touchdown:
 * 1. Both ankles at the same Y level (existing check)
 * 2. Raised ankle has descended significantly from initial position (new)
 *
 * Also checks visibility/confidence - skips low-confidence frames instead of failing.
 */
export function checkFootTouchdown(
  landmarks: PoseLandmark[],
  legTested: LegTested,
  initialRaisedAnkleY: number
): FootTouchdownResult {
  const raisedAnkle =
    legTested === 'left'
      ? landmarks[LANDMARK_INDEX.LEFT_ANKLE]
      : landmarks[LANDMARK_INDEX.RIGHT_ANKLE];

  const standingAnkle =
    legTested === 'left'
      ? landmarks[LANDMARK_INDEX.RIGHT_ANKLE]
      : landmarks[LANDMARK_INDEX.LEFT_ANKLE];

  // Get visibility scores (default to 1 if not available)
  const standingVisibility = standingAnkle.visibility ?? 1;
  const raisedVisibility = raisedAnkle.visibility ?? 1;

  // Skip frame if either ankle has low confidence
  if (standingVisibility < MIN_ANKLE_VISIBILITY || raisedVisibility < MIN_ANKLE_VISIBILITY) {
    return {
      triggered: false,
      skippedDueToLowConfidence: true,
      yDifference: Math.abs(raisedAnkle.y - standingAnkle.y),
      descent: raisedAnkle.y - initialRaisedAnkleY,
      standingVisibility,
      raisedVisibility,
    };
  }

  // Condition 1: Both ankles at same Y level
  // In normalized coords, Y increases downward (0 = top, 1 = bottom)
  const yDifference = Math.abs(raisedAnkle.y - standingAnkle.y);
  const atSameLevel = yDifference < FOOT_TOUCHDOWN_THRESHOLD;

  // Condition 2: Raised foot has descended from initial position
  // Y increases downward, so descent = current - initial (positive means lowered)
  const descent = raisedAnkle.y - initialRaisedAnkleY;
  const hasDescended = descent > RAISED_FOOT_DESCENT_THRESHOLD;

  // Only fail if BOTH conditions are true
  const touchedDown = atSameLevel && hasDescended;

  return {
    triggered: touchedDown,
    skippedDueToLowConfidence: false,
    yDifference,
    descent,
    standingVisibility,
    raisedVisibility,
  };
}

/**
 * Result from support foot movement check with detailed info for debugging.
 */
export interface SupportFootHopResult {
  triggered: boolean;           // Whether movement was detected
  skippedDueToLowConfidence: boolean;  // Frame skipped due to low visibility
  xShift: number;               // Horizontal movement from initial (positive = right)
  yShift: number;               // Vertical movement from initial (positive = down)
  displacement: number;         // Total Euclidean distance from initial position
  visibility: number;           // Confidence of standing ankle detection
}

/**
 * Check if the support foot has moved (hopped or repositioned).
 * Used in HOLDING state for failure detection.
 *
 * Detects ANY significant movement from initial position (X + Y combined).
 * This catches:
 * - Hops where foot lands at same or lower Y
 * - Horizontal repositioning
 * - Any combination of movement
 *
 * Skips low-confidence frames instead of failing.
 */
export function checkSupportFootMoved(
  landmarks: PoseLandmark[],
  legTested: LegTested,
  initialStandingAnkleX: number,
  initialStandingAnkleY: number
): SupportFootHopResult {
  const standingAnkle =
    legTested === 'left'
      ? landmarks[LANDMARK_INDEX.RIGHT_ANKLE]
      : landmarks[LANDMARK_INDEX.LEFT_ANKLE];

  // Get visibility score (default to 1 if not available)
  const visibility = standingAnkle.visibility ?? 1;

  // Calculate shift from initial position
  const xShift = standingAnkle.x - initialStandingAnkleX;
  const yShift = standingAnkle.y - initialStandingAnkleY;

  // Calculate total displacement (Euclidean distance)
  const displacement = Math.sqrt(xShift * xShift + yShift * yShift);

  // Skip frame if standing ankle has low confidence
  if (visibility < MIN_ANKLE_VISIBILITY) {
    return {
      triggered: false,
      skippedDueToLowConfidence: true,
      xShift,
      yShift,
      displacement,
      visibility,
    };
  }

  // Trigger if foot moved significantly in ANY direction
  const moved = displacement > SUPPORT_FOOT_MOVEMENT_THRESHOLD;

  return {
    triggered: moved,
    skippedDueToLowConfidence: false,
    xShift,
    yShift,
    displacement,
    visibility,
  };
}

/**
 * Calculate arm deviation from T-position (horizontal shoulder height).
 * Measures how far each wrist has dropped below shoulder level.
 *
 * Per balance-test-measurement-guide.md.pdf:
 * "Measure how far each wrist drops below its corresponding shoulder height.
 *  The ideal T-position has wrists at shoulder level (zero deviation)."
 *
 * @returns Deviation values where:
 *   - 0 = perfect T-position (wrist at shoulder height)
 *   - positive = wrist below shoulder (dropped)
 *   - negative = wrist above shoulder (raised)
 */
export function calculateArmDeviation(
  landmarks: PoseLandmark[]
): { left: number; right: number } {
  const leftShoulder = landmarks[LANDMARK_INDEX.LEFT_SHOULDER];
  const leftWrist = landmarks[LANDMARK_INDEX.LEFT_WRIST];
  const rightShoulder = landmarks[LANDMARK_INDEX.RIGHT_SHOULDER];
  const rightWrist = landmarks[LANDMARK_INDEX.RIGHT_WRIST];

  // Skip calculation if visibility is too low
  const minVisibility = 0.5;
  let leftDeviation = 0;
  let rightDeviation = 0;

  // In normalized coordinates, Y increases downward (0=top, 1=bottom)
  // Positive deviation = wrist below shoulder (dropped from T-position)
  if (
    (leftShoulder.visibility ?? 1) >= minVisibility &&
    (leftWrist.visibility ?? 1) >= minVisibility
  ) {
    leftDeviation = leftWrist.y - leftShoulder.y;
  }

  if (
    (rightShoulder.visibility ?? 1) >= minVisibility &&
    (rightWrist.visibility ?? 1) >= minVisibility
  ) {
    rightDeviation = rightWrist.y - rightShoulder.y;
  }

  return { left: leftDeviation, right: rightDeviation };
}

/**
 * Initial positions captured when test starts.
 */
export interface InitialPositions {
  standingAnkleX: number;
  standingAnkleY: number;
  raisedAnkleY: number;  // Now tracking raised ankle too for descent detection
}

/**
 * Get initial reference positions when test starts.
 * Called when transitioning from READY to HOLDING.
 */
export function getInitialPositions(
  landmarks: PoseLandmark[],
  legTested: LegTested
): InitialPositions {
  const standingAnkle =
    legTested === 'left'
      ? landmarks[LANDMARK_INDEX.RIGHT_ANKLE]
      : landmarks[LANDMARK_INDEX.LEFT_ANKLE];

  const raisedAnkle =
    legTested === 'left'
      ? landmarks[LANDMARK_INDEX.LEFT_ANKLE]
      : landmarks[LANDMARK_INDEX.RIGHT_ANKLE];

  return {
    standingAnkleX: standingAnkle.x,
    standingAnkleY: standingAnkle.y,
    raisedAnkleY: raisedAnkle.y,
  };
}
