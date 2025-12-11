---
id: FE-006
depends_on: [FE-001]
blocks: []
---

# FE-006: Public Consent Form Page

## Title
Implement public parental consent form page

## Scope

### In Scope
- Public consent page at `/consent/:token`
- Display athlete name, coach name
- Display legal consent text
- Checkbox to acknowledge terms
- Submit consent button
- Success state after consent provided
- Error handling for invalid/expired tokens

### Out of Scope
- Authentication (this is a public page)
- Consent status display in coach UI (FE-007)

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Layout | Standalone (no app chrome) | Public page, shouldn't show app navigation |
| Legal Text | Scrollable container | Ensure user can read full text |
| Success State | In-page confirmation | No redirect needed |

## Acceptance Criteria

- [ ] Page accessible at `/consent/:token` without login
- [ ] Displays athlete name from API response
- [ ] Displays coach name from API response
- [ ] Legal text displayed in scrollable container
- [ ] Checkbox must be checked to enable submit
- [ ] Submit button disabled until checkbox checked
- [ ] Decline button available (no checkbox required)
- [ ] Loading state while fetching/submitting
- [ ] Success state shows confirmation message for consent
- [ ] Decline state shows confirmation message for declined consent
- [ ] Error state for invalid tokens (404)
- [ ] Error state for expired tokens (410) - shows message to contact coach
- [ ] Error state for already-consented tokens (400)
- [ ] Error state for already-declined tokens (400)
- [ ] Mobile-responsive layout

## Files to Create/Modify

```
client/src/
├── pages/
│   └── Consent/
│       ├── index.tsx           # Consent form page
│       └── ConsentSuccess.tsx  # Success state component
├── services/
│   └── consent.ts              # Consent API calls
└── routes/
    └── index.tsx               # Add consent route (modify)
```

## Implementation Details

### services/consent.ts
```typescript
import { api } from './api';

export interface ConsentFormData {
  athleteName: string;
  coachName: string;
  legalText: string;
}

// Note: The api client (defined in FE-001) uses camelcase-keys interceptor
// to automatically transform snake_case responses to camelCase.
// No manual mapping is needed - response.data is already in camelCase.

export const consentApi = {
  getForm: async (token: string): Promise<ConsentFormData> => {
    const response = await api.get(`/consent/${token}`);
    return response.data;  // Already transformed by interceptor
  },

  submit: async (token: string): Promise<void> => {
    await api.post(`/consent/${token}/sign`, { acknowledged: true });
  },

  decline: async (token: string): Promise<void> => {
    await api.post(`/consent/${token}/decline`);
  },
};
```

### pages/Consent/index.tsx
```typescript
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Checkbox,
  FormControlLabel,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { consentApi, ConsentFormData } from '../../services/consent';
import { ConsentSuccess } from './ConsentSuccess';

export default function ConsentPage() {
  const { token } = useParams<{ token: string }>();
  const [formData, setFormData] = useState<ConsentFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    loadConsentForm();
  }, [token]);

  const loadConsentForm = async () => {
    if (!token) {
      setError('Invalid consent link');
      setLoading(false);
      return;
    }

    try {
      const data = await consentApi.getForm(token);
      setFormData(data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('This consent link is invalid.');
      } else if (err.response?.status === 410) {
        // Token expired (30-day limit per BE-004/BE-005)
        setError('This consent link has expired. Please contact the coach to request a new consent link.');
      } else if (err.response?.status === 400) {
        // Check for specific error messages from backend
        const detail = err.response?.data?.detail || '';
        if (detail.includes('already')) {
          setError('Consent has already been provided for this athlete.');
        } else if (detail.includes('declined')) {
          setError('Consent has already been declined for this athlete. Contact the coach if you wish to change your decision.');
        } else {
          setError(detail || 'This consent request is no longer valid.');
        }
      } else {
        setError('Failed to load consent form. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!token || !acknowledged) return;

    setSubmitting(true);
    setError('');

    try {
      await consentApi.submit(token);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit consent');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!token) return;

    setDeclining(true);
    setError('');

    try {
      await consentApi.decline(token);
      setDeclined(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to decline consent');
    } finally {
      setDeclining(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (success) {
    return <ConsentSuccess athleteName={formData?.athleteName || ''} />;
  }

  if (declined) {
    return <ConsentDeclined athleteName={formData?.athleteName || ''} />;
  }

  if (error && !formData) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Unable to Load Consent Form
          </Typography>
          <Typography color="text.secondary">
            {error}
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            If you believe this is an error, please contact the coach.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Parental Consent Form
          </Typography>
          <Typography variant="h6" color="primary">
            AI Coach Athletic Assessment
          </Typography>
        </Box>

        {/* Athlete/Coach Info */}
        <Box sx={{ mb: 4, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="body1">
            <strong>Athlete:</strong> {formData?.athleteName}
          </Typography>
          <Typography variant="body1">
            <strong>Coach:</strong> {formData?.coachName}
          </Typography>
        </Box>

        {/* Legal Text */}
        <Typography variant="h6" gutterBottom>
          Consent Terms
        </Typography>
        <Box
          sx={{
            maxHeight: 300,
            overflow: 'auto',
            border: '1px solid',
            borderColor: 'grey.300',
            borderRadius: 1,
            p: 2,
            mb: 3,
            bgcolor: 'grey.50',
            whiteSpace: 'pre-line',
          }}
        >
          <Typography variant="body2">
            {formData?.legalText}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Acknowledgment */}
        <FormControlLabel
          control={
            <Checkbox
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              disabled={submitting}
            />
          }
          label={
            <Typography variant="body2">
              I have read and understand the terms above, and I consent to athletic
              assessments for <strong>{formData?.athleteName}</strong>.
            </Typography>
          }
          sx={{ mb: 3 }}
        />

        {/* Submit Button */}
        <Button
          variant="contained"
          size="large"
          fullWidth
          disabled={!acknowledged || submitting || declining}
          onClick={handleSubmit}
        >
          {submitting ? <CircularProgress size={24} /> : 'Provide Consent'}
        </Button>

        {/* Decline Button */}
        <Button
          variant="outlined"
          color="error"
          size="large"
          fullWidth
          disabled={submitting || declining}
          onClick={handleDecline}
          sx={{ mt: 2 }}
        >
          {declining ? <CircularProgress size={24} /> : 'Decline Consent'}
        </Button>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
          Questions? Contact the coach directly.
        </Typography>
      </Paper>
    </Container>
  );
}
```

