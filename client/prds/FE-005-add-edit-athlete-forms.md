---
id: FE-005
depends_on: [FE-002, FE-004]
blocks: [FE-007, FE-008]
---

# FE-005: Add and Edit Athlete Forms

## Title
Implement add athlete page and edit athlete modal/form

## Scope

### In Scope
- Add athlete page at `/athletes/new`
- Form fields: name, age, gender, parent email
- Form validation
- Submit creates athlete via API
- Success redirects to athletes list
- Edit athlete modal (triggered from athlete profile)
- Loading states during submission

### Out of Scope
- Consent email sending (happens automatically on backend)
- Athlete profile page (FE-012)

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Add Flow | Dedicated page | More space for form, clearer UX |
| Edit Flow | Modal dialog | Quick edits without navigation |
| Age Input | Number field with stepper | Easier than dropdown for age range |

## Acceptance Criteria

- [ ] Add athlete page accessible at `/athletes/new`
- [ ] Form validates: name required, age 5-13, valid email
- [ ] Gender selection via radio buttons or select
- [ ] Submit button disabled while submitting
- [ ] Success shows toast and redirects to /athletes
- [ ] Error shows error message in form
- [ ] Edit modal opens with pre-filled data
- [ ] Edit submit updates athlete
- [ ] Cancel on edit modal closes without saving

## Files to Create/Modify

```
client/src/
├── pages/
│   └── Athletes/
│       ├── AddAthlete.tsx       # Add athlete page
│       └── EditAthleteModal.tsx # Edit modal component (exported for use in FE-012)
├── components/
│   └── index.ts                 # Re-export EditAthleteModal for easy imports
├── services/
│   └── athletes.ts              # Add update method (modify)
└── routes/
    └── index.tsx                # Add /athletes/new route (modify)
```

> **Note**: `EditAthleteModal` is exported and used by FE-012 (Athlete Profile) for editing athlete details.

## Implementation Details

### pages/Athletes/AddAthlete.tsx
```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormHelperText,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { athletesApi } from '../../services/athletes';
import { Gender } from '../../types/athlete';

const schema = yup.object({
  name: yup.string().required('Name is required').max(100),
  age: yup
    .number()
    .required('Age is required')
    .min(5, 'Age must be at least 5')
    .max(13, 'Age must be at most 13')
    .integer('Age must be a whole number'),
  gender: yup
    .string()
    .oneOf(['male', 'female', 'other'] as const)
    .required('Gender is required'),
  parentEmail: yup
    .string()
    .email('Invalid email address')
    .required('Parent email is required'),
});

type FormData = yup.InferType<typeof schema>;

export default function AddAthlete() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      gender: 'male',
    },
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    setSubmitting(true);

    try {
      await athletesApi.create({
        name: data.name,
        age: data.age,
        gender: data.gender as Gender,
        parentEmail: data.parentEmail,
      });

      // Show success toast (using SnackbarContext from FE-007)
      showSnackbar('Athlete added! Consent email sent to parent.', 'success');
      navigate('/athletes');
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Failed to add athlete. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Add New Athlete
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          A consent request will be sent to the parent's email.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            {...register('name')}
            label="Athlete Name"
            fullWidth
            margin="normal"
            error={!!errors.name}
            helperText={errors.name?.message}
            disabled={submitting}
          />

          <TextField
            {...register('age', { valueAsNumber: true })}
            label="Age"
            type="number"
            fullWidth
            margin="normal"
            inputProps={{ min: 5, max: 13 }}
            error={!!errors.age}
            helperText={errors.age?.message || 'Ages 5-13 supported (LTAD Frisch benchmarks)'}
            disabled={submitting}
          />

          <FormControl
            component="fieldset"
            margin="normal"
            error={!!errors.gender}
            disabled={submitting}
          >
            <FormLabel component="legend">Gender</FormLabel>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <RadioGroup {...field} row>
                  <FormControlLabel value="male" control={<Radio />} label="Male" />
                  <FormControlLabel value="female" control={<Radio />} label="Female" />
                  <FormControlLabel value="other" control={<Radio />} label="Other" />
                </RadioGroup>
              )}
            />
            {errors.gender && (
              <FormHelperText>{errors.gender.message}</FormHelperText>
            )}
          </FormControl>

          <TextField
            {...register('parentEmail')}
            label="Parent/Guardian Email"
            type="email"
            fullWidth
            margin="normal"
            error={!!errors.parentEmail}
            helperText={errors.parentEmail?.message || 'Consent request will be sent to this email'}
            disabled={submitting}
          />

          <Box display="flex" gap={2} mt={3}>
            <Button
              variant="outlined"
              onClick={() => navigate('/athletes')}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{ flex: 1 }}
            >
              {submitting ? <CircularProgress size={24} /> : 'Add Athlete'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}
```

