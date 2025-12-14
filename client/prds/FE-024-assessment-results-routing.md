---
id: FE-024
status: ✅ COMPLETE
depends_on: [FE-023]
blocks: []
---

# FE-024: AssessmentResults Routing Logic

## Title
Add routing logic to detect bilateral assessments and render appropriate results view

## Scope

### In Scope
- Detect `legTested === 'both'` in assessment data
- Route to `TwoLegResultsView` for bilateral assessments
- Preserve existing `SingleLegResultsView` for single-leg assessments
- Handle loading and error states
- Backward compatibility with existing single-leg assessments

### Out of Scope
- TwoLegResultsView implementation (FE-023)
- Single-leg results view modifications
- Assessment data fetching logic (already exists)
- URL routing changes (uses same `/assessments/:id` route)

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Detection Method | Check `assessment.legTested === 'both'` | Simple, reliable, matches backend enum |
| Component Selection | Conditional rendering with ternary | Clear, type-safe, no extra routing needed |
| Error Handling | Show alert if bilateral data missing | Graceful degradation; prevents crashes |
| Fallback Behavior | Render SingleLegResultsView if not bilateral | Backward compatibility with existing assessments |
| Loading State | Single spinner for both view types | Consistent UX regardless of assessment type |

## Acceptance Criteria

- [ ] Bilateral assessments (`legTested === 'both'`) render `TwoLegResultsView`
- [ ] Single-leg assessments render existing `SingleLegResultsView`
- [ ] Missing bilateral data shows error alert
- [ ] Loading spinner shown while fetching assessment
- [ ] Error state handled if assessment not found
- [ ] Backward compatible with existing single-leg assessments in database
- [ ] TypeScript type checking passes without errors
- [ ] No console warnings or errors

## Files to Create/Modify

```
client/src/pages/Assessment/
└── AssessmentResults.tsx         # Update routing logic
```

## Implementation Details

### Update `AssessmentResults.tsx`

**File**: `client/src/pages/Assessment/AssessmentResults.tsx`

**Add import:**

```typescript
import { TwoLegResultsView } from './components/TwoLegResultsView';
```

**Update rendering logic:**

Replace the existing results rendering section with:

```typescript
// ... existing imports and setup ...

export const AssessmentResults: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssessmentData = async () => {
      try {
        setLoading(true);
        
        // Fetch assessment
        const assessmentData = await assessmentsService.getById(id);
        setAssessment(assessmentData);
        
        // Fetch athlete
        const athleteData = await athletesService.getById(assessmentData.athleteId);
        setAthlete(athleteData);
      } catch (err: any) {
        setError(err.message || 'Failed to load assessment');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAssessmentData();
    }
  }, [id]);

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error || !assessment || !athlete) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          {error || 'Assessment not found'}
        </Alert>
      </Container>
    );
  }

  // Routing logic: bilateral vs single-leg
  const isBilateralAssessment = assessment.legTested === 'both';
  const hasBilateralData = Boolean(
    assessment.leftLegMetrics &&
    assessment.rightLegMetrics &&
    assessment.bilateralComparison
  );

  // Render bilateral view
  if (isBilateralAssessment) {
    if (!hasBilateralData) {
      return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Alert severity="warning">
            This assessment is marked as bilateral but is missing comparison data.
            Please contact support if this issue persists.
          </Alert>
        </Container>
      );
    }
    
    return <TwoLegResultsView assessment={assessment} athlete={athlete} />;
  }

  // Render single-leg view (existing)
  return <SingleLegResultsView assessment={assessment} athlete={athlete} />;
};
```

**Optional: Extract to separate component (cleaner)**:

```typescript
const AssessmentResultsRouter: React.FC<{
  assessment: Assessment;
  athlete: Athlete;
}> = ({ assessment, athlete }) => {
  const isBilateralAssessment = assessment.legTested === 'both';
  
  if (isBilateralAssessment) {
    const hasBilateralData = Boolean(
      assessment.leftLegMetrics &&
      assessment.rightLegMetrics &&
      assessment.bilateralComparison
    );

    if (!hasBilateralData) {
      return (
        <Alert severity="warning">
          Bilateral data incomplete. Assessment may be corrupted.
        </Alert>
      );
    }

    return <TwoLegResultsView assessment={assessment} athlete={athlete} />;
  }

  return <SingleLegResultsView assessment={assessment} athlete={athlete} />;
};
```

## Environment Variables

None required.

## Estimated Complexity

**S** (Small) - 2 hours

**Breakdown**:
- Add import and routing logic: 0.5 hours
- Test bilateral detection: 0.5 hours
- Test error states: 0.5 hours
- Integration testing: 0.5 hours

## Testing Instructions

### 1. Test Bilateral Assessment Routing

```typescript
// Create test bilateral assessment
const bilateralAssessment: Assessment = {
  id: 'test123',
  athleteId: 'athlete456',
  legTested: 'both',  // KEY: triggers bilateral view
  leftLegMetrics: { /* ... */ },
  rightLegMetrics: { /* ... */ },
  bilateralComparison: { /* ... */ },
  // ... other fields
};

// Navigate to /assessments/test123
// Expect: TwoLegResultsView renders
```

