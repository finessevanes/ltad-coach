---
id: FE-017
depends_on: [FE-002, FE-011]
blocks: []
phase: 10
---

# FE-017: Assessments List Page

## Title
Implement dedicated assessments list page at `/assessments` route

## Context
The `/assessments` route currently displays a placeholder Home component with a comment "Placeholder until FE-011". However, FE-011 only implemented the individual assessment results page at `/assessments/:id`, not the list view at `/assessments`. The sidebar navigation links to this route and the Dashboard's "View All" button also expects this page to exist, but users currently see only a generic welcome page.

## Scope

### In Scope
- Full-page assessments list showing all assessments for authenticated coach
- Table or card layout displaying key assessment metadata
- Click navigation to individual assessment results
- Loading states and empty states
- Integration with existing backend `GET /assessments` endpoint
- Responsive design (mobile, tablet, desktop)

### Out of Scope
- Advanced filtering/search (MVP shows all)
- Sorting controls (backend default: most recent first)
- Bulk actions (delete multiple, export, etc.)
- Assessment comparison features
- Pagination (fetch all with reasonable limit for MVP)

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Component reuse | Extend RecentAssessments pattern | Consistent UX with Dashboard |
| Layout | Card-based list (mobile-friendly) | Matches existing RecentAssessments component |
| Data fetching | Use existing `assessmentsService.getAll()` | Backend already supports it |
| Empty state | Show call-to-action to add athletes | Guide new users |
| Limit | Fetch 50 most recent | Reasonable for MVP, matches backend max |

## User Stories

**As a coach**, I want to:
- View all my assessments in one place so I can review historical tests
- Click on an assessment to see detailed results
- See which athlete each assessment belongs to
- Know when each assessment was conducted
- See the test type and duration at a glance

## Acceptance Criteria

- [ ] `/assessments` route displays AssessmentsList component (not Home placeholder)
- [ ] Page shows all assessments for authenticated coach ordered by date (newest first)
- [ ] Each assessment card/row displays:
  - [ ] Athlete name (clickable to athlete profile)
  - [ ] Test type ("One-Leg Balance")
  - [ ] Leg tested (Left/Right)
  - [ ] Date conducted (formatted: "Jan 15, 2024, 2:30 PM")
  - [ ] Hold duration (e.g., "18.5s")
  - [ ] Status badge (Completed/Processing/Failed)
- [ ] Clicking an assessment navigates to `/assessments/:id` (results page)
- [ ] Loading state shown while fetching data
- [ ] Empty state shown when no assessments exist with "Conduct First Assessment" CTA
- [ ] Error handling with snackbar notification on fetch failure
- [ ] Responsive layout works on mobile, tablet, desktop
- [ ] Page header shows title "All Assessments" and total count

## Files to Create/Modify

```
client/src/
├── pages/
│   └── Assessment/
│       └── AssessmentsList.tsx       # New full-page component
├── routes/
│   └── index.tsx                     # Update /assessments route (modify)
└── components/
    └── Layout/
        └── Sidebar.tsx               # Already links to /assessments (no change)
```

## Implementation Details

### Component Structure

**File:** `client/src/pages/Assessment/AssessmentsList.tsx`

