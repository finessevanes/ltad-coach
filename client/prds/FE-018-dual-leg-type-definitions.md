---
id: FE-018
status: ✅ COMPLETE
completed: 2025-12-14
depends_on: []
blocks: [FE-019, FE-020, FE-021, FE-022, FE-023, FE-024]
---

# FE-018: Type Definitions for Dual-Leg Flow

## Title
Add TypeScript interfaces and types to support bilateral balance testing with symmetry analysis

## Scope

### In Scope
- Add `'both'` option to `LegTested` type
- Create `SymmetryAnalysis` interface for client-side symmetry metrics
- Create `DualLegMetrics` interface wrapping two `ClientMetrics` objects
- Update `AssessmentCreate` interface with renamed fields and dual-leg support
- Update `Assessment` interface with dual-leg fields
- Maintain backward compatibility with existing single-leg assessments

### Out of Scope
- TransitionModal component implementation (FE-019)
- RecordingStep autoStart enhancement (FE-020)
- TwoLegUploadStep component (FE-021)
- AssessmentFlow refactor (FE-022)
- Results view components (FE-023, FE-024)
- Backend type definitions (BE-016)

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Naming Convention | `left*` / `right*` prefixes | Consistency across single-leg and dual-leg modes; eliminates ambiguity |
| Breaking Change | Rename `videoUrl` → `leftVideoUrl` in `AssessmentCreate` | Acceptable for development phase; improves clarity for dual-leg flow |
| Symmetry Score Range | 0-100 scale | User-friendly percentage-like scale; aligns with existing metric patterns |
| Dominant Leg Type | String literal ('left', 'right', 'balanced') | Simpler than enum for this three-value field |
| Temporal Data | Preserve all temporal fields in both legs | Enables AI agent to analyze fatigue patterns and bilateral differences |

## Acceptance Criteria

- [ ] `LegTested` type includes `'both'`
- [ ] `SymmetryAnalysis` interface validates all required fields
- [ ] `DualLegMetrics` interface wraps two `ClientMetrics` objects
- [ ] `Assessment` interface includes dual-leg fields (backward compatible)
- [ ] `AssessmentCreate` uses `leftVideoUrl` instead of `videoUrl` (breaking change documented)
- [ ] `AssessmentCreate` includes optional `dualLegMetrics` field
- [ ] All interfaces use camelCase (TypeScript convention)
- [ ] JSDoc comments explain purpose of each interface
- [ ] TypeScript compiler accepts all type definitions without errors

## Files to Create/Modify

```
client/src/types/
└── assessment.ts              # Update types and interfaces
```

## Implementation Details

### 1. Update `LegTested` Type

**Location**: Line 2 in `client/src/types/assessment.ts`

```typescript
export type LegTested = 'left' | 'right' | 'both';  // Add 'both'
```

### 2. Create `SymmetryAnalysis` Interface

**Add after `ClientTemporalMetrics` interface (after line 39):**

```typescript
/**
 * Symmetry analysis comparing left and right leg performance.
 * Calculated client-side before submission to backend.
 */
export interface SymmetryAnalysis {
  // Duration comparison
  holdTimeDifference: number;        // Absolute difference in seconds: |left - right|
  holdTimeDifferencePct: number;     // Percentage difference (0-100)
  dominantLeg: 'left' | 'right' | 'balanced';  // Leg with better hold time (<20% diff = balanced)

  // Sway comparison
  swayVelocityDifference: number;    // Absolute difference in cm/s: |left - right|
  swaySymmetryScore: number;         // 0-1 scale: 0=asymmetric, 1=perfect symmetry

  // Arm comparison
  armAngleDifference: number;        // Average arm angle difference in degrees: |left_avg - right_avg|

  // Corrections comparison
  correctionsCountDifference: number; // Difference in corrections: left - right (signed)

  // Overall assessment
  overallSymmetryScore: number;      // 0-100 scale: weighted combination of above metrics
  symmetryAssessment: 'excellent' | 'good' | 'fair' | 'poor';  // Qualitative rating
}
```

### 3. Create `DualLegMetrics` Interface

**Add after `SymmetryAnalysis` interface:**

