---
id: FE-021
status: ✅ COMPLETE
depends_on: [FE-018]
blocks: [FE-022]
---

# FE-021: TwoLegUploadStep Component

## Title
Create component to handle sequential video uploads, client-side symmetry calculation, and dual-leg assessment submission

## Scope

### In Scope
- Create `TwoLegUploadStep` component for dual-leg assessment upload
- Sequential upload of left and right leg videos to Firebase Storage
- Client-side symmetry analysis calculation
- Submit dual-leg assessment to backend with `legTested='both'`
- Upload progress indicators for both videos
- Error handling with retry option
- Navigate to results page on completion

### Out of Scope
- Single-leg upload logic (already exists in `UploadStep.tsx`)
- Firebase Storage configuration (already configured)
- Backend dual-leg endpoint implementation (BE-019)
- Results display (FE-023)
- AssessmentFlow state machine (FE-022)

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Upload Strategy | Sequential (left then right) | Simpler error handling; clearer progress; avoids concurrent upload issues |
| Symmetry Calculation | Client-side before submission | Reduces backend processing; enables pre-submission validation |
| Progress Display | Two separate LinearProgress bars | Clear visual feedback for each video |
| Error Recovery | Retry button per video | User can retry failed upload without restarting flow |
| Field Naming | Use `leftVideoUrl` / `rightVideoUrl` | Consistent with FE-018 naming convention |

## Acceptance Criteria

- [ ] Component accepts `leftLegData` and `rightLegData` props
- [ ] Left video uploads to Firebase Storage with progress indicator
- [ ] Right video uploads after left completes successfully
- [ ] Both uploads show individual progress percentages (0-100%)
- [ ] Symmetry analysis calculates all required fields from test results
- [ ] Backend receives `legTested='both'` with `dualLegMetrics`
- [ ] Upload errors display with retry button
- [ ] On success, navigates to `/assessments/:id` with new assessment ID
- [ ] Loading state prevents duplicate submissions
- [ ] Component works on mobile and desktop

## Files to Create/Modify

```
client/src/pages/Assessment/components/
└── TwoLegUploadStep.tsx       # NEW: Dual-leg upload component

client/src/utils/
└── symmetryCalculation.ts     # NEW: Symmetry analysis utility (optional)
```

## Implementation Details

### 1. Component Props and State

**File**: `client/src/pages/Assessment/components/TwoLegUploadStep.tsx`

```typescript
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
import { uploadVideo } from '../../../services/storage';
import { assessmentsService } from '../../../services/assessments';
import { ClientMetrics, DualLegMetrics, SymmetryAnalysis } from '../../../types/assessment';

interface LegTestData {
  blob: Blob;
  duration: number;
  result: ClientMetrics;  // Full test result including temporal data
}

interface TwoLegUploadStepProps {
  athleteId: string;
  leftLegData: LegTestData;
  rightLegData: LegTestData;
  onComplete?: (assessmentId: string) => void;
}

type UploadPhase = 'uploading-left' | 'uploading-right' | 'submitting' | 'complete' | 'error';

export const TwoLegUploadStep: React.FC<TwoLegUploadStepProps> = ({
  athleteId,
  leftLegData,
  rightLegData,
  onComplete,
}) => {
  const navigate = useNavigate();

  // State
  const [phase, setPhase] = useState<UploadPhase>('uploading-left');
  const [leftProgress, setLeftProgress] = useState(0);
  const [rightProgress, setRightProgress] = useState(0);
  const [leftVideoUrl, setLeftVideoUrl] = useState<string>('');
  const [leftVideoPath, setLeftVideoPath] = useState<string>('');
  const [rightVideoUrl, setRightVideoUrl] = useState<string>('');
  const [rightVideoPath, setRightVideoPath] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);

  // ... implementation continues below
};
```

### 2. Upload Effect

```typescript
// Auto-start upload process on mount
useEffect(() => {
  uploadBothVideos();
}, []);

const uploadBothVideos = async () => {
  try {
    // Step 1: Upload left leg video
    setPhase('uploading-left');
    const leftResult = await uploadVideo(
      leftLegData.blob,
      athleteId,
      'left',
      (progress) => setLeftProgress(progress)
    );
    setLeftVideoUrl(leftResult.url);
    setLeftVideoPath(leftResult.path);

    // Step 2: Upload right leg video
    setPhase('uploading-right');
    const rightResult = await uploadVideo(
      rightLegData.blob,
      athleteId,
      'right',
      (progress) => setRightProgress(progress)
    );
    setRightVideoUrl(rightResult.url);
    setRightVideoPath(rightResult.path);

    // Step 3: Calculate symmetry and submit
    setPhase('submitting');
    await submitDualLegAssessment(leftResult, rightResult);

  } catch (err: any) {
    setError(err.message || 'Upload failed');
    setPhase('error');
  }
};
```

### 3. Symmetry Calculation

