---
id: FE-019
status: ✅ COMPLETE
depends_on: [FE-018]
blocks: [FE-022]
---

# FE-019: TransitionModal Component

## Title
Create modal dialog for transitioning between left and right leg tests with summary and reshoot option

## Scope

### In Scope
- Create `TransitionModal` component with MUI Dialog
- Display left leg test summary (hold time, success/failure status)
- Provide "Continue to Right Leg" primary action
- Provide "Reshoot Left Leg" secondary action
- Prevent modal dismissal via ESC key or backdrop click (force explicit choice)
- Responsive design for mobile and desktop

### Out of Scope
- RecordingStep component integration (FE-020)
- AssessmentFlow state machine (FE-022)
- Actual reshoot implementation logic (handled in AssessmentFlow)
- Test results calculation (already exists in RecordingStep)

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| UI Library | MUI Dialog | Consistent with app's Material-UI design system |
| Modal Dismissal | Disabled (no ESC, no backdrop click) | Force explicit user choice; prevent accidental dismissal |
| Status Indicator | Chip with success/warning color | Clear visual feedback, MUI standard component |
| Button Layout | Two buttons: outlined (reshoot) + contained primary (continue) | Clear visual hierarchy, primary action emphasized |
| Hold Time Display | Typography with large font size | Key metric, needs prominence |

## Acceptance Criteria

- [ ] Modal renders with left leg test summary
- [ ] Hold time displays with 1 decimal precision (e.g., "15.3 seconds")
- [ ] Success status shows green chip with checkmark
- [ ] Failure status shows orange/yellow chip with X icon
- [ ] "Reshoot Left Leg" button triggers `onReshootLeft` callback
- [ ] "Continue to Right Leg" button triggers `onContinue` callback
- [ ] ESC key does not close modal
- [ ] Clicking backdrop does not close modal
- [ ] Responsive layout works on mobile (320px+) and desktop
- [ ] Keyboard navigation works (Tab between buttons, Enter to activate)

## Files to Create/Modify

```
client/src/pages/Assessment/components/
└── TransitionModal.tsx        # NEW: Modal component
```

## Implementation Details

### Complete Component Implementation

**File**: `client/src/pages/Assessment/components/TransitionModal.tsx`

```typescript
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Chip,
  Box,
  Stack,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

interface TransitionModalProps {
  open: boolean;
  leftLegResult: {
    success: boolean;
    holdTime: number;
    failureReason?: string;
  } | null;
  onContinue: () => void;
  onReshootLeft: () => void;
}

export const TransitionModal: React.FC<TransitionModalProps> = ({
  open,
  leftLegResult,
  onContinue,
  onReshootLeft,
}) => {
  if (!leftLegResult) {
    return null;
  }

  const { success, holdTime, failureReason } = leftLegResult;

  return (
    <Dialog
      open={open}
      disableEscapeKeyDown
      onClose={(event, reason) => {
        // Prevent closing via backdrop click or ESC key
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
          return;
        }
      }}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h5" component="span">
            Left Leg Test Complete
          </Typography>
          {success ? (
            <CheckCircleIcon color="success" fontSize="large" />
          ) : (
            <CancelIcon color="warning" fontSize="large" />
          )}
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* Status Chip */}
          <Box>
            <Chip
              label={success ? 'Test Passed' : 'Test Failed'}
              color={success ? 'success' : 'warning'}
              icon={success ? <CheckCircleIcon /> : <CancelIcon />}
              sx={{ fontSize: '1rem', py: 2.5 }}
            />
          </Box>

          {/* Hold Time */}
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Hold Time
            </Typography>
            <Typography variant="h3" component="div" color="primary">
              {holdTime.toFixed(1)}s
            </Typography>
          </Box>

          {/* Failure Reason (if applicable) */}
          {!success && failureReason && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Reason
              </Typography>
              <Typography variant="body1">
                {failureReason}
              </Typography>
            </Box>
          )}

          {/* Next Step Prompt */}
          <Box
            sx={{
              bgcolor: 'primary.50',
              p: 2,
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'primary.200',
            }}
          >
            <Typography variant="body1" fontWeight="medium">
              Ready to test the right leg?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              You can reshoot the left leg if needed, or continue to the right leg test.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onReshootLeft}
          variant="outlined"
          color="secondary"
          size="large"
        >
          Reshoot Left Leg
        </Button>
        <Button
          onClick={onContinue}
          variant="contained"
          color="primary"
          size="large"
          autoFocus
        >
          Continue to Right Leg
        </Button>
      </DialogActions>
    </Dialog>
  );
};
```

## UI Reference

### Desktop Layout (600px+)

```
┌──────────────────────────────────────────────────────┐
│  Left Leg Test Complete ✓                            │
├──────────────────────────────────────────────────────┤
│                                                      │
│  [Test Passed ✓]                                    │
│                                                      │
│  Hold Time                                          │
│  15.3s                                              │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │ Ready to test the right leg?                   │ │
│  │ You can reshoot the left leg if needed, or    │ │
│  │ continue to the right leg test.                │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│                 [Reshoot Left Leg]  [Continue]      │
└──────────────────────────────────────────────────────┘
```