```typescript
/**
 * Container for dual-leg assessment metrics.
 * Includes full client metrics for both legs (with temporal data).
 */
export interface DualLegMetrics {
  leftLeg: ClientMetrics;           // Complete left leg test results
  rightLeg: ClientMetrics;          // Complete right leg test results
  symmetryAnalysis: SymmetryAnalysis; // Client-calculated comparison
}
```

**Note**: Symmetry analysis is calculated client-side in `TwoLegUploadStep` and sent to backend. Backend may recalculate or enhance with additional metrics.

### 4. Update `Assessment` Interface

**Replace existing `Assessment` interface (lines 95-108) with:**

```typescript
export interface Assessment {
  id: string;
  athleteId: string;
  coachId: string;
  testType: TestType;
  legTested: LegTested;  // Now supports 'both'

  // Single-leg fields (now optional for backward compatibility)
  videoUrl?: string;
  videoPath?: string;

  // Dual-leg video fields (NEW)
  leftLegVideoUrl?: string;
  leftLegVideoPath?: string;
  rightLegVideoUrl?: string;
  rightLegVideoPath?: string;

  status: AssessmentStatus;
  createdAt: string;

  // Single-leg metrics (now optional for backward compatibility)
  metrics?: AssessmentMetrics;

  // Dual-leg metrics (NEW)
  leftLegMetrics?: AssessmentMetrics;
  rightLegMetrics?: AssessmentMetrics;
  bilateralComparison?: SymmetryAnalysis;  // Backend-enhanced symmetry analysis

  // Common fields
  aiCoachAssessment?: string;
  errorMessage?: string;
}
```

**Important Notes**:
- For single-leg assessments: `videoUrl`, `videoPath`, `metrics` are populated
- For dual-leg assessments: `leftLegVideoUrl`, `rightLegVideoUrl`, `leftLegMetrics`, `rightLegMetrics`, `bilateralComparison` are populated
- All new fields are optional for backward compatibility with existing single-leg assessments

### 5. Update `AssessmentCreate` Interface

**Replace existing `AssessmentCreate` interface (lines 110-118) with:**

```typescript
/**
 * Request payload for creating assessment (single-leg or dual-leg).
 *
 * BREAKING CHANGE: Field names updated for consistency:
 * - `videoUrl` → `leftVideoUrl`
 * - `videoPath` → `leftVideoPath`
 * - `duration` → `leftDuration`
 *
 * This ensures consistent naming for both single-leg and dual-leg modes.
 */
export interface AssessmentCreate {
  athleteId: string;
  testType: TestType;
  legTested: LegTested;

  // Single-leg fields (RENAMED for consistency)
  leftVideoUrl?: string;        // Left leg video URL (or single leg for legacy)
  leftVideoPath?: string;       // Left leg video storage path
  leftDuration?: number;        // Left leg video duration (seconds)
  clientMetrics?: ClientMetrics; // Single-leg metrics (legacy)

  // Dual-leg fields (NEW)
  rightVideoUrl?: string;       // Right leg video URL
  rightVideoPath?: string;      // Right leg video storage path
  rightDuration?: number;       // Right leg video duration (seconds)
  dualLegMetrics?: DualLegMetrics; // Dual-leg metrics with both legs
}
```

### 6. Complete Updated File

**Full `client/src/types/assessment.ts` after all changes:**