### pages/Athletes/EditAthleteModal.tsx
```typescript
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { athletesApi } from '../../services/athletes';
import { Athlete, Gender } from '../../types/athlete';

const schema = yup.object({
  name: yup.string().required('Name is required').max(100),
  age: yup
    .number()
    .required('Age is required')
    .min(5, 'Age must be at least 5')
    .max(13, 'Age must be at most 13')
    .integer(),
  gender: yup
    .string()
    .oneOf(['male', 'female', 'other'] as const)
    .required('Gender is required'),
  parentEmail: yup
    .string()
    .email('Invalid email address')
    .required('Parent email is required'),
});

type FormData = yup.InferType<typeof schema>;

interface EditAthleteModalProps {
  open: boolean;
  athlete: Athlete | null;
  onClose: () => void;
  onSaved: (athlete: Athlete) => void;
}

export function EditAthleteModal({
  open,
  athlete,
  onClose,
  onSaved,
}: EditAthleteModalProps) {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  // Reset form when athlete changes
  useEffect(() => {
    if (athlete) {
      reset({
        name: athlete.name,
        age: athlete.age,
        gender: athlete.gender,
        parentEmail: athlete.parentEmail,
      });
    }
  }, [athlete, reset]);

  const onSubmit = async (data: FormData) => {
    if (!athlete) return;

    setError('');
    setSubmitting(true);

    try {
      const updated = await athletesApi.update(athlete.id, {
        name: data.name,
        age: data.age,
        gender: data.gender as Gender,
        parentEmail: data.parentEmail,
      });
      onSaved(updated);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update athlete');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>Edit Athlete</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            {...register('name')}
            label="Athlete Name"
            fullWidth
            margin="normal"
            error={!!errors.name}
            helperText={errors.name?.message}
            disabled={submitting}
          />

          <TextField
            {...register('age', { valueAsNumber: true })}
            label="Age"
            type="number"
            fullWidth
            margin="normal"
            inputProps={{ min: 5, max: 13 }}
            error={!!errors.age}
            helperText={errors.age?.message}
            disabled={submitting}
          />

          <FormControl component="fieldset" margin="normal" disabled={submitting}>
            <FormLabel component="legend">Gender</FormLabel>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <RadioGroup {...field} row>
                  <FormControlLabel value="male" control={<Radio />} label="Male" />
                  <FormControlLabel value="female" control={<Radio />} label="Female" />
                  <FormControlLabel value="other" control={<Radio />} label="Other" />
                </RadioGroup>
              )}
            />
          </FormControl>

          <TextField
            {...register('parentEmail')}
            label="Parent/Guardian Email"
            type="email"
            fullWidth
            margin="normal"
            error={!!errors.parentEmail}
            helperText={errors.parentEmail?.message}
            disabled={submitting}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
```

### services/athletes.ts (additions)
```typescript
import snakecaseKeys from 'snakecase-keys';

// Add to existing athletesApi object:

update: async (id: string, data: Partial<AthleteCreate>): Promise<Athlete> => {
  // Transform request body to snake_case for backend
  const response = await api.put(`/athletes/${id}`, snakecaseKeys(data));
  return response.data;  // Already transformed by interceptor
},
```

**Note**: The `snakecase-keys` library handles the camelCase to snake_case conversion for request bodies. The `camelcase-keys` interceptor (configured in FE-001) handles the response conversion automatically.

## Estimated Complexity
**S** (Small) - 2-3 hours

## Testing Instructions

1. Navigate to /athletes/new
2. Test validation:
   - Submit empty form - should show errors
   - Enter invalid email - should show error
   - Enter age outside range - should show error
