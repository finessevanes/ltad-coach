---
id: FE-004
depends_on: [FE-002, FE-003]
blocks: [FE-005, FE-007, FE-012]
---

# FE-004: Athletes List Page

## Title
Implement athlete roster list page with status badges and search

## Scope

### In Scope
- Athletes list view at `/athletes`
- Status badges (pending consent, active)
- Search/filter by name
- Filter by consent status
- "Add Athlete" button (links to FE-005)
- Empty state when no athletes
- Loading state while fetching
- Click row to navigate to athlete profile

### Out of Scope
- Add athlete modal/form (FE-005)
- Athlete profile page (FE-012)
- Consent workflow UI (FE-007)

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| List Component | MUI DataGrid or Table | Good for sortable lists |
| Search | Client-side filter | Roster ≤25, no need for server search |
| Status Badge | MUI Chip | Standard pattern for status indicators |

## Acceptance Criteria

- [ ] Page accessible at `/athletes` (protected route)
- [ ] Athletes displayed in a table/list with columns: Name, Age, Status, Actions
- [ ] Pending consent status shows yellow "Pending" badge
- [ ] Active consent status shows green "Active" badge
- [ ] Search input filters athletes by name (client-side)
- [ ] Status filter dropdown filters by consent status
- [ ] "Add Athlete" button navigates to add athlete page/modal
- [ ] Clicking athlete row navigates to `/athletes/:id`
- [ ] Empty state shows helpful message and "Add Athlete" CTA
- [ ] Loading spinner while fetching athletes
- [ ] Error state if fetch fails

## Files to Create/Modify

```
client/src/
├── pages/
│   └── Athletes/
│       ├── index.tsx           # Athletes list page
│       └── AthletesTable.tsx   # Table component
├── components/
│   └── StatusBadge.tsx         # Reusable status chip
├── services/
│   └── athletes.ts             # API calls for athletes
├── types/
│   └── athlete.ts              # Athlete types
└── routes/
    └── index.tsx               # Add /athletes route (modify)
```

## Implementation Details

### types/athlete.ts
```typescript
export type ConsentStatus = 'pending' | 'active' | 'declined';
export type Gender = 'male' | 'female' | 'other';

export interface Athlete {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  parentEmail: string;
  consentStatus: ConsentStatus;
  createdAt: string;
  avatarUrl?: string;
}

export interface AthleteCreate {
  name: string;
  age: number;
  gender: Gender;
  parentEmail: string;
}
```

### services/athletes.ts
```typescript
import { api } from './api';
import { Athlete, AthleteCreate } from '../types/athlete';
import snakecaseKeys from 'snakecase-keys';

// Note: The api client (defined in FE-001) uses camelcase-keys interceptor
// to automatically transform snake_case responses to camelCase.
// For request bodies, we use snakecase-keys to transform camelCase to snake_case.

export const athletesApi = {
  getAll: async (status?: string): Promise<Athlete[]> => {
    const params = status ? { status } : {};
    const response = await api.get('/athletes', { params });
    return response.data.athletes;  // Already transformed by interceptor
  },

  getById: async (id: string): Promise<Athlete> => {
    const response = await api.get(`/athletes/${id}`);
    return response.data;  // Already transformed by interceptor
  },

  create: async (data: AthleteCreate): Promise<Athlete> => {
    // Transform request body to snake_case for backend
    const response = await api.post('/athletes', snakecaseKeys(data));
    return response.data;  // Already transformed by interceptor
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/athletes/${id}`);
  },
};
```

### Field Mapping Reference

The `camelcase-keys` interceptor (configured in FE-001) automatically converts all backend snake_case fields to frontend camelCase.

| Backend (snake_case) | Frontend (camelCase) |
|---------------------|---------------------|
| `id` | `id` |
| `name` | `name` |
| `age` | `age` |
| `gender` | `gender` |
| `parent_email` | `parentEmail` |
| `consent_status` | `consentStatus` |
| `created_at` | `createdAt` |
| `avatar_url` | `avatarUrl` |

**Note**: For POST/PUT request bodies, use `snakecase-keys` to convert camelCase to snake_case before sending to the backend. Add to package.json:
```json
"snakecase-keys": "^6.0.0"
```

### pages/Athletes/index.tsx
```typescript
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { athletesApi } from '../../services/athletes';
import { Athlete, ConsentStatus } from '../../types/athlete';
import { AthletesTable } from './AthletesTable';
import { EmptyState } from '../../components/EmptyState';