```typescript
export type TestType = 'one_leg_balance';
export type LegTested = 'left' | 'right' | 'both';  // Add 'both'
export type AssessmentStatus = 'processing' | 'completed' | 'failed';

export interface AssessmentSetup {
  athleteId: string;
  testType: TestType;
  legTested: LegTested;
}

export interface RecordingState {
  status: 'idle' | 'countdown' | 'recording' | 'preview';
  videoBlob: Blob | null;
  videoUrl: string | null;
  duration: number;
}

import { FiveSecondSegment, BalanceEvent } from './balanceTest';

/**
 * Metrics for a temporal segment (first/middle/last third of test)
 */
export interface ClientSegmentMetrics {
  armAngleLeft: number;      // degrees
  armAngleRight: number;     // degrees
  swayVelocity: number;      // cm/s
  correctionsCount: number;
  swayStdX?: number;         // cm (optional for backward compat)
  swayStdY?: number;         // cm (optional for backward compat)
}

/**
 * Temporal breakdown of metrics
 */
export interface ClientTemporalMetrics {
  firstThird: ClientSegmentMetrics;
  middleThird: ClientSegmentMetrics;
  lastThird: ClientSegmentMetrics;
}

/**
 * Symmetry analysis comparing left and right leg performance.
 * Calculated client-side before submission to backend.
 */
export interface SymmetryAnalysis {
  // Duration comparison
  holdTimeDifference: number;        // Absolute difference in seconds: |left - right|
  holdTimeDifferencePct: number;     // Percentage difference (0-100)
  dominantLeg: 'left' | 'right' | 'balanced';  // Leg with better hold time (<20% diff = balanced)

  // Sway comparison
  swayVelocityDifference: number;    // Absolute difference in cm/s: |left - right|
  swaySymmetryScore: number;         // 0-1 scale: 0=asymmetric, 1=perfect symmetry

  // Arm comparison
  armAngleDifference: number;        // Average arm angle difference in degrees: |left_avg - right_avg|

  // Corrections comparison
  correctionsCountDifference: number; // Difference in corrections: left - right (signed)

  // Overall assessment
  overallSymmetryScore: number;      // 0-100 scale: weighted combination of above metrics
  symmetryAssessment: 'excellent' | 'good' | 'fair' | 'poor';  // Qualitative rating
}

/**
 * Container for dual-leg assessment metrics.
 * Includes full client metrics for both legs (with temporal data).
 */
export interface DualLegMetrics {
  leftLeg: ClientMetrics;           // Complete left leg test results
  rightLeg: ClientMetrics;          // Complete right leg test results
  symmetryAnalysis: SymmetryAnalysis; // Client-calculated comparison
}

/**
 * Client-calculated metrics in real-world units (cm, degrees).
 * Calculated from MediaPipe's worldLandmarks.
 */
export interface ClientMetrics {
  success: boolean;
  holdTime: number;
  failureReason?: string;
  // Sway metrics (cm)
  swayStdX: number;           // cm
  swayStdY: number;           // cm
  swayPathLength: number;     // cm
  swayVelocity: number;       // cm/s
  correctionsCount: number;
  // Arm metrics (degrees)
  armAngleLeft: number;       // degrees from horizontal (0° = T-position)
  armAngleRight: number;      // degrees from horizontal (0° = T-position)
  armAsymmetryRatio: number;
  // Temporal analysis
  temporal: ClientTemporalMetrics;
  // Enhanced temporal data for LLM (optional for backward compat)
  fiveSecondSegments?: FiveSecondSegment[];
  events?: BalanceEvent[];
}

/**
 * Assessment metrics returned from backend.
 * Consolidated single source of truth for all metrics.
 * All metrics in real-world units (cm, degrees).
 */
export interface AssessmentMetrics {
  // Test result
  success: boolean;
  holdTime: number;
  failureReason?: string;
  // Sway metrics (cm)
  swayStdX: number;           // cm
  swayStdY: number;           // cm
  swayPathLength: number;     // cm
  swayVelocity: number;       // cm/s
  correctionsCount: number;
  // Arm metrics (degrees)
  armAngleLeft: number;       // degrees from horizontal (0° = T-position)
  armAngleRight: number;      // degrees from horizontal (0° = T-position)
  armAsymmetryRatio: number;
  // LTAD Score (validated by Athletics Canada LTAD framework)
  durationScore: number;      // 1-5 LTAD scale
  // Temporal analysis
  temporal?: ClientTemporalMetrics;
  // Enhanced temporal data for LLM
  fiveSecondSegments?: FiveSecondSegment[];
  events?: BalanceEvent[];
}

export interface Assessment {
  id: string;
  athleteId: string;
  coachId: string;
  testType: TestType;
  legTested: LegTested;  // Now supports 'both'

  // Single-leg fields (now optional for backward compatibility)
  videoUrl?: string;
  videoPath?: string;

  // Dual-leg video fields (NEW)
  leftLegVideoUrl?: string;
  leftLegVideoPath?: string;
  rightLegVideoUrl?: string;
  rightLegVideoPath?: string;

  status: AssessmentStatus;
  createdAt: string;

  // Single-leg metrics (now optional for backward compatibility)
  metrics?: AssessmentMetrics;

  // Dual-leg metrics (NEW)
  leftLegMetrics?: AssessmentMetrics;
  rightLegMetrics?: AssessmentMetrics;
  bilateralComparison?: SymmetryAnalysis;  // Backend-enhanced symmetry analysis

  // Common fields
  aiCoachAssessment?: string;
  errorMessage?: string;
}

/**
 * Request payload for creating assessment (single-leg or dual-leg).
 *
 * BREAKING CHANGE: Field names updated for consistency:
 * - `videoUrl` → `leftVideoUrl`
 * - `videoPath` → `leftVideoPath`
 * - `duration` → `leftDuration`
 *
 * This ensures consistent naming for both single-leg and dual-leg modes.
 */
export interface AssessmentCreate {
  athleteId: string;
  testType: TestType;
  legTested: LegTested;

  // Single-leg fields (RENAMED for consistency)
  leftVideoUrl?: string;        // Left leg video URL (or single leg for legacy)
  leftVideoPath?: string;       // Left leg video storage path
  leftDuration?: number;        // Left leg video duration (seconds)
  clientMetrics?: ClientMetrics; // Single-leg metrics (legacy)

  // Dual-leg fields (NEW)
  rightVideoUrl?: string;       // Right leg video URL
  rightVideoPath?: string;      // Right leg video storage path
  rightDuration?: number;       // Right leg video duration (seconds)
  dualLegMetrics?: DualLegMetrics; // Dual-leg metrics with both legs
}
```