3. Submit valid form:
   - Should show loading state
   - Should redirect to /athletes on success
   - Should show success message
4. Test edit modal (after FE-012):
   - Click edit on athlete profile
   - Form should be pre-filled
   - Change values and save
   - Modal should close and data should update

## UI Reference

### Add Athlete Page
```
┌──────────────────────────────────────┐
│        Add New Athlete               │
│ A consent request will be sent to    │
│ the parent's email.                  │
│                                      │
│ Athlete Name                         │
│ ┌──────────────────────────────────┐ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Age                                  │
│ ┌──────────────────────────────────┐ │
│ │  12                        [▲▼]  │ │
│ └──────────────────────────────────┘ │
│ Ages 5-13 supported (LTAD benchmarks)│
│                                      │
│ Gender                               │
│ ○ Male  ○ Female  ○ Other           │
│                                      │
│ Parent/Guardian Email                │
│ ┌──────────────────────────────────┐ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
│ Consent request will be sent here    │
│                                      │
│ [Cancel]        [Add Athlete]        │
└──────────────────────────────────────┘
```

## Edit Lock (Concurrent Access Prevention)

When editing an athlete, acquire a lock to prevent conflicts from multiple sessions.

### API Methods (add to services/athletes.ts)

```typescript
// Add to athletesApi object:

acquireLock: async (id: string): Promise<{ expiresInSeconds: number }> => {
  const response = await api.post(`/athletes/${id}/lock`);
  return response.data;
},

releaseLock: async (id: string): Promise<void> => {
  await api.delete(`/athletes/${id}/lock`);
},
```

### Hook: useEditLock (hooks/useEditLock.ts)

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import { athletesApi } from '../services/athletes';

interface UseEditLockResult {
  hasLock: boolean;
  isLocked: boolean;        // Locked by another user
  lockError: string | null;
  acquireLock: () => Promise<boolean>;
  releaseLock: () => Promise<void>;
}

export function useEditLock(athleteId: string): UseEditLockResult {
  const [hasLock, setHasLock] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const acquireLock = useCallback(async (): Promise<boolean> => {
    try {
      const result = await athletesApi.acquireLock(athleteId);
      setHasLock(true);
      setIsLocked(false);
      setLockError(null);

      // Refresh lock every 4 minutes (lock expires after 5)
      refreshIntervalRef.current = setInterval(async () => {
        try {
          await athletesApi.acquireLock(athleteId);
        } catch {
          setHasLock(false);
        }
      }, 4 * 60 * 1000);

      return true;
    } catch (err: any) {
      if (err.response?.status === 409) {
        setIsLocked(true);
        setLockError('This athlete is being edited in another session');
      } else {
        setLockError(err.response?.data?.detail || 'Failed to acquire lock');
      }
      return false;
    }
  }, [athleteId]);

  const releaseLock = useCallback(async () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    try {
      await athletesApi.releaseLock(athleteId);
    } catch {
      // Ignore errors on release
    }
    setHasLock(false);
  }, [athleteId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      // Release lock on unmount
      athletesApi.releaseLock(athleteId).catch(() => {});
    };
  }, [athleteId]);

  return { hasLock, isLocked, lockError, acquireLock, releaseLock };
}
```

### Updated EditAthleteModal Usage

```typescript
// In EditAthleteModal.tsx, add:
const { hasLock, isLocked, lockError, acquireLock, releaseLock } = useEditLock(athlete.id);

// On modal open:
useEffect(() => {
  if (open) {
    acquireLock();
  }
  return () => {
    if (open) {
      releaseLock();
    }
  };
}, [open]);

// Show lock error if present:
{isLocked && (
  <Alert severity="warning" sx={{ mb: 2 }}>
    {lockError || 'This athlete is being edited in another session'}
  </Alert>
)}

// Disable form if locked by another user:
<TextField disabled={submitting || isLocked} ... />
```

## Notes
- The backend automatically sends consent email when athlete is created
- Consider adding a confirmation dialog before create
- Parent email change on edit should trigger new consent email (backend handles this)
- Edit lock prevents data conflicts when same athlete is opened in multiple browser tabs/devices