### Mobile Layout (320px-599px)

```
┌────────────────────────────┐
│  Left Leg Test Complete ✓  │
├────────────────────────────┤
│                            │
│  [Test Passed ✓]          │
│                            │
│  Hold Time                 │
│  15.3s                     │
│                            │
│  ┌──────────────────────┐ │
│  │ Ready to test the    │ │
│  │ right leg?           │ │
│  │                      │ │
│  │ You can reshoot...   │ │
│  └──────────────────────┘ │
│                            │
│  [Reshoot Left Leg]       │
│  [Continue to Right Leg]  │
└────────────────────────────┘
```

### Failure State Example

```
┌──────────────────────────────────────────────────────┐
│  Left Leg Test Complete ⚠                            │
├──────────────────────────────────────────────────────┤
│                                                      │
│  [Test Failed ⚠]                                    │
│                                                      │
│  Hold Time                                          │
│  8.2s                                               │
│                                                      │
│  Reason                                             │
│  Foot touched down                                  │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │ Ready to test the right leg?                   │ │
│  │ You can reshoot the left leg if needed...     │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│                 [Reshoot Left Leg]  [Continue]      │
└──────────────────────────────────────────────────────┘
```

## Environment Variables

None required.

## Estimated Complexity

**S** (Small) - 2-3 hours

**Breakdown**:
- Component structure and props: 30 minutes
- UI implementation with MUI: 1 hour
- Responsive styling: 30 minutes
- Testing and refinement: 1 hour

## Testing Instructions

### 1. Component Testing (Manual)

**Create test harness** in `client/src/pages/Assessment/components/TransitionModal.stories.tsx` (if using Storybook) or temporary test page:

```typescript
import { useState } from 'react';
import { TransitionModal } from './TransitionModal';
import { Button, Container } from '@mui/material';

export function TransitionModalTest() {
  const [open, setOpen] = useState(false);
  const [scenario, setScenario] = useState<'success' | 'failure'>('success');

  const leftLegResultSuccess = {
    success: true,
    holdTime: 15.3,
  };

  const leftLegResultFailure = {
    success: false,
    holdTime: 8.2,
    failureReason: 'Foot touched down',
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Button onClick={() => { setScenario('success'); setOpen(true); }}>
        Show Success Modal
      </Button>
      <Button onClick={() => { setScenario('failure'); setOpen(true); }}>
        Show Failure Modal
      </Button>

      <TransitionModal
        open={open}
        leftLegResult={scenario === 'success' ? leftLegResultSuccess : leftLegResultFailure}
        onContinue={() => {
          console.log('Continue clicked');
          setOpen(false);
        }}
        onReshootLeft={() => {
          console.log('Reshoot clicked');
          setOpen(false);
        }}
      />
    </Container>
  );
}
```

**Test Cases**:

1. **Success Scenario**:
   - Click "Show Success Modal"
   - Verify green chip with checkmark
   - Verify hold time displays correctly (15.3s)
   - Verify no failure reason shown
   - Click "Continue" - modal closes, console logs "Continue clicked"

2. **Failure Scenario**:
   - Click "Show Failure Modal"
   - Verify yellow/warning chip with X icon
   - Verify hold time displays correctly (8.2s)
   - Verify failure reason shows: "Foot touched down"
   - Click "Reshoot Left Leg" - modal closes, console logs "Reshoot clicked"

3. **Modal Dismissal Prevention**:
   - Open modal
   - Press ESC key → modal stays open
   - Click backdrop (outside modal) → modal stays open
   - Only closes via button clicks

4. **Keyboard Navigation**:
   - Open modal
   - Press Tab → focus moves to "Reshoot Left Leg"
   - Press Tab → focus moves to "Continue to Right Leg"
   - Press Enter → triggers "Continue" callback

### 2. Responsive Testing

**Desktop (1024px+)**:
```bash
# Chrome DevTools
1. Open modal
2. Resize browser to 1024px width
3. Verify buttons side-by-side
4. Verify content not cramped
```

**Tablet (600px-1023px)**:
```bash
1. Resize to 768px width
2. Verify modal uses maxWidth="sm" (600px)
3. Verify layout remains clear
```

**Mobile (320px-599px)**:
```bash
1. Resize to 375px width (iPhone SE)
2. Verify buttons stack vertically (MUI default)
3. Verify text readable without horizontal scroll
4. Verify touch targets ≥44px height
```

### 3. Unit Tests (Optional)