## Migration Notes

### Breaking Changes

**`AssessmentCreate` field renaming** (affects all components using this interface):

| Old Field Name | New Field Name | Notes |
|---------------|----------------|-------|
| `videoUrl` | `leftVideoUrl` | Always represents left leg (or single leg) |
| `videoPath` | `leftVideoPath` | Matches video URL |
| `duration` | `leftDuration` | Duration of left leg test |

**Impact**: Components creating assessments must update to use new field names:
- `UploadStep.tsx`
- Any other components calling `assessmentsService.analyzeVideo()`

**Mitigation**: Update all references in FE-021 (TwoLegUploadStep) and verify no other components are affected.

### Backward Compatibility

**Existing single-leg assessments**:
- Old assessments from backend use `videoUrl`, `videoPath`, `metrics`
- New `Assessment` interface makes all fields optional, so old responses remain valid
- Components reading assessments must handle both old and new field names

**Reading existing assessments**:
```typescript
// Works for both old and new assessments
const videoUrl = assessment.videoUrl || assessment.leftLegVideoUrl;
const metrics = assessment.metrics || assessment.leftLegMetrics;
```

## Environment Variables

None required.

## Estimated Complexity

**S** (Small) - 2-3 hours

**Breakdown**:
- Update existing types: 30 minutes
- Create new interfaces: 1 hour
- Add JSDoc comments: 30 minutes
- Testing and validation: 1 hour

## Testing Instructions

### 1. Type Checking

**Verify TypeScript compilation:**

```bash
cd client
npm run type-check  # or tsc --noEmit
```

Expected: No type errors.

### 2. Manual Testing in IDE

**Test type inference:**

Open `client/src/types/assessment.ts` in VS Code:

1. Hover over `LegTested` - should show `'left' | 'right' | 'both'`
2. Create test object:
   ```typescript
   const testSymmetry: SymmetryAnalysis = {
     holdTimeDifference: 1.5,
     holdTimeDifferencePct: 6.2,
     dominantLeg: 'left',
     swayVelocityDifference: 0.3,
     swaySymmetryScore: 0.85,
     armAngleDifference: 5.2,
     correctionsCountDifference: -2,
     overallSymmetryScore: 82.0,
     symmetryAssessment: 'good'
   };
   ```
3. Verify autocomplete works for all fields
4. Test invalid values trigger errors:
   ```typescript
   const invalid: SymmetryAnalysis = {
     // ... missing required fields
     dominantLeg: 'middle'  // Should error: not in type
   };
   ```