```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Chip,
  CircularProgress,
  Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useSnackbar } from '../../contexts/SnackbarContext';
import assessmentsService from '../../services/assessments';

interface AssessmentListItem {
  id: string;
  athleteId: string;
  athleteName: string;
  testType: string;
  legTested: string;
  createdAt: string;
  status: string;
  durationSeconds?: number;
  stabilityScore?: number;
}

export function AssessmentsList() {
  const [assessments, setAssessments] = useState<AssessmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setLoading(true);
        const data = await assessmentsService.getAll(50); // Fetch 50 most recent
        setAssessments(data);
      } catch (error) {
        console.error('Failed to fetch assessments:', error);
        showSnackbar('Failed to load assessments', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, []);

  const handleAssessmentClick = (assessmentId: string) => {
    navigate(`/assessments/${assessmentId}`);
  };

  const handleAthleteClick = (e: React.MouseEvent, athleteId: string) => {
    e.stopPropagation();
    navigate(`/athletes/${athleteId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Empty state
  if (assessments.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" gutterBottom color="text.secondary">
            No Assessments Yet
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Start by adding athletes and conducting your first balance assessment.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/athletes')}
            sx={{ mt: 2 }}
          >
            View Athletes
          </Button>
        </Box>
      </Container>
    );
  }

  // Main content
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          All Assessments
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {assessments.length} assessment{assessments.length !== 1 ? 's' : ''} total
        </Typography>
      </Box>

      {/* Assessments Grid */}
      <Grid container spacing={2}>
        {assessments.map((assessment) => (
          <Grid item xs={12} key={assessment.id}>
            <Card>
              <CardActionArea onClick={() => handleAssessmentClick(assessment.id)}>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    {/* Athlete Name */}
                    <Grid item xs={12} sm={3}>
                      <Typography
                        variant="subtitle1"
                        component="a"
                        onClick={(e) => handleAthleteClick(e, assessment.athleteId)}
                        sx={{
                          color: 'primary.main',
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' },
                          cursor: 'pointer',
                        }}
                      >
                        {assessment.athleteName}
                      </Typography>
                    </Grid>

                    {/* Test Details */}
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        {assessment.testType === 'one_leg_balance' ? 'One-Leg Balance' : assessment.testType}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {assessment.legTested === 'left' ? 'Left Leg' : 'Right Leg'}
                      </Typography>
                    </Grid>

                    {/* Duration */}
                    <Grid item xs={12} sm={2}>
                      <Typography variant="body2" fontWeight="medium">
                        {assessment.durationSeconds
                          ? `${assessment.durationSeconds.toFixed(1)}s`
                          : 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Hold Time
                      </Typography>
                    </Grid>

                    {/* Date */}
                    <Grid item xs={12} sm={2}>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(assessment.createdAt)}
                      </Typography>
                    </Grid>

                    {/* Status */}
                    <Grid item xs={12} sm={2}>
                      <Chip
                        label={assessment.status.charAt(0).toUpperCase() + assessment.status.slice(1)}
                        color={getStatusColor(assessment.status)}
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
```

### Route Update

**File:** `client/src/routes/index.tsx`

Change lines 124-133 from:
```typescript
{
  path: '/assessments',
  element: (
    <Layout>
      <ProtectedRoute>
        <Home /> {/* Placeholder until FE-011 */}
      </ProtectedRoute>
    </Layout>
  ),
},
```

To:
```typescript
{
  path: '/assessments',
  element: (
    <Layout>
      <ProtectedRoute>
        <AssessmentsList />
      </ProtectedRoute>
    </Layout>
  ),
},
```

And add import at top:
```typescript
import { AssessmentsList } from '../pages/Assessment';
```

### Export Update

**File:** `client/src/pages/Assessment/index.tsx`

Add export:
```typescript
export { AssessmentsList } from './AssessmentsList';
```

## UI/UX Design

### Layout Structure
```
┌─────────────────────────────────────────────────────┐
│ All Assessments                                     │
│ 12 assessments total                                │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ John Smith    One-Leg Balance   18.5s  Jan 15   │ │
│ │               Left Leg          Hold   2:30 PM  │ │
│ │                                        Completed │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Sarah Jones   One-Leg Balance   15.2s  Jan 14   │ │
│ │               Right Leg         Hold   10:45 AM │ │
│ │                                        Completed │ │
│ └─────────────────────────────────────────────────┘ │
│                       ...                           │
└─────────────────────────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                 No Assessments Yet                  │
│                                                     │
│   Start by adding athletes and conducting your     │
│          first balance assessment.                  │
│                                                     │
│              [ + View Athletes ]                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## API Integration

### Backend Endpoint (Already Exists)
- **Endpoint**: `GET /assessments`
- **Query Params**: `limit` (default: 20, max: 50)
- **Response**: `AssessmentListResponse`
  ```typescript
  {
    assessments: AssessmentListItem[];
    count: number;
  }
  ```

### Frontend Service (Already Exists)
- **Method**: `assessmentsService.getAll(limit?: number)`
- **File**: `client/src/services/assessments.ts`
- **Returns**: `Promise<AssessmentListItem[]>`

## Testing Instructions

### Manual Testing
1. Log in as a coach with assessments
2. Click "Assessments" in sidebar navigation
3. Verify page shows list of assessments (not Home placeholder)
4. Verify each card shows: athlete name, test type, leg, duration, date, status
5. Click an assessment card → should navigate to `/assessments/:id`
6. Click athlete name → should navigate to `/athletes/:id`
7. Log in as coach with no assessments
8. Verify empty state shows with "View Athletes" CTA
9. Test responsive layout on mobile, tablet, desktop

### Test Data Requirements
- Coach account with 5+ assessments
- Coach account with 0 assessments
- Assessments with different statuses (completed, processing, failed)
- Assessments for different athletes

## Dependencies

### Required PRs
- **FE-002** (Firebase Auth Client) - ✅ COMPLETE - Provides authentication
- **FE-011** (Assessment Results Display) - ✅ COMPLETE - Individual results page already works

### Backend Dependencies
- `GET /assessments` endpoint - ✅ EXISTS (backend/app/routers/assessments.py:336-397)

## Estimated Complexity
**S** (Small) - 2-3 hours

## Notes
- This completes the assessments feature set (list + detail views)
- Reuses existing patterns from RecentAssessments component
- No new backend work required - API already ready
- Removes placeholder Home component from authenticated routes
- Provides clear navigation path: Sidebar → List → Detail

## Future Enhancements (Post-MVP)
- Filtering by athlete, date range, test type
- Sorting controls (date, duration, athlete name)
- Pagination or infinite scroll for coaches with 100+ assessments
- Bulk delete functionality
- Export to CSV/PDF
- Search by athlete name