```typescript
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
```

### 4. Backend Submission

```typescript
const submitDualLegAssessment = async (
  leftUploadResult: { url: string; path: string },
  rightUploadResult: { url: string; path: string }
) => {
  // Calculate symmetry from test results
  const symmetryAnalysis = calculateSymmetry(
    leftLegData.result,
    rightLegData.result
  );

  // Build dual-leg metrics payload
  const dualLegMetrics: DualLegMetrics = {
    leftLeg: leftLegData.result,
    rightLeg: rightLegData.result,
    symmetryAnalysis,
  };

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

  const response = await assessmentsService.analyzeVideo(payload);
  setAssessmentId(response.id);
  setPhase('complete');

  // Navigate to results or call onComplete callback
  if (onComplete) {
    onComplete(response.id);
  } else {
    navigate(`/assessments/${response.id}`);
  }
};
```

### 5. Render UI

```typescript
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
```

### 6. Complete File

**File**: `client/src/pages/Assessment/components/TwoLegUploadStep.tsx`

See sections 1-5 above for the complete implementation. Total file length: ~250 lines.

## Environment Variables

None required (uses existing Firebase and API configuration).

## Estimated Complexity

**M** (Medium) - 4 hours

**Breakdown**:
- Component structure and props: 30 minutes
- Sequential upload logic: 1 hour
- Symmetry calculation: 1 hour
- Backend submission: 30 minutes
- UI and error handling: 1 hour

## Testing Instructions

### 1. Manual End-to-End Test

**Setup test harness** in `AssessmentFlow.tsx` or create standalone page:

```typescript
import { TwoLegUploadStep } from './components/TwoLegUploadStep';

// Create mock test data
const mockLeftLegData = {
  blob: new Blob([/* mock video data */], { type: 'video/webm' }),
  duration: 25.3,
  result: {
    success: true,
    holdTime: 25.3,
    swayVelocity: 2.1,
    correctionsCount: 8,
    armAngleLeft: 10.5,
    armAngleRight: 12.3,
    // ... other metrics
  } as ClientMetrics,
};

const mockRightLegData = {
  blob: new Blob([/* mock video data */], { type: 'video/webm' }),
  duration: 23.8,
  result: {
    success: true,
    holdTime: 23.8,
    swayVelocity: 2.3,
    correctionsCount: 10,
    armAngleLeft: 9.8,
    armAngleRight: 11.5,
    // ... other metrics
  } as ClientMetrics,
};

// Render component
<TwoLegUploadStep
  athleteId="test-athlete-123"
  leftLegData={mockLeftLegData}
  rightLegData={mockRightLegData}
  onComplete={(id) => console.log('Assessment ID:', id)}
/>
```

**Test Flow**:
1. Component renders
2. Left video upload starts automatically
3. Progress bar updates (0% → 100%)
4. Checkmark appears next to "Left Leg Video"
5. Right video upload begins
6. Right progress bar updates (0% → 100%)
7. "Calculating symmetry..." message appears
8. Success alert appears
9. Redirects to `/assessments/:id` or calls `onComplete`

### 2. Error Handling Tests

**Test Case 1: Left upload fails**

Mock `uploadVideo` to throw error:
```typescript
jest.mock('../../../services/storage', () => ({
  uploadVideo: jest.fn().mockRejectedValueOnce(new Error('Network error')),
}));
```

Expected:
- Left upload fails
- Error alert appears with "Network error"
- Retry button visible
- Clicking Retry restarts upload

**Test Case 2: Right upload fails**

Mock first upload success, second fails:
```typescript
uploadVideo
  .mockResolvedValueOnce({ url: 'left.mp4', path: 'videos/left' })
  .mockRejectedValueOnce(new Error('Storage quota exceeded'));
```

Expected:
- Left upload completes (100%, checkmark)
- Right upload fails
- Error alert shows "Storage quota exceeded"
- Retry button restarts BOTH uploads (current implementation)

**Test Case 3: Backend submission fails**

Mock `assessmentsService.analyzeVideo` to throw error:
```typescript
jest.mock('../../../services/assessments', () => ({
  assessmentsService: {
    analyzeVideo: jest.fn().mockRejectedValue(new Error('Validation error')),
  },
}));
```

Expected:
- Both uploads complete
- Submission fails
- Error alert shows "Validation error"
- Retry button available

### 3. Symmetry Calculation Tests

**Unit test** for `calculateSymmetry` function:

