---
id: FE-007
depends_on: [FE-004, FE-005]
blocks: [FE-008]
---

# FE-007: Consent Status UI in Athlete Management

## Title
Add consent status indicators and resend functionality to athlete management

## Scope

### In Scope
- Pending consent alert banner on athlete profile
- Declined consent alert banner on athlete profile
- Resend consent email button (for pending athletes)
- Consent status indicator on assessment attempt
- Block assessment for pending and declined consent athletes
- Consent timestamp display for active athletes

### Out of Scope
- Consent form itself (FE-006)

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Block UI | Alert + disabled button | Clear feedback on why action blocked |
| Resend | Button with loading state | Simple, direct action |
| Toast | MUI Snackbar | Consistent with app patterns |

## Acceptance Criteria

- [ ] Athletes list shows colored status badge (yellow pending, green active, red declined)
- [ ] Athlete profile shows warning alert if consent pending
- [ ] Athlete profile shows error alert if consent declined
- [ ] "Resend Consent Email" button available for pending athletes
- [ ] Clicking resend shows loading, then success/error toast
- [ ] "New Assessment" button disabled for pending and declined consent athletes
- [ ] Tooltip explains why assessment is blocked (different message for declined vs pending)
- [ ] Active athletes show consent timestamp

## Files to Create/Modify

```
client/src/
├── pages/
│   └── Athletes/
│       ├── AthleteProfile.tsx       # Add consent UI (modify in FE-012)
│       └── ConsentAlert.tsx         # Pending consent alert component
├── components/
│   ├── StatusBadge.tsx              # Consent status badge (exported for FE-004, FE-012)
│   └── Snackbar.tsx                 # Toast notification component
├── services/
│   └── athletes.ts                  # Add resend method (modify)
└── contexts/
    └── SnackbarContext.tsx          # Toast context
```

> **Note**: Both `ConsentAlert` and `StatusBadge` are exported for use by FE-004 (Athletes List) and FE-012 (Athlete Profile).

## Implementation Details

### components/StatusBadge.tsx
```typescript
import { Chip, ChipProps } from '@mui/material';
import {
  CheckCircle as ActiveIcon,
  HourglassEmpty as PendingIcon,
  Cancel as DeclinedIcon,
} from '@mui/icons-material';

type ConsentStatus = 'pending' | 'active' | 'declined';

interface StatusBadgeProps {
  status: ConsentStatus;
  size?: 'small' | 'medium';
}

const statusConfig: Record<ConsentStatus, {
  label: string;
  color: ChipProps['color'];
  icon: React.ReactElement;
}> = {
  pending: {
    label: 'Pending',
    color: 'warning',
    icon: <PendingIcon />,
  },
  active: {
    label: 'Active',
    color: 'success',
    icon: <ActiveIcon />,
  },
  declined: {
    label: 'Declined',
    color: 'error',
    icon: <DeclinedIcon />,
  },
};

export function StatusBadge({ status, size = 'small' }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Chip
      label={config.label}
      color={config.color}
      icon={config.icon}
      size={size}
      variant="outlined"
    />
  );
}
```

### components/ConsentAlert.tsx
```typescript
import { useState } from 'react';
import {
  Alert,
  AlertTitle,
  Button,
  CircularProgress,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { athletesApi } from '../services/athletes';
import { useSnackbar } from '../contexts/SnackbarContext';

interface ConsentAlertProps {
  athleteId: string;
  athleteName: string;
  parentEmail: string;
  status: 'pending' | 'declined';
}

export function ConsentAlert({
  athleteId,
  athleteName,
  parentEmail,
  status,
}: ConsentAlertProps) {
  const [sending, setSending] = useState(false);
  const { showSnackbar } = useSnackbar();

  const handleResend = async () => {
    setSending(true);
    try {
      await athletesApi.resendConsent(athleteId);
      showSnackbar('Consent email sent successfully!', 'success');
    } catch (err: any) {
      showSnackbar(
        err.response?.data?.detail || 'Failed to send consent email',
        'error'
      );
    } finally {
      setSending(false);
    }
  };

  if (status === 'declined') {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        <AlertTitle>Consent Declined</AlertTitle>
        The parent/guardian ({parentEmail}) has declined consent for{' '}
        <strong>{athleteName}</strong> to participate in athletic assessments.
        <br />
        <br />
        Contact the parent directly if you believe this was done in error.
        Assessments cannot be conducted for this athlete.
      </Alert>
    );
  }

  return (
    <Alert
      severity="warning"
      sx={{ mb: 3 }}
      action={
        <Button
          color="inherit"
          size="small"
          startIcon={sending ? <CircularProgress size={16} /> : <SendIcon />}
          onClick={handleResend}
          disabled={sending}
        >
          Resend Email
        </Button>
      }
    >
      <AlertTitle>Consent Pending</AlertTitle>
      Parental consent has not been received for <strong>{athleteName}</strong>.
      A consent request was sent to <strong>{parentEmail}</strong>.
      <br />
      Assessments cannot be conducted until consent is provided.
    </Alert>
  );
}
```

