---
id: FE-015
depends_on: [FE-002, FE-004, FE-005, FE-011, BE-015]
blocks: []
---

# FE-015: Coach Dashboard

## Title
Implement main dashboard with quick stats and recent activity

## Scope

### In Scope
- Dashboard page at `/dashboard`
- Quick stats cards (athlete count, pending consent, assessments)
- Recent assessments feed
- Pending consent alerts
- Quick action buttons

### Out of Scope
- Advanced analytics
- Charts/graphs (simple stats only for MVP)

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Layout | Responsive grid | Works on desktop and tablet |
| Activity Feed | Last 10 items | Quick overview, not complete history |
| Stats | Simple counts | MVP appropriate |

## Acceptance Criteria

- [ ] Dashboard accessible at `/dashboard` after login
- [ ] Stats cards show: total athletes, active athletes, pending consent
- [ ] Recent assessments list shows last 10 assessments
- [ ] Pending consent section highlights athletes needing consent
- [ ] Quick action: "Add Athlete" button
- [ ] Quick action: "View All Athletes" link
- [ ] Click assessment navigates to results
- [ ] Click athlete navigates to profile
- [ ] Loading states for all sections

## Files to Create/Modify

```
client/src/
├── pages/
│   └── Dashboard/
│       ├── index.tsx                # Main dashboard
│       ├── StatsCards.tsx           # Quick stats
│       ├── RecentActivity.tsx       # Activity feed
│       └── PendingConsent.tsx       # Consent alerts
├── services/
│   └── dashboard.ts                 # Dashboard data fetching
└── routes/
    └── index.tsx                    # Set /dashboard as default (modify)
```

## Implementation Details

### services/dashboard.ts
```typescript
import { api } from './api';
import { Athlete } from '../types/athlete';
import { AssessmentListItem } from '../types/assessment';

export interface DashboardStats {
  totalAthletes: number;
  activeAthletes: number;
  pendingConsent: number;
  totalAssessments: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentAssessments: AssessmentListItem[];
  pendingAthletes: Athlete[];
}

// Note: The api client (defined in FE-001) uses camelcase-keys interceptor
// to automatically transform snake_case responses to camelCase.
// No manual mapping is needed - response.data is already in camelCase.

export const dashboardApi = {
  getData: async (): Promise<DashboardData> => {
    // Use dedicated dashboard endpoint for efficiency
    const response = await api.get('/dashboard');
    return response.data;  // Already transformed by interceptor
  },
};
```

### pages/Dashboard/index.tsx
```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { dashboardApi, DashboardData } from '../../services/dashboard';
import { StatsCards } from './StatsCards';
import { RecentActivity } from './RecentActivity';
import { PendingConsent } from './PendingConsent';
import { useAuth } from '../../contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const dashboardData = await dashboardApi.getData();
      setData(dashboardData);
    } catch (err) {
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4">
            Welcome back, {user?.name?.split(' ')[0] || 'Coach'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's what's happening with your athletes
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/athletes/new')}
        >
          Add Athlete
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {data && (
        <Grid container spacing={3}>
          {/* Stats Cards */}
          <Grid item xs={12}>
            <StatsCards stats={data.stats} />
          </Grid>

          {/* Pending Consent Alerts */}
          {data.pendingAthletes.length > 0 && (
            <Grid item xs={12}>
              <PendingConsent athletes={data.pendingAthletes} />
            </Grid>
          )}

          {/* Recent Activity */}
          <Grid item xs={12}>
            <RecentActivity assessments={data.recentAssessments} />
          </Grid>
        </Grid>
      )}
    </Container>
  );
}
```

### pages/Dashboard/StatsCards.tsx
```typescript
import { Paper, Typography, Box, Grid } from '@mui/material';
import {
  People as PeopleIcon,
  CheckCircle as ActiveIcon,
  HourglassEmpty as PendingIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { DashboardStats } from '../../services/dashboard';

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: 'Total Athletes',
      value: stats.totalAthletes,
      icon: <PeopleIcon />,
      color: '#1976d2',
    },
    {
      label: 'Active Athletes',
      value: stats.activeAthletes,
      icon: <ActiveIcon />,
      color: '#4caf50',
    },
    {
      label: 'Pending Consent',
      value: stats.pendingConsent,
      icon: <PendingIcon />,
      color: '#ff9800',
    },
    {
      label: 'Assessments',
      value: stats.totalAssessments,
      icon: <AssessmentIcon />,
      color: '#9c27b0',
    },
  ];

  return (
    <Grid container spacing={2}>
      {cards.map((card, index) => (
        <Grid item xs={6} md={3} key={index}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 1,
                  bgcolor: `${card.color}15`,
                  color: card.color,
                }}
              >
                {card.icon}
              </Box>
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {card.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.label}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}
```