### 3. Unit Tests (Optional)

**Create test file** `client/src/types/__tests__/assessment.test.ts`:

```typescript
import { LegTested, SymmetryAnalysis, DualLegMetrics } from '../assessment';

describe('Assessment Types', () => {
  it('should accept valid LegTested values', () => {
    const left: LegTested = 'left';
    const right: LegTested = 'right';
    const both: LegTested = 'both';

    expect([left, right, both]).toEqual(['left', 'right', 'both']);
  });

  it('should create valid SymmetryAnalysis', () => {
    const symmetry: SymmetryAnalysis = {
      holdTimeDifference: 1.5,
      holdTimeDifferencePct: 6.2,
      dominantLeg: 'balanced',
      swayVelocityDifference: 0.3,
      swaySymmetryScore: 0.85,
      armAngleDifference: 5.2,
      correctionsCountDifference: -2,
      overallSymmetryScore: 82.0,
      symmetryAssessment: 'good'
    };

    expect(symmetry.dominantLeg).toBe('balanced');
  });
});
```

Run tests:
```bash
npm test -- assessment.test.ts
```

### 4. Backward Compatibility Test

**Verify old Assessment objects still parse:**

```typescript
// Simulate old backend response
const oldAssessment: Assessment = {
  id: 'assess123',
  athleteId: 'athlete456',
  coachId: 'coach789',
  testType: 'one_leg_balance',
  legTested: 'left',
  videoUrl: 'https://example.com/video.mp4',  // Old field
  videoPath: 'videos/video.mp4',              // Old field
  status: 'completed',
  createdAt: '2025-12-14T10:00:00Z',
  metrics: {
    success: true,
    holdTime: 25.3,
    // ... other metrics
  } as any
};

// Should compile without errors
expect(oldAssessment.videoUrl).toBeDefined();
expect(oldAssessment.leftLegVideoUrl).toBeUndefined();
```

## Notes

### Design Rationale

**Why rename `videoUrl` to `leftVideoUrl`?**

For single-leg assessments, the current naming is ambiguous:
- `videoUrl` could mean "the video of the leg being tested"
- For dual-leg, we need `leftVideoUrl` and `rightVideoUrl`
- Using `leftVideoUrl` for single-leg makes it consistent with dual-leg
- Reduces cognitive load when reading dual-leg code

**Why calculate symmetry client-side AND server-side?**

- **Client-side**: Quick feedback, no server round-trip, enables pre-upload validation
- **Server-side**: Authoritative calculation, can enhance with additional metrics, stored for historical analysis
- Backend may recalculate or add fields to `SymmetryAnalysis`

**Why use string literals instead of enums for `dominantLeg`?**

TypeScript string literal types provide:
- Type safety with autocomplete
- No runtime overhead (unlike enums)
- Simpler JSON serialization
- Consistent with `LegTested` type pattern

### Temporal Data Preservation

**Critical**: Both `leftLeg` and `rightLeg` in `DualLegMetrics` include full temporal data:
- `temporal`: FirstThird, MiddleThird, LastThird segments
- `fiveSecondSegments`: Optional 5-second granularity for LLM analysis
- `events`: Optional balance events (flapping, correction_burst, stabilized)

This rich temporal data enables the bilateral AI agent to provide insights like:
- "Left leg fatigued 20% faster than right leg (degradation after 15 seconds)"
- "Both legs showed correction bursts around 10-second mark, indicating core fatigue"

### Future Considerations

**Type guards** for discriminating single-leg vs dual-leg:

```typescript
// Could add helper functions in future
export function isDualLegAssessment(assessment: Assessment): boolean {
  return assessment.legTested === 'both';
}

export function getSingleLegMetrics(assessment: Assessment): AssessmentMetrics | undefined {
  return assessment.metrics || assessment.leftLegMetrics;
}
```

**Validation helpers** for `AssessmentCreate`:

```typescript
// Could add validation in FE-021
export function validateDualLegPayload(payload: AssessmentCreate): boolean {
  if (payload.legTested === 'both') {
    return !!(payload.leftVideoUrl && payload.rightVideoUrl && payload.dualLegMetrics);
  }
  return !!payload.leftVideoUrl;
}
```