### pages/Consent/ConsentSuccess.tsx
```typescript
import { Container, Paper, Typography, Box } from '@mui/material';
import { CheckCircle as CheckIcon } from '@mui/icons-material';

interface ConsentSuccessProps {
  athleteName: string;
}

export function ConsentSuccess({ athleteName }: ConsentSuccessProps) {
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Consent Provided Successfully
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Thank you! You have provided consent for <strong>{athleteName}</strong> to
          participate in athletic assessments using AI Coach.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          The coach has been notified and can now conduct assessments.
          You will receive progress reports via email when available.
        </Typography>
        <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="body2">
            You may close this page.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
```

### pages/Consent/ConsentDeclined.tsx
```typescript
import { Container, Paper, Typography, Box } from '@mui/material';
import { Cancel as CancelIcon } from '@mui/icons-material';

interface ConsentDeclinedProps {
  athleteName: string;
}

export function ConsentDeclined({ athleteName }: ConsentDeclinedProps) {
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <CancelIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Consent Declined
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          You have declined consent for <strong>{athleteName}</strong> to
          participate in athletic assessments using AI Coach.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          The coach has been notified. <strong>{athleteName}</strong> will not be
          assessed unless you change your decision by contacting the coach.
        </Typography>
        <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="body2">
            You may close this page.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
```

### routes/index.tsx (addition)
```typescript
// Add to routes array:
{
  path: '/consent/:token',
  element: <ConsentPage />,  // No ProtectedRoute wrapper
}
```

## Estimated Complexity
**S** (Small) - 2-3 hours

## Testing Instructions

1. Create an athlete and extract consent token from database/email
2. Navigate to `/consent/<token>`
3. Verify athlete and coach names display correctly
4. Verify legal text is scrollable
5. Verify submit button is disabled until checkbox checked
6. Check the checkbox and submit
7. Verify success state displays
8. Test invalid token - should show error
9. Test already-consented token - should show error

## UI Reference

```
┌──────────────────────────────────────────────┐
│        Parental Consent Form                 │
│       AI Coach Athletic Assessment           │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ Athlete: John Smith                      │ │
│ │ Coach: Coach Davis                       │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ Consent Terms                                │
│ ┌──────────────────────────────────────────┐ │
│ │ By providing consent, you agree to the   │ │
│ │ following:                               │ │
│ │                                          │ │
│ │ 1. VIDEO RECORDING: Athletic assessment  │ │
│ │    sessions will be recorded...          │ │
│ │                                    [▼]   │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ ☐ I have read and understand the terms      │
│   above, and I consent to athletic          │
│   assessments for John Smith.               │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │         Provide Consent                  │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│      Questions? Contact the coach directly.  │
└──────────────────────────────────────────────┘
```

## Notes
- This is a public page, no authentication required
- Should work well on mobile (parents may open from phone email)
- Consider adding rate limiting on backend for abuse prevention