export default function AthletesPage() {
  const navigate = useNavigate();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ConsentStatus | 'all'>('all');

  useEffect(() => {
    loadAthletes();
  }, []);

  const loadAthletes = async () => {
    try {
      setLoading(true);
      const data = await athletesApi.getAll();
      setAthletes(data);
    } catch (err) {
      setError('Failed to load athletes');
    } finally {
      setLoading(false);
    }
  };

  const filteredAthletes = useMemo(() => {
    return athletes.filter((athlete) => {
      const matchesSearch = athlete.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' || athlete.consentStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [athletes, searchQuery, statusFilter]);

  const handleAthleteClick = (id: string) => {
    navigate(`/athletes/${id}`);
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Athletes</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/athletes/new')}
        >
          Add Athlete
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {athletes.length === 0 ? (
        <EmptyState
          title="No athletes yet"
          description="Add your first athlete to get started with assessments."
          actionLabel="Add Athlete"
          onAction={() => navigate('/athletes/new')}
        />
      ) : (
        <>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box display="flex" gap={2}>
              <TextField
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                sx={{ width: 300 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Paper>

          <AthletesTable
            athletes={filteredAthletes}
            onRowClick={handleAthleteClick}
          />
        </>
      )}
    </Container>
  );
}
```

### pages/Athletes/AthletesTable.tsx
```typescript
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Visibility as ViewIcon } from '@mui/icons-material';
import { Athlete } from '../../types/athlete';
import { StatusBadge } from '../../components/StatusBadge';

interface AthletesTableProps {
  athletes: Athlete[];
  onRowClick: (id: string) => void;
}

export function AthletesTable({ athletes, onRowClick }: AthletesTableProps) {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Age</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {athletes.map((athlete) => (
            <TableRow
              key={athlete.id}
              hover
              onClick={() => onRowClick(athlete.id)}
              sx={{ cursor: 'pointer' }}
            >
              <TableCell>{athlete.name}</TableCell>
              <TableCell>{athlete.age}</TableCell>
              <TableCell>
                <StatusBadge status={athlete.consentStatus} />
              </TableCell>
              <TableCell align="right">
                <Tooltip title="View Profile">
                  <IconButton size="small">
                    <ViewIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
```

### components/StatusBadge.tsx
```typescript
import { Chip } from '@mui/material';
import { ConsentStatus } from '../types/athlete';

interface StatusBadgeProps {
  status: ConsentStatus;
}

const statusConfig: Record<ConsentStatus, { label: string; color: 'warning' | 'success' | 'error' }> = {
  pending: { label: 'Pending Consent', color: 'warning' },
  active: { label: 'Active', color: 'success' },
  declined: { label: 'Declined', color: 'error' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return <Chip label={config.label} color={config.color} size="small" />;
}
```

### components/EmptyState.tsx
```typescript
import { Box, Typography, Button } from '@mui/material';
import { SportsScore as SportsIcon } from '@mui/icons-material';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      py={8}
    >
      <SportsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {description}
      </Typography>
      <Button variant="contained" onClick={onAction}>
        {actionLabel}
      </Button>
    </Box>
  );
}
```

## Estimated Complexity
**S** (Small) - 3-4 hours

## Testing Instructions

1. Navigate to /athletes while logged in
2. Verify empty state shows when no athletes
3. Add athletes (after FE-005 is done) and verify list populates
4. Test search filter - type name and verify filtering
5. Test status filter - select "Pending" and verify only pending shows
6. Click an athlete row - verify navigation to profile
7. Verify "Add Athlete" button navigates correctly

## UI Reference

```
┌────────────────────────────────────────────────────────────┐
│ Athletes                                    [+ Add Athlete] │
├────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────┐  ┌──────────────┐              │
│ │ 🔍 Search by name...    │  │ Status: All ▾│              │
│ └─────────────────────────┘  └──────────────┘              │
├────────────────────────────────────────────────────────────┤
│ Name            │ Age │ Status           │ Actions         │
├────────────────────────────────────────────────────────────┤
│ John Smith      │ 12  │ [Active] (green) │ 👁               │
│ Jane Doe        │ 11  │ [Pending](yellow)│ 👁               │
│ Mike Johnson    │ 13  │ [Active] (green) │ 👁               │
└────────────────────────────────────────────────────────────┘
```
