---
id: FE-020
status: 🔵 READY FOR DEVELOPMENT
depends_on: [FE-018]
blocks: [FE-022]
---

# FE-020: RecordingStep AutoStart Enhancement

## Title
Add autoStart and instructionText props to RecordingStep for seamless dual-leg test flow

## Scope

### In Scope
- Add `autoStart` boolean prop to skip camera setup and start immediately
- Add `instructionText` string prop for custom instruction banner
- Auto-start test when person is detected (in autoStart mode only)
- Display instruction banner at top of recording interface
- Maintain backward compatibility with existing single-leg flow

### Out of Scope
- TransitionModal component (FE-019)
- AssessmentFlow state machine refactor (FE-022)
- MediaPipe pose detection logic (already implemented)
- Video recording logic (already implemented)
- Test result calculation (already implemented)

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Prop Name | `autoStart` (boolean) | Clear, conventional naming; matches HTML `autoplay` pattern |
| Default Behavior | `autoStart={false}` | Preserve existing single-leg flow behavior |
| Instruction Display | MUI Alert component | Consistent with app's information display pattern |
| Auto-start Trigger | Person detected in frame | Matches existing test start logic; user-friendly |
| Phase Skip | Skip 'setup' phase, start in 'testing' | Simplest implementation; camera already selected in first leg |

## Acceptance Criteria

- [ ] `autoStart` prop defaults to `false` (existing behavior preserved)
- [ ] When `autoStart={false}`: existing camera setup flow works unchanged
- [ ] When `autoStart={true}`: component starts in 'testing' phase immediately
- [ ] When `autoStart={true}` and person detected: test countdown begins automatically
- [ ] `instructionText` displays in blue info Alert at top of interface
- [ ] Instruction banner visible throughout recording phase
- [ ] Alert dismisses after test completes (not during countdown/recording)
- [ ] Props are optional (TypeScript types enforce this)
- [ ] No breaking changes to existing `RecordingStep` usage

## Files to Create/Modify

```
client/src/pages/Assessment/steps/
└── RecordingStep.tsx              # Modify: Add props and auto-start logic
```

## Implementation Details

### 1. Update Props Interface

**File**: `client/src/pages/Assessment/steps/RecordingStep.tsx`

**Locate existing props interface** (likely near top of file):

```typescript
interface RecordingStepProps {
  athleteId: string;
  testType: TestType;
  legTested: LegTested;
  onRecordingComplete: (blob: Blob, duration: number, result: TestResult) => void;
  onBack?: () => void;

  // NEW PROPS
  autoStart?: boolean;         // Skip setup, go straight to testing
  instructionText?: string;    // Custom instruction banner
}
```

### 2. Update State Initialization

**Locate state declarations** (likely using `useState`):

**Before**:
```typescript
const [phase, setPhase] = useState<RecordingPhase>('setup');
```

**After**:
```typescript
const [phase, setPhase] = useState<RecordingPhase>(
  autoStart ? 'testing' : 'setup'
);
```

**Note**: `RecordingPhase` type likely defined as:
```typescript
type RecordingPhase = 'setup' | 'testing' | 'countdown' | 'recording' | 'complete';
```

### 3. Add Auto-Start Effect

**Add new `useEffect` hook** after existing effects (or integrate with pose detection effect):

```typescript
// Auto-start test when person is detected (only in autoStart mode)
useEffect(() => {
  if (!autoStart) return; // Only in autoStart mode
  if (phase !== 'testing') return; // Only in testing phase
  if (!isPersonDetected) return; // Wait for person
  if (testState !== 'idle') return; // Don't interrupt ongoing test

  // Small delay to ensure stable pose
  const autoStartTimer = setTimeout(() => {
    if (isPersonDetected && testState === 'idle') {
      startTest(); // Call existing test start function
    }
  }, 1000); // 1 second delay for pose stabilization

  return () => clearTimeout(autoStartTimer);
}, [autoStart, phase, isPersonDetected, testState]);
```

**Dependencies**:
- `isPersonDetected`: Likely existing state from MediaPipe pose detection
- `testState`: Likely existing state ('idle' | 'countdown' | 'recording')
- `startTest`: Likely existing function to initiate countdown

