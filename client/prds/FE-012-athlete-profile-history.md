---
id: FE-012
depends_on: [FE-004, FE-011]
blocks: [FE-013]
---

# FE-012: Athlete Profile & Assessment History

> ## ⚠️ Phase 9 Dependency
>
> The ReportHistory component described below depends on the reports API (BE-013, BE-014)
> which is not yet implemented. Skip report-related features until Phase 9 is complete.

## Title
Implement athlete profile page with assessment history and progress visualization

## Scope

### In Scope
- Athlete profile page at `/athletes/:id`
- Athlete info header (name, age, status)
- Assessment history list
- Simple progress chart (duration over time)
- "New Assessment" and "Edit" actions
- Delete athlete functionality
- Report history section (sent reports with resend option) **(Phase 9 - not yet implemented)**

### Out of Scope
- Parent report generation (FE-013)
- Detailed metrics history comparison
- Full report content editing

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Chart Library | recharts | Lightweight, React-native |
| History List | Simple table | Easy to scan |
| Progress View | Line chart | Shows trend clearly |

## Acceptance Criteria

- [ ] Profile page shows athlete name, age, gender
- [ ] ~~Report history section shows previously sent reports~~ (Phase 9)
- [ ] ~~Each report row shows date sent, PIN (masked), resend button~~ (Phase 9)
- [ ] ~~"Resend Report" generates new PIN and sends email~~ (Phase 9)
- [ ] ~~Success/error toast after resend~~ (Phase 9)
- [ ] Consent status shown with appropriate badge
- [ ] Assessment history displayed in chronological order
- [ ] Each assessment row shows date, score, duration
- [ ] Click assessment row navigates to results
- [ ] Progress chart shows duration trend over time
- [ ] "New Assessment" button (disabled if pending consent)
- [ ] "Edit Athlete" opens edit modal
- [ ] "Delete Athlete" with confirmation dialog
- [ ] Empty state when no assessments

## Files to Create/Modify

```
client/src/
├── pages/
│   └── Athletes/
│       ├── AthleteProfile.tsx       # Main profile page
│       ├── AssessmentHistory.tsx    # History list component
│       ├── ProgressChart.tsx        # Duration trend chart
│       └── ReportHistory.tsx        # Sent reports list with resend
├── services/
│   ├── athletes.ts                  # Add getById (modify)
│   └── reports.ts                   # Add getByAthlete, resend (modify)
└── routes/
    └── index.tsx                    # Add athlete profile route (modify)
```

## Implementation Details

### pages/Athletes/AthleteProfile.tsx
```typescript
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { athletesApi } from '../../services/athletes';
import { assessmentsApi } from '../../services/assessments';
import { Athlete } from '../../types/athlete';
import { AssessmentListItem } from '../../types/assessment';
import { StatusBadge } from '../../components/StatusBadge';
import { ConsentAlert } from './ConsentAlert';
import { AssessmentHistory } from './AssessmentHistory';
import { ProgressChart } from './ProgressChart';
import { EditAthleteModal } from './EditAthleteModal';

export default function AthleteProfile() {
  const { athleteId } = useParams();
  const navigate = useNavigate();

  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [assessments, setAssessments] = useState<AssessmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    loadData();
  }, [athleteId]);

  const loadData = async () => {
    if (!athleteId) return;
    try {
      setLoading(true);
      const [athleteData, assessmentsData] = await Promise.all([
        athletesApi.getById(athleteId),
        assessmentsApi.getByAthlete(athleteId),
      ]);
      setAthlete(athleteData);
      setAssessments(assessmentsData);
    } catch (err) {
      setError('Failed to load athlete data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!athleteId) return;
    try {
      await athletesApi.delete(athleteId);
      navigate('/athletes');
    } catch (err) {
      setError('Failed to delete athlete');
    }
    setDeleteDialogOpen(false);
  };

  const handleAthleteUpdated = (updated: Athlete) => {
    setAthlete(updated);
  };

  const isPending = athlete?.consentStatus === 'pending';

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !athlete) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Athlete not found'}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Consent Alert */}
      {isPending && (
        <ConsentAlert
          athleteId={athlete.id}
          athleteName={athlete.name}
          parentEmail={athlete.parentEmail}
        />
      )}

      {/* Profile Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box display="flex" gap={2}>
            <Avatar
              src={athlete.avatarUrl}
              sx={{ width: 80, height: 80, fontSize: 32 }}
            >
              {athlete.name.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h4">{athlete.name}</Typography>
              <Typography variant="body1" color="text.secondary">
                {athlete.age} years old • {athlete.gender}
              </Typography>
              <Box mt={1}>
                <StatusBadge status={athlete.consentStatus} />
              </Box>
            </Box>
          </Box>

          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate(`/assess/${athlete.id}/setup`)}
              disabled={isPending}
            >
              New Assessment
            </Button>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => navigate(`/assess/${athlete.id}/upload`)}
              disabled={isPending}
            >
              Upload Video
            </Button>
            <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
              <MoreIcon />
            </IconButton>
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
            >
              <MenuItem onClick={() => { setEditModalOpen(true); setMenuAnchor(null); }}>
                <EditIcon sx={{ mr: 1 }} /> Edit Athlete
              </MenuItem>
              <MenuItem onClick={() => { setDeleteDialogOpen(true); setMenuAnchor(null); }} sx={{ color: 'error.main' }}>
                <DeleteIcon sx={{ mr: 1 }} /> Delete Athlete
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Progress Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Progress Over Time
            </Typography>
            {assessments.length > 0 ? (
              <ProgressChart assessments={assessments} />
            ) : (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                No assessments yet. Complete an assessment to see progress.
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Assessment History */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Assessment History
            </Typography>
            <AssessmentHistory
              assessments={assessments}
              onAssessmentClick={(id) => navigate(`/assessments/${id}`)}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Edit Modal */}
      <EditAthleteModal
        open={editModalOpen}
        athlete={athlete}
        onClose={() => setEditModalOpen(false)}
        onSaved={handleAthleteUpdated}
      />

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Athlete?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove {athlete.name} from your roster?
            This will also delete all their assessment history. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
```

