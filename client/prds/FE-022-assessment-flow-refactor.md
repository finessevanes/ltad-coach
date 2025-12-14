---
id: FE-022
status: ✅ COMPLETE
depends_on: [FE-019, FE-020, FE-021]
blocks: []
---

# FE-022: AssessmentFlow State Machine Refactor

## Title
Refactor AssessmentFlow to remove Stepper UI and implement phase-based state machine for seamless dual-leg testing

## Scope

### In Scope
- Remove MUI Stepper component and step-based navigation
- Implement phase state machine: `'left-leg-testing' | 'transition-modal' | 'right-leg-testing' | 'uploading'`
- Store separate state for left and right leg test data
- Wire up TransitionModal between leg tests
- Auto-start right leg test with instructionText
- Integrate TwoLegUploadStep for final submission
- Maintain single assessment creation (one assessment with dual metrics)

### Out of Scope
- TransitionModal component implementation (FE-019)
- RecordingStep autoStart prop (FE-020)
- TwoLegUploadStep component (FE-021)
- Backend dual-leg endpoint (BE-019)
- Results display (FE-023)
- Single-leg assessment flow changes (preserve existing behavior if needed)

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| State Management | React useState for phase machine | Simple, no external state library needed |
| Test Data Storage | Two separate state variables (`leftLegData`, `rightLegData`) | Clear separation, easy to pass to upload component |
| Navigation Pattern | Direct to camera, no stepper | Faster flow, eliminates unnecessary setup screen |
| Reshoot Handling | Reset left data and return to left-testing phase | Simple state reset, clear user intent |
| Route | `/assess/:athleteId` (single route) | Phase-based rendering eliminates need for multiple routes |

## Acceptance Criteria

- [ ] Stepper component removed from AssessmentFlow
- [ ] Flow starts directly in left leg testing phase
- [ ] Left leg test completion triggers TransitionModal
- [ ] "Continue" button in modal starts right leg test automatically
- [ ] "Reshoot Left" button clears left data and restarts left test
- [ ] Right leg test shows "Testing RIGHT leg" instruction banner
- [ ] Right leg completion triggers TwoLegUploadStep
- [ ] Both test results stored in component state until submission
- [ ] Single assessment created with `legTested='both'`
- [ ] On completion, navigates to `/assessments/:id`
- [ ] No breaking changes to single-leg flow (if still accessible)

## Files to Create/Modify

```
client/src/pages/Assessment/
└── AssessmentFlow.tsx             # Modify: Refactor to phase-based state machine
```

## Implementation Details

### 1. Remove Stepper Imports and State

**File**: `client/src/pages/Assessment/AssessmentFlow.tsx`

**Remove these imports**:
```typescript
// DELETE
import { Stepper, Step, StepLabel } from '@mui/material';
```

**Remove stepper-related state**:
```typescript
// DELETE
const [activeStep, setActiveStep] = useState(0);
const steps = ['Setup', 'Record', 'Review', 'Upload'];
```

### 2. Add Phase State Machine

**Add new imports**:
```typescript
import { TransitionModal } from './components/TransitionModal';
import { TwoLegUploadStep } from './components/TwoLegUploadStep';
import { RecordingStep } from './steps/RecordingStep';
import { ClientMetrics } from '../../types/assessment';
```

**Add new state**:
```typescript
type TwoLegPhase = 'left-leg-testing' | 'transition-modal' | 'right-leg-testing' | 'uploading';

interface LegTestData {
  blob: Blob;
  duration: number;
  result: ClientMetrics;
}

const AssessmentFlow: React.FC = () => {
  const { athleteId } = useParams<{ athleteId: string }>();
  const navigate = useNavigate();

  // Phase state machine
  const [phase, setPhase] = useState<TwoLegPhase>('left-leg-testing');

  // Test data storage
  const [leftLegData, setLeftLegData] = useState<LegTestData | null>(null);
  const [rightLegData, setRightLegData] = useState<LegTestData | null>(null);

  // Modal visibility
  const [showTransitionModal, setShowTransitionModal] = useState(false);

  // ... rest of implementation
};
```

### 3. Implement Phase Handlers