**Create test file** `client/src/pages/Assessment/components/__tests__/TransitionModal.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { TransitionModal } from '../TransitionModal';

describe('TransitionModal', () => {
  const mockOnContinue = jest.fn();
  const mockOnReshootLeft = jest.fn();

  const successResult = {
    success: true,
    holdTime: 15.3,
  };

  const failureResult = {
    success: false,
    holdTime: 8.2,
    failureReason: 'Foot touched down',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders success state correctly', () => {
    render(
      <TransitionModal
        open={true}
        leftLegResult={successResult}
        onContinue={mockOnContinue}
        onReshootLeft={mockOnReshootLeft}
      />
    );

    expect(screen.getByText('Left Leg Test Complete')).toBeInTheDocument();
    expect(screen.getByText('Test Passed')).toBeInTheDocument();
    expect(screen.getByText('15.3s')).toBeInTheDocument();
    expect(screen.queryByText(/Reason/)).not.toBeInTheDocument();
  });

  it('renders failure state correctly', () => {
    render(
      <TransitionModal
        open={true}
        leftLegResult={failureResult}
        onContinue={mockOnContinue}
        onReshootLeft={mockOnReshootLeft}
      />
    );

    expect(screen.getByText('Test Failed')).toBeInTheDocument();
    expect(screen.getByText('8.2s')).toBeInTheDocument();
    expect(screen.getByText('Foot touched down')).toBeInTheDocument();
  });

  it('calls onContinue when Continue button clicked', () => {
    render(
      <TransitionModal
        open={true}
        leftLegResult={successResult}
        onContinue={mockOnContinue}
        onReshootLeft={mockOnReshootLeft}
      />
    );

    fireEvent.click(screen.getByText('Continue to Right Leg'));
    expect(mockOnContinue).toHaveBeenCalledTimes(1);
    expect(mockOnReshootLeft).not.toHaveBeenCalled();
  });

  it('calls onReshootLeft when Reshoot button clicked', () => {
    render(
      <TransitionModal
        open={true}
        leftLegResult={successResult}
        onContinue={mockOnContinue}
        onReshootLeft={mockOnReshootLeft}
      />
    );

    fireEvent.click(screen.getByText('Reshoot Left Leg'));
    expect(mockOnReshootLeft).toHaveBeenCalledTimes(1);
    expect(mockOnContinue).not.toHaveBeenCalled();
  });

  it('does not render when leftLegResult is null', () => {
    const { container } = render(
      <TransitionModal
        open={true}
        leftLegResult={null}
        onContinue={mockOnContinue}
        onReshootLeft={mockOnReshootLeft}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
```

Run tests:
```bash
npm test -- TransitionModal.test.tsx
```

### 4. Accessibility Testing

**Screen Reader**:
```bash
# macOS VoiceOver
1. Open modal
2. Enable VoiceOver (Cmd+F5)
3. Navigate with Tab
4. Verify all elements announced:
   - "Left Leg Test Complete"
   - "Test Passed" or "Test Failed"
   - "Hold Time: 15.3 seconds"
   - Button labels
```

**Keyboard Only**:
```bash
1. Open modal
2. Disconnect mouse
3. Navigate with Tab/Shift+Tab
4. Activate buttons with Enter/Space
5. Verify cannot dismiss with ESC
```

**ARIA Attributes** (verify in React DevTools):
- Dialog has `role="dialog"`
- DialogTitle has appropriate heading level
- Buttons have clear accessible names

## Notes

### Design Rationale

**Why force explicit choice (disable ESC/backdrop dismiss)?**

In a sequential test flow, accidentally dismissing the modal could:
- Lose left leg test data
- Confuse the user about their progress
- Require restarting the entire two-leg sequence

Forcing an explicit choice ("Continue" or "Reshoot") ensures intentional progression.

**Why show hold time even on failure?**

Even failed tests provide valuable data:
- "8.2 seconds before foot touched down" is useful coaching info
- Helps athlete understand they're close to success
- Provides context for reshoot decision

**Why use Chip for status instead of Alert?**

- Chip is more compact and visually distinct
- Alert suggests actionable information; Chip is purely informational
- Consistent with MUI patterns for status indicators

### Integration Points

**Used by**: `AssessmentFlow` component (FE-022)

```typescript
// In AssessmentFlow.tsx
const [showTransitionModal, setShowTransitionModal] = useState(false);
const [leftLegData, setLeftLegData] = useState(null);

const handleLeftLegComplete = (result) => {
  setLeftLegData(result);
  setShowTransitionModal(true);
};

return (
  <>
    {/* ... RecordingStep ... */}

    <TransitionModal
      open={showTransitionModal}
      leftLegResult={leftLegData}
      onContinue={() => {
        setShowTransitionModal(false);
        setPhase('right-leg-testing');
      }}
      onReshootLeft={() => {
        setShowTransitionModal(false);
        setLeftLegData(null);
        setPhase('left-leg-testing');
      }}
    />
  </>
);
```

### Future Enhancements

**Could add** (not in MVP scope):

1. **Comparison Preview**: If reshoot, show comparison with previous attempt
2. **LTAD Score**: Show preliminary score based on hold time
3. **Encouragement Message**: Contextual message based on age and performance
4. **Animation**: Smooth transition effects when opening/closing

### Accessibility Enhancements

**Current**: Basic keyboard navigation and screen reader support

**Future** (if needed):
- `aria-describedby` linking hold time to context
- Live region announcements when modal opens
- Focus trap to prevent Tab-escaping modal
- High contrast mode support