### contexts/SnackbarContext.tsx
```typescript
import { createContext, useContext, useState, ReactNode } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

interface SnackbarContextType {
  showSnackbar: (message: string, severity?: AlertColor) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<AlertColor>('info');

  const showSnackbar = (msg: string, sev: AlertColor = 'info') => {
    setMessage(msg);
    setSeverity(sev);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={5000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleClose} severity={severity} variant="filled">
          {message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const context = useContext(SnackbarContext);
  if (context === undefined) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
}
```

### services/athletes.ts (additions)
```typescript
// Add to athletesApi object:

resendConsent: async (athleteId: string): Promise<void> => {
  await api.post(`/athletes/${athleteId}/resend-consent`);
},
```

### Athlete Profile Usage Example
```typescript
// In AthleteProfile.tsx (FE-012)
import { ConsentAlert } from './ConsentAlert';
import { Tooltip } from '@mui/material';

function AthleteProfile({ athlete }: { athlete: Athlete }) {
  const isPending = athlete.consentStatus === 'pending';
  const isDeclined = athlete.consentStatus === 'declined';
  const canAssess = athlete.consentStatus === 'active';

  const getTooltipMessage = () => {
    if (isPending) return 'Consent required before assessment';
    if (isDeclined) return 'Parent declined consent - assessment not allowed';
    return '';
  };

  return (
    <div>
      {(isPending || isDeclined) && (
        <ConsentAlert
          athleteId={athlete.id}
          athleteName={athlete.name}
          parentEmail={athlete.parentEmail}
          status={athlete.consentStatus as 'pending' | 'declined'}
        />
      )}

      {/* Assessment button */}
      <Tooltip title={getTooltipMessage()}>
        <span>
          <Button
            variant="contained"
            disabled={!canAssess}
            onClick={() => navigate(`/assess/${athlete.id}`)}
          >
            New Assessment
          </Button>
        </span>
      </Tooltip>

      {/* For active athletes, show consent timestamp */}
      {canAssess && athlete.consentTimestamp && (
        <Typography variant="caption" color="text.secondary">
          Consent provided on {formatDate(athlete.consentTimestamp)}
        </Typography>
      )}
    </div>
  );
}
```

### App.tsx Update
```typescript
import { SnackbarProvider } from './contexts/SnackbarContext';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <AuthProvider>
          <SnackbarProvider>
            <Routes />
          </SnackbarProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
```

## Estimated Complexity
**S** (Small) - 2 hours

## Testing Instructions

1. Create athlete with pending consent status
2. Navigate to athlete profile (after FE-012)
3. Verify warning alert shows
4. Verify "New Assessment" button is disabled
5. Hover over button - should show tooltip explaining why
6. Click "Resend Email" button
7. Verify loading state, then success toast
8. Sign consent for athlete
9. Refresh page - alert should be gone
10. Verify assessment button is now enabled

## UI Reference

### Pending Consent Alert
```
┌──────────────────────────────────────────────────────────────┐
│ ⚠️ Consent Pending                            [Resend Email] │
│ Parental consent has not been received for John Smith.      │
│ A consent request was sent to parent@example.com.           │
│ Assessments cannot be conducted until consent is provided.  │
└──────────────────────────────────────────────────────────────┘
```

### Declined Consent Alert
```
┌──────────────────────────────────────────────────────────────┐
│ ❌ Consent Declined                                          │
│ The parent/guardian (parent@example.com) has declined       │
│ consent for John Smith to participate in athletic           │
│ assessments.                                                 │
│                                                              │
│ Contact the parent directly if you believe this was done    │
│ in error. Assessments cannot be conducted for this athlete. │
└──────────────────────────────────────────────────────────────┘
```

### Disabled Assessment Button (Pending)
```
┌──────────────────────────────────────┐
│ [New Assessment] (grayed out)        │
│        ↓                             │
│ ┌──────────────────────────────────┐ │
│ │ Consent required before          │ │
│ │ assessment                       │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

### Disabled Assessment Button (Declined)
```
┌──────────────────────────────────────┐
│ [New Assessment] (grayed out)        │
│        ↓                             │
│ ┌──────────────────────────────────┐ │
│ │ Parent declined consent -        │ │
│ │ assessment not allowed           │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

## Notes
- Resend should be rate-limited on backend (prevent spam)
- Consider showing when last email was sent
- Declined athletes cannot be assessed - coach must contact parent directly to discuss