```typescript
describe('calculateSymmetry', () => {
  it('calculates balanced legs correctly', () => {
    const left: ClientMetrics = {
      success: true,
      holdTime: 25.0,
      swayVelocity: 2.0,
      correctionsCount: 8,
      armAngleLeft: 10,
      armAngleRight: 12,
      // ... minimal required fields
    } as ClientMetrics;

    const right: ClientMetrics = {
      success: true,
      holdTime: 24.0,
      swayVelocity: 2.1,
      correctionsCount: 9,
      armAngleLeft: 11,
      armAngleRight: 13,
      // ...
    } as ClientMetrics;

    const symmetry = calculateSymmetry(left, right);

    expect(symmetry.holdTimeDifference).toBe(1.0);
    expect(symmetry.holdTimeDifferencePct).toBeCloseTo(4.0, 1); // 1/25 * 100
    expect(symmetry.dominantLeg).toBe('balanced'); // <20% diff
    expect(symmetry.overallSymmetryScore).toBeGreaterThan(70);
    expect(symmetry.symmetryAssessment).toBe('good');
  });

  it('identifies dominant leg correctly', () => {
    const left: ClientMetrics = {
      success: true,
      holdTime: 30.0, // Much better
      // ...
    } as ClientMetrics;

    const right: ClientMetrics = {
      success: true,
      holdTime: 20.0,
      // ...
    } as ClientMetrics;

    const symmetry = calculateSymmetry(left, right);

    expect(symmetry.dominantLeg).toBe('left');
    expect(symmetry.holdTimeDifferencePct).toBeCloseTo(33.3, 1); // >20% diff
  });

  it('handles perfect symmetry', () => {
    const identical: ClientMetrics = {
      success: true,
      holdTime: 25.0,
      swayVelocity: 2.0,
      correctionsCount: 8,
      // ...
    } as ClientMetrics;

    const symmetry = calculateSymmetry(identical, identical);

    expect(symmetry.holdTimeDifference).toBe(0);
    expect(symmetry.holdTimeDifferencePct).toBe(0);
    expect(symmetry.swaySymmetryScore).toBe(1.0);
    expect(symmetry.overallSymmetryScore).toBe(100);
    expect(symmetry.symmetryAssessment).toBe('excellent');
  });
});
```

### 4. Integration Test with Backend

**Requires backend BE-019 implemented**:

```bash
# Start backend
cd backend
uvicorn app.main:app --reload

# Start frontend
cd client
npm run dev
```

**Test Flow**:
1. Complete left leg test in browser
2. Complete right leg test
3. Observe TwoLegUploadStep in action
4. Check browser network tab:
   - Two video uploads to Firebase Storage
   - One POST to `/assessments/analyze` with `legTested='both'`
5. Verify backend response includes assessment ID
6. Verify redirect to results page works

### 5. Responsive Testing

**Desktop (1024px+)**:
- Card width: maxWidth 600px, centered
- Progress bars clearly visible
- Text readable

**Mobile (375px)**:
- Card width: 100% with padding
- Progress bars stacked vertically
- Buttons full-width on small screens
- Text wraps appropriately

## Notes

### Design Rationale

**Why sequential uploads instead of parallel?**

Parallel uploads considered:
```typescript
await Promise.all([
  uploadVideo(leftLegData.blob, ...),
  uploadVideo(rightLegData.blob, ...)
]);
```

Rejected because:
- Harder to show individual progress
- Both uploads compete for bandwidth
- Error handling more complex (which one failed?)
- Sequential provides clearer UX

**Why calculate symmetry client-side?**

Benefits:
- Immediate feedback (no server round-trip)
- Reduces backend load
- Enables pre-submission validation
- Client has all raw data already

Trade-offs:
- Backend may recalculate for authoritative record
- Calculation logic duplicated (client + server)

Decision: Client calculates for UX, backend validates for authority.

**Why include temporal data in submission?**

Both `leftLeg` and `rightLeg` in `dualLegMetrics` include:
- `temporal`: FirstThird, MiddleThird, LastThird
- `fiveSecondSegments`: Optional 5-second breakdowns
- `events`: Optional balance events

This enables AI agent to provide rich bilateral feedback:
- "Left leg fatigued 20% faster in final third"
- "Both legs showed correction bursts at 12-second mark"

### Error Recovery Strategy

**Current Implementation**: Retry button restarts entire upload flow

**Alternative Considered**: Resume from failure point
- Pros: Faster recovery, better UX
- Cons: Complex state management, Firebase resumable uploads not simple

**Decision**: Full restart acceptable for MVP. Videos are small (~2-5 MB), upload time is 5-15 seconds.

### Future Enhancements

**Could add** (not in MVP scope):

1. **Upload Cancellation**: Cancel button during upload
2. **Offline Support**: Queue uploads for later if offline
3. **Comparison Preview**: Show quick symmetry summary before submission
4. **Validation**: Warn if symmetry very poor (>50% difference)
5. **Compression**: Client-side video compression before upload

### Symmetry Calculation Weights

**Current Formula**:
- Duration: 50% (most important for LTAD scoring)
- Sway: 30% (key balance metric)
- Arm angles: 10% (secondary indicator)
- Corrections: 10% (frequency metric)

**Future Tuning**: May adjust weights based on:
- Coach feedback on accuracy
- Correlation with professional assessments
- Age-specific patterns