### pages/Athletes/AssessmentHistory.tsx
```typescript
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Box,
} from '@mui/material';
import { AssessmentListItem } from '../../types/assessment';

interface AssessmentHistoryProps {
  assessments: AssessmentListItem[];
  onAssessmentClick: (id: string) => void;
}

const SCORE_COLORS: Record<number, 'error' | 'warning' | 'info' | 'success' | 'secondary'> = {
  1: 'error',
  2: 'warning',
  3: 'info',
  4: 'success',
  5: 'secondary',
};

function getScore(duration: number): number {
  if (duration >= 25) return 5;
  if (duration >= 20) return 4;
  if (duration >= 15) return 3;
  if (duration >= 10) return 2;
  return 1;
}

export function AssessmentHistory({ assessments, onAssessmentClick }: AssessmentHistoryProps) {
  if (assessments.length === 0) {
    return (
      <Box py={4} textAlign="center">
        <Typography color="text.secondary">
          No assessments yet
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Test</TableCell>
            <TableCell>Leg</TableCell>
            <TableCell>Duration</TableCell>
            <TableCell>Score</TableCell>
            <TableCell>Stability</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {assessments.map((assessment) => {
            const score = assessment.durationSeconds
              ? getScore(assessment.durationSeconds)
              : null;

            return (
              <TableRow
                key={assessment.id}
                hover
                onClick={() => onAssessmentClick(assessment.id)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>
                  {new Date(assessment.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>One-Leg Balance</TableCell>
                <TableCell sx={{ textTransform: 'capitalize' }}>
                  {assessment.legTested}
                </TableCell>
                <TableCell>
                  {assessment.durationSeconds
                    ? `${assessment.durationSeconds.toFixed(1)}s`
                    : '-'}
                </TableCell>
                <TableCell>
                  {score && (
                    <Chip
                      label={score}
                      size="small"
                      color={SCORE_COLORS[score]}
                    />
                  )}
                </TableCell>
                <TableCell>
                  {assessment.stabilityScore
                    ? `${assessment.stabilityScore.toFixed(0)}/100`
                    : '-'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
```

### pages/Athletes/ProgressChart.tsx
```typescript
import { Box } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { AssessmentListItem } from '../../types/assessment';

interface ProgressChartProps {
  assessments: AssessmentListItem[];
}

export function ProgressChart({ assessments }: ProgressChartProps) {
  // Sort by date and prepare chart data
  const data = [...assessments]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((a) => ({
      date: new Date(a.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      duration: a.durationSeconds || 0,
      stability: a.stabilityScore || 0,
    }));

  return (
    <Box sx={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis
            yAxisId="duration"
            domain={[0, 30]}
            label={{ value: 'Duration (s)', angle: -90, position: 'insideLeft' }}
          />
          <YAxis
            yAxisId="stability"
            orientation="right"
            domain={[0, 100]}
            label={{ value: 'Stability', angle: 90, position: 'insideRight' }}
          />
          <Tooltip />
          <ReferenceLine
            yAxisId="duration"
            y={20}
            stroke="#4caf50"
            strokeDasharray="5 5"
            label="Target"
          />
          <Line
            yAxisId="duration"
            type="monotone"
            dataKey="duration"
            stroke="#1976d2"
            strokeWidth={2}
            dot={{ r: 4 }}
            name="Duration (s)"
          />
          <Line
            yAxisId="stability"
            type="monotone"
            dataKey="stability"
            stroke="#9c27b0"
            strokeWidth={2}
            dot={{ r: 4 }}
            name="Stability"
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
```