### pages/Dashboard/PendingConsent.tsx
```typescript
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  Box,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Button,
} from '@mui/material';
import { Athlete } from '../../types/athlete';

interface PendingConsentProps {
  athletes: Athlete[];
}

export function PendingConsent({ athletes }: PendingConsentProps) {
  const navigate = useNavigate();

  return (
    <Paper sx={{ p: 3 }}>
      <Alert severity="warning" sx={{ mb: 2 }}>
        <AlertTitle>Consent Required</AlertTitle>
        {athletes.length} athlete{athletes.length !== 1 ? 's' : ''} pending parental consent
      </Alert>

      <List>
        {athletes.slice(0, 5).map((athlete) => (
          <ListItem key={athlete.id} divider>
            <ListItemText
              primary={athlete.name}
              secondary={`Sent to: ${athlete.parentEmail}`}
            />
            <ListItemSecondaryAction>
              <Button
                size="small"
                onClick={() => navigate(`/athletes/${athlete.id}`)}
              >
                View
              </Button>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      {athletes.length > 5 && (
        <Box textAlign="center" mt={1}>
          <Button onClick={() => navigate('/athletes?status=pending')}>
            View all {athletes.length} pending
          </Button>
        </Box>
      )}
    </Paper>
  );
}
```

### pages/Dashboard/RecentActivity.tsx
```typescript
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Button,
} from '@mui/material';
import { AssessmentListItem } from '../../types/assessment';

interface RecentActivityProps {
  assessments: AssessmentListItem[];
}

function getScoreColor(duration: number): 'error' | 'warning' | 'info' | 'success' | 'secondary' {
  if (duration >= 25) return 'secondary';
  if (duration >= 20) return 'success';
  if (duration >= 15) return 'info';
  if (duration >= 10) return 'warning';
  return 'error';
}

function getScore(duration: number): number {
  if (duration >= 25) return 5;
  if (duration >= 20) return 4;
  if (duration >= 15) return 3;
  if (duration >= 10) return 2;
  return 1;
}

export function RecentActivity({ assessments }: RecentActivityProps) {
  const navigate = useNavigate();

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Recent Assessments</Typography>
        <Button size="small" onClick={() => navigate('/assessments')}>
          View All
        </Button>
      </Box>

      {assessments.length === 0 ? (
        <Box py={4} textAlign="center">
          <Typography color="text.secondary">
            No assessments yet. Complete your first assessment to see activity here.
          </Typography>
        </Box>
      ) : (
        <List>
          {assessments.map((assessment) => (
            <ListItem
              key={assessment.id}
              button
              onClick={() => navigate(`/assessments/${assessment.id}`)}
              divider
            >
              <ListItemText
                primary={assessment.athleteName}
                secondary={`${new Date(assessment.createdAt).toLocaleDateString()} • ${assessment.legTested} leg`}
              />
              <ListItemSecondaryAction>
                {assessment.durationSeconds && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2" color="text.secondary">
                      {assessment.durationSeconds.toFixed(1)}s
                    </Typography>
                    <Chip
                      label={getScore(assessment.durationSeconds)}
                      size="small"
                      color={getScoreColor(assessment.durationSeconds)}
                    />
                  </Box>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
}
```

## Estimated Complexity
**S** (Small) - 3 hours

## Testing Instructions

1. Login and verify redirect to `/dashboard`
2. Verify stats cards show correct counts
3. Add athlete with pending consent - verify alert appears
4. Complete assessment - verify it shows in recent activity
5. Click assessment - verify navigation
6. Click "Add Athlete" - verify navigation
7. Test responsive layout on tablet

## UI Reference

```
┌─────────────────────────────────────────────────────────────────┐
│ Welcome back, Coach                            [+ Add Athlete]  │
│ Here's what's happening with your athletes                      │
├─────────────────────────────────────────────────────────────────┤
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐    │
│ │ 👥  12     │ │ ✅  10     │ │ ⏳   2     │ │ 📊  45     │    │
│ │ Total      │ │ Active     │ │ Pending    │ │ Assessments│    │
│ │ Athletes   │ │ Athletes   │ │ Consent    │ │            │    │
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│ ⚠️ Consent Required                                             │
│ 2 athletes pending parental consent                             │
│                                                                 │
│ Jane Doe         Sent to: parent1@email.com          [View]    │
│ Mike Smith       Sent to: parent2@email.com          [View]    │
├─────────────────────────────────────────────────────────────────┤
│ Recent Assessments                                  [View All]  │
│                                                                 │
│ John Smith       Jan 15 • left leg              18.5s  [4]     │
│ Sarah Jones      Jan 14 • right leg             21.0s  [4]     │
│ Tom Wilson       Jan 14 • left leg              15.2s  [3]     │
│ ...                                                             │
└─────────────────────────────────────────────────────────────────┘
```