```typescript
/**
 * Left leg test complete - show transition modal
 */
const handleLeftLegComplete = (blob: Blob, duration: number, result: ClientMetrics) => {
  setLeftLegData({ blob, duration, result });
  setShowTransitionModal(true);
  setPhase('transition-modal');
};

/**
 * User clicks "Continue to Right Leg" in modal
 */
const handleContinueToRightLeg = () => {
  setShowTransitionModal(false);
  setPhase('right-leg-testing');
};

/**
 * User clicks "Reshoot Left Leg" in modal
 */
const handleReshootLeftLeg = () => {
  setShowTransitionModal(false);
  setLeftLegData(null); // Clear left leg data
  setPhase('left-leg-testing'); // Return to first phase
};

/**
 * Right leg test complete - proceed to upload
 */
const handleRightLegComplete = (blob: Blob, duration: number, result: ClientMetrics) => {
  setRightLegData({ blob, duration, result });
  setPhase('uploading');
};

/**
 * Upload complete - navigate to results
 */
const handleUploadComplete = (assessmentId: string) => {
  navigate(`/assessments/${assessmentId}`);
};
```

### 4. Implement Phase-Based Rendering

```typescript
return (
  <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
    {/* Phase 1: Left Leg Testing */}
    {phase === 'left-leg-testing' && (
      <RecordingStep
        athleteId={athleteId!}
        testType="one_leg_balance"
        legTested="left"
        autoStart={false}  // Manual start for first leg
        onRecordingComplete={handleLeftLegComplete}
      />
    )}

    {/* Phase 2: Transition Modal */}
    <TransitionModal
      open={showTransitionModal}
      leftLegResult={leftLegData?.result || null}
      onContinue={handleContinueToRightLeg}
      onReshootLeft={handleReshootLeftLeg}
    />

    {/* Phase 3: Right Leg Testing */}
    {phase === 'right-leg-testing' && (
      <RecordingStep
        athleteId={athleteId!}
        testType="one_leg_balance"
        legTested="right"
        autoStart={true}  // Auto-start for seamless transition
        instructionText="Testing RIGHT leg"
        onRecordingComplete={handleRightLegComplete}
      />
    )}

    {/* Phase 4: Upload Both Videos */}
    {phase === 'uploading' && leftLegData && rightLegData && (
      <TwoLegUploadStep
        athleteId={athleteId!}
        leftLegData={leftLegData}
        rightLegData={rightLegData}
        onComplete={handleUploadComplete}
      />
    )}
  </Box>
);
```

### 5. Complete Refactored File

**File**: `client/src/pages/Assessment/AssessmentFlow.tsx`

```typescript
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { RecordingStep } from './steps/RecordingStep';
import { TransitionModal } from './components/TransitionModal';
import { TwoLegUploadStep } from './components/TwoLegUploadStep';
import { ClientMetrics } from '../../types/assessment';

type TwoLegPhase = 'left-leg-testing' | 'transition-modal' | 'right-leg-testing' | 'uploading';

interface LegTestData {
  blob: Blob;
  duration: number;
  result: ClientMetrics;
}

export const AssessmentFlow: React.FC = () => {
  const { athleteId } = useParams<{ athleteId: string }>();
  const navigate = useNavigate();

  // Phase state machine
  const [phase, setPhase] = useState<TwoLegPhase>('left-leg-testing');

  // Test data storage
  const [leftLegData, setLeftLegData] = useState<LegTestData | null>(null);
  const [rightLegData, setRightLegData] = useState<LegTestData | null>(null);

  // Modal visibility
  const [showTransitionModal, setShowTransitionModal] = useState(false);

  /**
   * Left leg test complete - show transition modal
   */
  const handleLeftLegComplete = (blob: Blob, duration: number, result: ClientMetrics) => {
    setLeftLegData({ blob, duration, result });
    setShowTransitionModal(true);
    setPhase('transition-modal');
  };

  /**
   * User clicks "Continue to Right Leg" in modal
   */
  const handleContinueToRightLeg = () => {
    setShowTransitionModal(false);
    setPhase('right-leg-testing');
  };

  /**
   * User clicks "Reshoot Left Leg" in modal
   */
  const handleReshootLeftLeg = () => {
    setShowTransitionModal(false);
    setLeftLegData(null);
    setPhase('left-leg-testing');
  };

  /**
   * Right leg test complete - proceed to upload
   */
  const handleRightLegComplete = (blob: Blob, duration: number, result: ClientMetrics) => {
    setRightLegData({ blob, duration, result });
    setPhase('uploading');
  };

  /**
   * Upload complete - navigate to results
   */
  const handleUploadComplete = (assessmentId: string) => {
    navigate(`/assessments/${assessmentId}`);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Phase 1: Left Leg Testing */}
      {phase === 'left-leg-testing' && (
        <RecordingStep
          athleteId={athleteId!}
          testType="one_leg_balance"
          legTested="left"
          autoStart={false}
          onRecordingComplete={handleLeftLegComplete}
        />
      )}

      {/* Phase 2: Transition Modal */}
      <TransitionModal
        open={showTransitionModal}
        leftLegResult={leftLegData?.result || null}
        onContinue={handleContinueToRightLeg}
        onReshootLeft={handleReshootLeftLeg}
      />

      {/* Phase 3: Right Leg Testing */}
      {phase === 'right-leg-testing' && (
        <RecordingStep
          athleteId={athleteId!}
          testType="one_leg_balance"
          legTested="right"
          autoStart={true}
          instructionText="Testing RIGHT leg"
          onRecordingComplete={handleRightLegComplete}
        />
      )}

      {/* Phase 4: Upload Both Videos */}
      {phase === 'uploading' && leftLegData && rightLegData && (
        <TwoLegUploadStep
          athleteId={athleteId!}
          leftLegData={leftLegData}
          rightLegData={rightLegData}
          onComplete={handleUploadComplete}
        />
      )}
    </Box>
  );
};
```