### 2. Test Single-Leg Assessment Routing

```typescript
// Create test single-leg assessment
const singleLegAssessment: Assessment = {
  id: 'test456',
  athleteId: 'athlete456',
  legTested: 'left',  // Single leg
  metrics: { /* ... */ },
  // ... other fields
};

// Navigate to /assessments/test456
// Expect: SingleLegResultsView renders (existing behavior)
```

### 3. Test Error State - Missing Bilateral Data

```typescript
// Create incomplete bilateral assessment
const incompleteBilateral: Assessment = {
  id: 'test789',
  legTested: 'both',
  leftLegMetrics: { /* ... */ },
  // Missing: rightLegMetrics, bilateralComparison
};

// Navigate to /assessments/test789
// Expect: Warning alert displayed
```

### 4. Manual Browser Testing

**Test Case 1: Complete Bilateral Assessment**
1. Complete dual-leg test flow
2. Navigate to results page
3. Verify TwoLegResultsView renders
4. Check all bilateral data displays correctly

**Test Case 2: Existing Single-Leg Assessment**
1. Navigate to existing single-leg assessment (from database)
2. Verify SingleLegResultsView renders
3. Confirm no console errors
4. Backward compatibility maintained

**Test Case 3: Direct URL Access**
1. Open `/assessments/{bilateral-id}` in new tab
2. Verify correct view loads
3. No routing errors

**Test Case 4: Not Found**
1. Navigate to `/assessments/invalid-id`
2. Verify error alert shows
3. No crashes

### 5. TypeScript Type Checking

```bash
cd client
npm run type-check
# Should pass without errors
```

### 6. Integration Test

```typescript
// In AssessmentResults.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { AssessmentResults } from './AssessmentResults';
import * as assessmentsService from '../../services/assessments';

jest.mock('../../services/assessments');

describe('AssessmentResults Routing', () => {
  it('renders TwoLegResultsView for bilateral assessment', async () => {
    const mockBilateral = {
      id: '123',
      legTested: 'both',
      leftLegMetrics: {},
      rightLegMetrics: {},
      bilateralComparison: {},
    };

    (assessmentsService.getById as jest.Mock).mockResolvedValue(mockBilateral);

    render(<AssessmentResults />);

    await waitFor(() => {
      // Check for bilateral-specific element
      expect(screen.getByText(/Bilateral Balance Assessment/i)).toBeInTheDocument();
    });
  });

  it('renders SingleLegResultsView for single-leg assessment', async () => {
    const mockSingleLeg = {
      id: '456',
      legTested: 'left',
      metrics: {},
    };

    (assessmentsService.getById as jest.Mock).mockResolvedValue(mockSingleLeg);

    render(<AssessmentResults />);

    await waitFor(() => {
      // Check for single-leg-specific element
      expect(screen.getByText(/Balance Test Results/i)).toBeInTheDocument();
    });
  });

  it('shows error for incomplete bilateral data', async () => {
    const mockIncomplete = {
      id: '789',
      legTested: 'both',
      leftLegMetrics: {},
      // Missing rightLegMetrics and bilateralComparison
    };

    (assessmentsService.getById as jest.Mock).mockResolvedValue(mockIncomplete);

    render(<AssessmentResults />);

    await waitFor(() => {
      expect(screen.getByText(/missing comparison data/i)).toBeInTheDocument();
    });
  });
});
```

## Notes

### Design Rationale

**Why check `legTested === 'both'` instead of checking for bilateral data presence?**
- `legTested` is the source of truth (set at assessment creation)
- Checking data presence could miss edge cases (e.g., partially failed assessments)
- Backend guarantees `legTested === 'both'` → bilateral data exists (or error state)

**Why ternary operator instead of React Router nested routes?**
- Same URL pattern (`/assessments/:id`) for both types
- No need for separate routes
- Simpler mental model for developers
- Type safety easier to maintain

**Why separate `hasBilateralData` check?**
- Defense in depth: catch corrupted assessments
- Better error messages for users
- Prevents crashes from undefined access
- Easier debugging (explicit error state)

### Backward Compatibility

**Existing single-leg assessments:**
- Database contains `leg_tested: 'left'` or `'right'`
- `metrics` field populated (not `left_leg_metrics`)
- Routing logic preserves existing behavior
- No migration needed

**Future bilateral assessments:**
- Database contains `leg_tested: 'both'`
- `left_leg_metrics`, `right_leg_metrics`, `bilateral_comparison` populated
- Routing logic automatically detects and routes correctly

### Error Handling

| Scenario | Detection | User Experience | Recovery |
|----------|-----------|-----------------|----------|
| Bilateral with missing data | `!hasBilateralData` | Warning alert | Contact support |
| Single-leg (normal) | `legTested !== 'both'` | Normal single-leg view | N/A |
| Assessment not found | API error | Error alert | Navigate back |
| Network error during fetch | Try-catch | Error alert | Retry button |

### Future Enhancements

- **Comparison mode**: Toggle between bilateral and individual leg views
- **Historical overlay**: Show previous bilateral assessments on same page
- **Share link**: Generate unique URL for parents (with PIN)
- **Export**: Download bilateral report as PDF