### 4. Add Instruction Banner

**Add Alert component** at top of render (inside main container):

```typescript
return (
  <Box sx={{ width: '100%', minHeight: '100vh', position: 'relative' }}>
    {/* NEW: Instruction Banner */}
    {instructionText && phase !== 'complete' && (
      <Alert
        severity="info"
        sx={{
          position: 'absolute',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          minWidth: { xs: '90%', sm: 400 },
          fontSize: '1.1rem',
          fontWeight: 'medium',
        }}
      >
        {instructionText}
      </Alert>
    )}

    {/* Existing video/canvas elements */}
    <video ref={videoRef} ... />
    <canvas ref={canvasRef} ... />

    {/* Rest of component */}
    {/* ... */}
  </Box>
);
```

**Styling notes**:
- `position: absolute` keeps it floating above video
- `zIndex: 1000` ensures visibility over video/canvas
- `transform: translateX(-50%)` centers horizontally
- Responsive width (90% on mobile, fixed 400px on desktop)
- Hides when `phase === 'complete'` (test finished)

### 5. Import Statement Update

**Add Alert import** to existing MUI imports:

```typescript
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,  // NEW
  // ... other imports
} from '@mui/material';
```

### 6. Complete Implementation Example

**Conceptual integration** (exact implementation depends on existing RecordingStep structure):

```typescript
interface RecordingStepProps {
  athleteId: string;
  testType: TestType;
  legTested: LegTested;
  onRecordingComplete: (blob: Blob, duration: number, result: TestResult) => void;
  onBack?: () => void;
  autoStart?: boolean;
  instructionText?: string;
}

export const RecordingStep: React.FC<RecordingStepProps> = ({
  athleteId,
  testType,
  legTested,
  onRecordingComplete,
  onBack,
  autoStart = false,        // Default to false
  instructionText,
}) => {
  // State
  const [phase, setPhase] = useState<RecordingPhase>(
    autoStart ? 'testing' : 'setup'
  );
  const [isPersonDetected, setIsPersonDetected] = useState(false);
  const [testState, setTestState] = useState<'idle' | 'countdown' | 'recording'>('idle');
  // ... other existing state

  // Existing effects (MediaPipe setup, pose detection, etc.)
  // ...

  // NEW: Auto-start effect
  useEffect(() => {
    if (!autoStart) return;
    if (phase !== 'testing') return;
    if (!isPersonDetected) return;
    if (testState !== 'idle') return;

    const autoStartTimer = setTimeout(() => {
      if (isPersonDetected && testState === 'idle') {
        startTest();
      }
    }, 1000);

    return () => clearTimeout(autoStartTimer);
  }, [autoStart, phase, isPersonDetected, testState]);

  // Existing functions (startTest, handleRecordingComplete, etc.)
  // ...

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', position: 'relative', bgcolor: 'grey.900' }}>
      {/* Instruction Banner */}
      {instructionText && phase !== 'complete' && (
        <Alert
          severity="info"
          sx={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            minWidth: { xs: '90%', sm: 400 },
            fontSize: '1.1rem',
            fontWeight: 'medium',
          }}
        >
          {instructionText}
        </Alert>
      )}

      {/* Existing rendering logic */}
      {phase === 'setup' && (
        // Camera setup UI (skipped if autoStart=true)
        <CameraSetup onReady={() => setPhase('testing')} />
      )}

      {phase === 'testing' && (
        <>
          <video ref={videoRef} ... />
          <canvas ref={canvasRef} ... />
          {/* Skeleton overlay, countdown, etc. */}
        </>
      )}

      {/* ... rest of component */}
    </Box>
  );
};
```

## Environment Variables

None required.

## Estimated Complexity

**S** (Small) - 2-3 hours

**Breakdown**:
- Add props and update interface: 15 minutes
- Update phase initialization: 15 minutes
- Implement auto-start effect: 1 hour
- Add instruction banner: 30 minutes
- Testing and debugging: 1 hour

## Testing Instructions

### 1. Backward Compatibility Test (Existing Flow)

**Verify no breaking changes to single-leg flow:**