**Total file length**: ~100 lines (compared to previous ~200+ with stepper logic)

### 6. Route Configuration

**Verify route still works** in `client/src/App.tsx` or route config:

```typescript
// Should already exist
<Route path="/assess/:athleteId" element={<AssessmentFlow />} />
```

**No changes needed** - same route, different internal implementation.

## UI Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    AssessmentFlow State Machine               │
└──────────────────────────────────────────────────────────────┘

                    ┌─────────────────────┐
                    │  left-leg-testing   │
                    │  RecordingStep      │
                    │  legTested="left"   │
                    │  autoStart={false}  │
                    └──────────┬──────────┘
                               │
                               │ onRecordingComplete()
                               ▼
                    ┌─────────────────────┐
                    │  transition-modal   │
                    │  TransitionModal    │
                    │  (show left result) │
                    └──────────┬──────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
         Reshoot Left     Continue
                │              │
                ▼              ▼
    ┌────────────────┐  ┌─────────────────────┐
    │ Clear left     │  │  right-leg-testing  │
    │ data, restart  │  │  RecordingStep      │
    └────────────────┘  │  legTested="right"  │
                        │  autoStart={true}   │
                        │  instruction banner │
                        └──────────┬──────────┘
                                   │
                                   │ onRecordingComplete()
                                   ▼
                        ┌─────────────────────┐
                        │     uploading       │
                        │  TwoLegUploadStep   │
                        │  (both videos)      │
                        └──────────┬──────────┘
                                   │
                                   │ onComplete()
                                   ▼
                        ┌─────────────────────┐
                        │  Navigate to:       │
                        │  /assessments/:id   │
                        └─────────────────────┘
```

## Environment Variables

None required.

## Estimated Complexity

**L** (Large) - 6 hours

**Breakdown**:
- Remove stepper code: 30 minutes
- Implement phase state machine: 1 hour
- Wire up handlers: 1 hour
- Integrate new components: 1.5 hours
- Testing and debugging: 2 hours

## Testing Instructions

### 1. Full Flow Test (Happy Path)

```bash
cd client
npm run dev