### pages/Athletes/ReportHistory.tsx
```typescript
import { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
} from '@mui/material';
import { Send as ResendIcon } from '@mui/icons-material';
import { reportsApi, ReportListItem } from '../../services/reports';
import { useSnackbar } from '../../contexts/SnackbarContext';

interface ReportHistoryProps {
  reports: ReportListItem[];
  onResent: () => void;
}

/**
 * Report History Component
 *
 * Trade-offs for including report history with resend:
 *
 * PROS:
 * - Coach can see what reports have been sent
 * - Easy resend if parent lost email/PIN
 * - Single place to manage athlete communications
 * - PIN regeneration improves security (old PIN invalidated)
 *
 * CONS:
 * - Additional API call on profile load
 * - UI complexity (another section to display)
 * - Resend could be abused (rate limiting needed on backend)
 * - Parent may receive multiple emails if coach resends frequently
 */
export function ReportHistory({ reports, onResent }: ReportHistoryProps) {
  const [resendingId, setResendingId] = useState<string | null>(null);
  const { showSnackbar } = useSnackbar();

  const handleResend = async (reportId: string) => {
    setResendingId(reportId);
    try {
      const result = await reportsApi.resend(reportId);
      showSnackbar(`Report resent. New PIN: ${result.pin}`, 'success');
      onResent();
    } catch (err: any) {
      showSnackbar(
        err.response?.data?.detail || 'Failed to resend report',
        'error'
      );
    } finally {
      setResendingId(null);
    }
  };

  if (reports.length === 0) {
    return null;  // Don't show section if no reports
  }

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Sent Reports
      </Typography>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date Sent</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell>
                  {new Date(report.sentAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Chip
                    label={report.sentAt ? 'Sent' : 'Pending'}
                    size="small"
                    color={report.sentAt ? 'success' : 'warning'}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    startIcon={
                      resendingId === report.id ? (
                        <CircularProgress size={16} />
                      ) : (
                        <ResendIcon />
                      )
                    }
                    onClick={() => handleResend(report.id)}
                    disabled={resendingId === report.id}
                  >
                    Resend
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        Resending generates a new PIN and invalidates the previous one.
      </Typography>
    </Paper>
  );
}
```

### services/reports.ts (additions)
```typescript
// Add to reportsApi (from FE-013):

export interface ReportListItem {
  id: string;
  athleteId: string;
  createdAt: string;
  sentAt?: string;
}

// Add to reportsApi object:
getByAthlete: async (athleteId: string): Promise<ReportListItem[]> => {
  const response = await api.get(`/reports/athlete/${athleteId}`);
  return response.data;  // Already transformed by interceptor
},
```

### services/assessments.ts (additions)
```typescript
// Add to assessmentsApi:

// Note: The api client (defined in FE-001) uses camelcase-keys interceptor
// to automatically transform snake_case responses to camelCase.
// No manual mapping is needed.

getByAthlete: async (athleteId: string): Promise<AssessmentListItem[]> => {
  const response = await api.get(`/assessments/athlete/${athleteId}`);
  return response.data.assessments;  // Already transformed by interceptor
},
```

### Field Mapping Reference (AssessmentListItem)

The `camelcase-keys` interceptor automatically converts:

| Backend (snake_case) | Frontend (camelCase) |
|---------------------|---------------------|
| `id` | `id` |
| `athlete_id` | `athleteId` |
| `athlete_name` | `athleteName` |
| `test_type` | `testType` |
| `leg_tested` | `legTested` |
| `created_at` | `createdAt` |
| `status` | `status` |
| `duration_seconds` | `durationSeconds` |
| `stability_score` | `stabilityScore` |

## Dependencies to Add

```json
{
  "dependencies": {
    "recharts": "^2.10.0"
  }
}
```

## Estimated Complexity
**M** (Medium) - 4 hours

## Testing Instructions

1. Navigate to `/athletes/:id`
2. Verify athlete info displays correctly
3. Verify consent status badge shows
4. Verify assessment history table displays
5. Click assessment row - should navigate to results
6. Verify progress chart renders with data
7. Click "Edit Athlete" - modal should open
8. Click "Delete Athlete" - confirmation should show
9. Verify "New Assessment" disabled if pending consent

## UI Reference

```
┌─────────────────────────────────────────────────────────────────┐
│ ┌────┐                                                          │
│ │ JS │  John Smith               [New Assessment] [Upload] [⋮] │
│ └────┘  12 years old • male                                    │
│         [Active] (green badge)                                  │
├─────────────────────────────────────────────────────────────────┤
│ Progress Over Time                                              │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 25 ─ ─ ─ ─ ─ ─ ─ ─ Target ─ ─ ─ ─ ─ ─ ─ ─ ─                │ │
│ │ 20 │              ●                                         │ │
│ │ 15 │        ●                                               │ │
│ │ 10 │   ●                                                    │ │
│ │  5 │                                                        │ │
│ │    └────────────────────────────────────────────           │ │
│ │       Jan 5    Jan 12    Jan 19                            │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ Assessment History                                              │
│ Date      │ Test            │ Leg   │ Duration │ Score │ Stab. │
│───────────┼─────────────────┼───────┼──────────┼───────┼───────│
│ Jan 19    │ One-Leg Balance │ Left  │ 18.5s    │ [3]   │ 75    │
│ Jan 12    │ One-Leg Balance │ Right │ 15.2s    │ [3]   │ 68    │
│ Jan 5     │ One-Leg Balance │ Left  │ 12.0s    │ [2]   │ 55    │
└─────────────────────────────────────────────────────────────────┘
```