```bash
# Start dev server
cd client
npm run dev

# Navigate to assessment flow
# /assess/:athleteId (existing flow without autoStart)
```

**Test Cases**:
1. Start single-leg assessment (as before)
2. Verify camera setup screen appears (phase='setup')
3. Select camera and proceed
4. Verify testing phase works normally
5. Complete test
6. Verify no instruction banner appears

**Expected**: Existing behavior unchanged.

### 2. AutoStart Mode Test

**Create test wrapper** or modify `AssessmentFlow.tsx` temporarily:

```typescript
// Temporary test in AssessmentFlow.tsx
<RecordingStep
  athleteId={athleteId}
  testType="one_leg_balance"
  legTested="right"
  autoStart={true}
  instructionText="Testing RIGHT leg"
  onRecordingComplete={handleComplete}
/>
```

**Test Cases**:

1. **Immediate Testing Phase**:
   - Component loads
   - Verify phase starts at 'testing' (no camera setup screen)
   - Verify video stream active immediately

2. **Auto-Start Trigger**:
   - Stand in front of camera
   - Wait for pose detection (skeleton appears)
   - Wait ~1 second
   - Verify countdown begins automatically (3... 2... 1...)

3. **Instruction Banner**:
   - Verify blue Alert appears at top
   - Text reads: "Testing RIGHT leg"
   - Banner visible during setup, countdown, recording
   - Banner disappears after test completes

4. **Person Detection Required**:
   - Start with no person in frame
   - Verify countdown does NOT auto-start
   - Step into frame
   - Verify countdown begins after ~1 second

### 3. Dual-Leg Sequential Flow Test

**Full integration test** (requires FE-022 partially implemented):

```typescript
// Simulate left-then-right flow
const [phase, setPhase] = useState<'left' | 'right'>('left');

{phase === 'left' && (
  <RecordingStep
    legTested="left"
    autoStart={false}  // Manual start for first leg
    onRecordingComplete={(blob, duration, result) => {
      // Save left data
      setPhase('right');
    }}
  />
)}

{phase === 'right' && (
  <RecordingStep
    legTested="right"
    autoStart={true}   // Auto-start for second leg
    instructionText="Testing RIGHT leg"
    onRecordingComplete={(blob, duration, result) => {
      // Save right data
      console.log('Both legs complete!');
    }}
  />
)}
```

**Test Flow**:
1. Complete left leg test manually
2. Right leg test loads with autoStart
3. Step into frame
4. Verify countdown auto-starts
5. Complete test
6. Verify both results captured

### 4. Edge Cases

**Test Case 1: Auto-start with person already in frame**
- Stand in front of camera
- Load component with `autoStart={true}`
- Expected: Countdown begins ~1 second after load

**Test Case 2: Person leaves frame during auto-start**
- Stand in front of camera
- Auto-start countdown begins
- Step out of frame
- Expected: Countdown should continue or fail appropriately (depends on existing logic)

**Test Case 3: No instructionText provided**
- Load with `autoStart={true}` but no `instructionText`
- Expected: No banner appears, no errors

**Test Case 4: Long instruction text**
- Use `instructionText="This is a very long instruction that should wrap properly on mobile devices"`
- Resize to 320px width
- Expected: Text wraps, banner readable, no overflow

### 5. Responsive Testing

**Desktop (1024px+)**:
```bash
1. Load with instructionText
2. Verify banner width = 400px (fixed)
3. Verify centered horizontally
4. Verify does not overlap countdown timer
```

**Mobile (375px)**:
```bash
1. Load with instructionText
2. Verify banner width = 90% (responsive)
3. Verify text readable
4. Verify does not block critical UI elements
```

### 6. Unit Tests (Optional)

**Create test file** `client/src/pages/Assessment/steps/__tests__/RecordingStep.test.tsx`:

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { RecordingStep } from '../RecordingStep';

// Mock MediaPipe and camera
jest.mock('@mediapipe/pose', () => ({ /* ... */ }));