# Navigate to /assess/:athleteId
```

**Test Steps**:
1. Page loads → Left leg RecordingStep appears immediately (no stepper)
2. Position yourself in front of camera
3. Start test manually
4. Complete left leg test (hold balance or fail)
5. TransitionModal appears with left leg summary
6. Click "Continue to Right Leg"
7. Right leg RecordingStep loads automatically
8. Blue instruction banner shows "Testing RIGHT leg"
9. Test auto-starts when person detected (after ~1 second)
10. Complete right leg test
11. TwoLegUploadStep appears
12. Watch upload progress for both videos
13. "Calculating symmetry..." message appears
14. Redirects to `/assessments/:id`

**Expected Duration**: ~3-5 minutes

### 2. Reshoot Left Leg Test

**Test Steps**:
1. Complete left leg test
2. TransitionModal appears
3. Click "Reshoot Left Leg"
4. Modal closes
5. Returns to left leg RecordingStep (phase resets)
6. Left leg data cleared (verify by checking state in React DevTools)
7. Can complete new left leg test
8. Proceeds normally through rest of flow

**Verify**:
- First left leg test data is discarded
- Second left leg test data is used in final upload

### 3. Browser Refresh Test

**Test Steps**:
1. Start flow, complete left leg
2. On transition modal, refresh browser (F5)

**Expected Behavior**:
- Flow restarts from beginning (phase='left-leg-testing')
- Left leg data lost (this is acceptable for MVP)
- User must restart both tests

**Future Enhancement**: Could persist state to localStorage for recovery.

### 4. Navigation Test

**Test Steps**:
1. During left leg test, click browser back button
2. During upload, click browser back button

**Expected**:
- Returns to previous page (likely athlete profile)
- Test data lost (acceptable)

**Future Enhancement**: Could add "Are you sure?" confirmation dialog.

### 5. Error Handling Test

**Test Case 1: Upload failure**
1. Complete both legs successfully
2. Kill backend server or disconnect internet
3. Upload phase begins
4. Upload fails with error
5. Retry button appears
6. Click Retry
7. Upload resumes

**Test Case 2: Backend validation error**
1. Complete both legs
2. Backend returns 400 error (e.g., athlete not found)
3. Error message displays
4. Retry button available

### 6. Responsive Testing

**Mobile (375px)**:
1. Complete full flow on mobile simulator
2. Verify RecordingStep full-screen
3. Verify TransitionModal fits viewport
4. Verify upload progress card readable
5. Verify all touch targets ≥44px

**Desktop (1024px+)**:
1. Complete full flow on desktop
2. Verify components centered appropriately
3. Verify no horizontal scroll
4. Verify video feed uses optimal resolution

### 7. Unit Tests (Optional)

**Create test file** `client/src/pages/Assessment/__tests__/AssessmentFlow.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AssessmentFlow } from '../AssessmentFlow';

// Mock child components
jest.mock('../steps/RecordingStep', () => ({
  RecordingStep: ({ legTested, onRecordingComplete }: any) => (
    <div>
      <p>RecordingStep: {legTested}</p>
      <button onClick={() => onRecordingComplete(new Blob(), 25.0, { holdTime: 25.0 })}>
        Complete {legTested}
      </button>
    </div>
  ),
}));

jest.mock('../components/TransitionModal', () => ({
  TransitionModal: ({ open, onContinue, onReshootLeft }: any) => (
    open ? (
      <div>
        <p>TransitionModal</p>
        <button onClick={onContinue}>Continue</button>
        <button onClick={onReshootLeft}>Reshoot</button>
      </div>
    ) : null
  ),
}));

jest.mock('../components/TwoLegUploadStep', () => ({
  TwoLegUploadStep: ({ onComplete }: any) => (
    <div>
      <p>TwoLegUploadStep</p>
      <button onClick={() => onComplete('assess123')}>Upload Complete</button>
    </div>
  ),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('AssessmentFlow', () => {
  it('starts with left leg testing phase', () => {
    renderWithRouter(<AssessmentFlow />);
    expect(screen.getByText('RecordingStep: left')).toBeInTheDocument();
  });

  it('shows transition modal after left leg complete', async () => {
    renderWithRouter(<AssessmentFlow />);

    fireEvent.click(screen.getByText('Complete left'));

    await waitFor(() => {
      expect(screen.getByText('TransitionModal')).toBeInTheDocument();
    });
  });

  it('moves to right leg when continue clicked', async () => {
    renderWithRouter(<AssessmentFlow />);

    // Complete left leg
    fireEvent.click(screen.getByText('Complete left'));

    // Click continue in modal
    await waitFor(() => screen.getByText('Continue'));
    fireEvent.click(screen.getByText('Continue'));

    // Right leg recording should appear
    await waitFor(() => {
      expect(screen.getByText('RecordingStep: right')).toBeInTheDocument();
    });
  });

  it('restarts left leg when reshoot clicked', async () => {
    renderWithRouter(<AssessmentFlow />);

    // Complete left leg
    fireEvent.click(screen.getByText('Complete left'));

    // Click reshoot in modal
    await waitFor(() => screen.getByText('Reshoot'));
    fireEvent.click(screen.getByText('Reshoot'));

    // Should return to left leg recording
    await waitFor(() => {
      expect(screen.getByText('RecordingStep: left')).toBeInTheDocument();
      expect(screen.queryByText('TransitionModal')).not.toBeInTheDocument();
    });
  });

  it('shows upload step after both legs complete', async () => {
    renderWithRouter(<AssessmentFlow />);

    // Complete left leg
    fireEvent.click(screen.getByText('Complete left'));
    fireEvent.click(screen.getByText('Continue'));

    // Complete right leg
    await waitFor(() => screen.getByText('Complete right'));
    fireEvent.click(screen.getByText('Complete right'));

    // Upload step should appear
    await waitFor(() => {
      expect(screen.getByText('TwoLegUploadStep')).toBeInTheDocument();
    });
  });
});
```

Run tests:
```bash
npm test -- AssessmentFlow.test.tsx
```

## Notes

### Design Rationale

**Why remove stepper?**

Problems with stepper:
- Adds visual complexity for simple linear flow
- Users must manually navigate steps
- Confusing for back/forward navigation
- Extra setup screens slow down flow

Benefits of phase machine:
- Faster flow (direct to camera)
- Auto-progression feels seamless
- Clearer mental model (testing → transition → testing → upload)
- Simpler code (~100 lines vs ~200)

**Why store test data in component state vs. context?**

Component state chosen because:
- Data only needed within AssessmentFlow
- Not shared across routes
- Simpler than context setup
- Cleared automatically on unmount

Trade-off:
- Lost on browser refresh (acceptable for MVP)

**Why single route instead of `/assess/:athleteId/left` and `/assess/:athleteId/right`?**

Single route benefits:
- Simpler URL structure
- No need to sync route with phase
- No risk of user manually navigating to wrong phase
- Phase machine handles all transitions

### State Machine Diagram

```typescript
// Valid transitions
'left-leg-testing' → 'transition-modal'  // Left complete
'transition-modal' → 'right-leg-testing'  // Continue clicked
'transition-modal' → 'left-leg-testing'   // Reshoot clicked
'right-leg-testing' → 'uploading'         // Right complete
'uploading' → (navigate away)              // Upload complete

// Invalid transitions (prevented by logic)
'left-leg-testing' → 'right-leg-testing'   // ❌ Must go through modal
'uploading' → 'left-leg-testing'           // ❌ Cannot restart after upload begins
```

### Memory Management

**Blob storage concern**: Video blobs kept in memory until upload complete.

- Left leg blob: Stored in state for ~30-60 seconds (time to complete right leg)
- Right leg blob: Stored briefly (~5-15 seconds for upload)
- Combined size: ~2-10 MB total (acceptable for modern browsers)

**Future optimization**: Stream upload (upload left leg immediately after capture, don't wait for right leg).

### Comparison with Old Stepper Flow

**Old Flow** (4 steps):
1. Setup: Select test type and leg (manual)
2. Record: Camera and recording
3. Review: Video playback
4. Upload: Firebase upload + backend submit

**New Flow** (4 phases):
1. Left leg testing: Camera + recording (no review)
2. Transition modal: Summary + choice
3. Right leg testing: Camera + recording (auto-start)
4. Upload: Both videos + backend submit

**Time Savings**:
- Removed: Test setup screen (~10 seconds)
- Removed: Left leg review screen (~10 seconds)
- Removed: Right leg review screen (~10 seconds)
- Added: Transition modal (~5 seconds)
- **Total savings**: ~25 seconds per assessment

### Future Enhancements

**Could add** (not in MVP scope):

1. **Progress Indicator**: Show "Step 1/2" or progress bar
2. **State Persistence**: localStorage to survive refresh
3. **Back Button**: Return to previous phase
4. **Preview Mode**: Quick preview of left leg before continuing
5. **Time Estimate**: "~3 minutes remaining"