describe('RecordingStep - AutoStart', () => {
  const mockOnRecordingComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts in setup phase when autoStart is false', () => {
    render(
      <RecordingStep
        athleteId="test"
        testType="one_leg_balance"
        legTested="left"
        autoStart={false}
        onRecordingComplete={mockOnRecordingComplete}
      />
    );

    // Verify camera setup UI present (exact text depends on implementation)
    expect(screen.getByText(/select camera/i)).toBeInTheDocument();
  });

  it('starts in testing phase when autoStart is true', () => {
    render(
      <RecordingStep
        athleteId="test"
        testType="one_leg_balance"
        legTested="right"
        autoStart={true}
        onRecordingComplete={mockOnRecordingComplete}
      />
    );

    // Verify camera setup UI NOT present
    expect(screen.queryByText(/select camera/i)).not.toBeInTheDocument();
  });

  it('displays instruction banner when instructionText provided', () => {
    render(
      <RecordingStep
        athleteId="test"
        testType="one_leg_balance"
        legTested="right"
        autoStart={true}
        instructionText="Testing RIGHT leg"
        onRecordingComplete={mockOnRecordingComplete}
      />
    );

    expect(screen.getByText('Testing RIGHT leg')).toBeInTheDocument();
  });

  it('does not display banner when instructionText not provided', () => {
    const { container } = render(
      <RecordingStep
        athleteId="test"
        testType="one_leg_balance"
        legTested="left"
        autoStart={false}
        onRecordingComplete={mockOnRecordingComplete}
      />
    );

    // Verify no Alert component
    expect(container.querySelector('.MuiAlert-root')).not.toBeInTheDocument();
  });
});
```

## Notes

### Design Rationale

**Why 1-second delay before auto-start?**

Without delay:
- Pose detection might trigger immediately on first frame
- User might not be in stable position
- Could start test while user is still positioning

With 1-second delay:
- Gives user time to stabilize position
- Reduces false starts
- Improves test quality

**Why hide instruction banner on 'complete' phase?**

- After test completes, user sees results screen
- Instruction no longer relevant
- Reduces visual clutter
- Keeps focus on test results

**Why not auto-proceed to next leg without modal?**

Considered fully automatic flow (left → right without pause), but:
- User needs mental transition between legs
- Chance to review left leg result
- Opportunity to reshoot if unsatisfied
- Better UX for sequential tasks

### Integration with AssessmentFlow

**AssessmentFlow will use this component like:**

```typescript
// Phase 1: Left leg (manual start)
{phase === 'left-leg-testing' && (
  <RecordingStep
    legTested="left"
    autoStart={false}  // User controls start
    onRecordingComplete={handleLeftLegComplete}
  />
)}

// Phase 2: Right leg (auto-start)
{phase === 'right-leg-testing' && (
  <RecordingStep
    legTested="right"
    autoStart={true}  // Seamless transition
    instructionText="Testing RIGHT leg"
    onRecordingComplete={handleRightLegComplete}
  />
)}
```

### Alternative Approaches Considered

**Option A: Separate AutoRecordingStep component**
- Pros: Cleaner separation, no props bloat
- Cons: Code duplication, harder to maintain

**Option B: Auto-start by default for second leg**
- Pros: No prop needed
- Cons: Less flexible, harder to test

**Option C: Auto-start based on legTested prop**
- Pros: Automatic detection
- Cons: Magic behavior, less explicit

**Chosen: Explicit `autoStart` prop**
- Clear intent in component usage
- Easy to test both modes
- Flexible for future use cases

### Future Enhancements

**Could add** (not in MVP scope):

1. **Auto-start countdown display**: "Test starting in 3... 2... 1..." before actual test countdown
2. **Skip instruction button**: Allow user to dismiss banner early
3. **Audio cue**: Sound notification when auto-start triggered
4. **Visual highlight**: Pulse effect on instruction banner to draw attention

### Accessibility Considerations

**Instruction Banner**:
- Use `role="status"` for live region announcement
- Ensure sufficient color contrast (MUI Alert handles this)
- Avoid auto-dismissal (keep visible until phase completes)

**Auto-start**:
- Ensure auto-start delay (1 second) gives time for screen reader announcement
- Consider adding `aria-live="polite"` announcement when countdown begins
