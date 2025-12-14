---
id: FE-013
depends_on: [FE-004, FE-011, FE-012]
blocks: []
---

# FE-013: Report Preview and Send UI

## Title
Implement parent report preview and send functionality for coaches

## Scope

### In Scope
- Report preview page at `/athletes/:id/report`
- Preview AI-generated report content
- Confirm parent email before sending
- Send report button with loading state
- Success state showing PIN
- Copy PIN functionality

### Out of Scope
- Public report view (FE-014)
- Report history list

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Preview | Read-only card | Coach shouldn't edit AI content |
| PIN Display | Large, copyable | Easy for coach to share manually if needed |
| Email Confirm | Modal | Prevent accidental sends |

## Acceptance Criteria

- [x] Preview page shows AI-generated report content
- [x] Report metadata shown (assessment count, latest score, team rank)
- [x] "Send to Parent" button triggers confirmation modal
- [x] Modal shows parent email for confirmation
- [x] Sending shows loading state
- [x] Success state displays PIN prominently
- [x] "Copy PIN" button copies to clipboard
- [x] "Done" returns to athlete profile
- [x] Error state if send fails

## Files to Create/Modify

```
client/src/
├── pages/
│   └── Reports/
│       ├── ReportPreview.tsx        # Preview page
│       ├── SendConfirmModal.tsx     # Confirmation modal
│       └── SendSuccess.tsx          # Success with PIN
├── services/
│   └── reports.ts                   # Report API calls
└── routes/
    └── index.tsx                    # Add report route (modify)
```

## Implementation Details

### services/reports.ts
```typescript
import { api } from './api';

export interface ReportPreview {
  athleteId: string;
  athleteName: string;
  content: string;
  assessmentCount: number;
  latestScore?: number;
  teamRank?: number;
  teamTotal?: number;
}

export interface ReportSendResponse {
  id: string;
  pin: string;
  message: string;
}

export interface ReportResendResponse {
  pin: string;
  message: string;
}

// Note: The api client (defined in FE-001) uses camelcase-keys interceptor
// to automatically transform snake_case responses to camelCase.
// No manual mapping is needed - response.data is already in camelCase.

export const reportsApi = {
  generatePreview: async (athleteId: string): Promise<ReportPreview> => {
    const response = await api.post(`/reports/generate/${athleteId}`);
    return response.data;  // Already transformed by interceptor
  },

  send: async (athleteId: string): Promise<ReportSendResponse> => {
    const response = await api.post(`/reports/${athleteId}/send`);
    return response.data;  // Already transformed by interceptor
  },

  /**
   * Resend an existing report with a new PIN.
   * Use when parent lost the original PIN or link expired.
   */
  resend: async (reportId: string): Promise<ReportResendResponse> => {
    const response = await api.post(`/reports/${reportId}/resend`);
    return response.data;  // Already transformed by interceptor
  },
};
```

### pages/Reports/ReportPreview.tsx
```typescript
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Chip,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import { reportsApi, ReportPreview } from '../../services/reports';
import { athletesApi } from '../../services/athletes';
import { Athlete } from '../../types/athlete';
import { SendConfirmModal } from './SendConfirmModal';
import { SendSuccess } from './SendSuccess';

export default function ReportPreviewPage() {
  const { athleteId } = useParams();
  const navigate = useNavigate();

  const [preview, setPreview] = useState<ReportPreview | null>(null);
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentPin, setSentPin] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);

  useEffect(() => {
    loadPreview();
  }, [athleteId]);

  const loadPreview = async () => {
    if (!athleteId) return;
    try {
      setLoading(true);
      const [previewData, athleteData] = await Promise.all([
        reportsApi.generatePreview(athleteId),
        athletesApi.getById(athleteId),
      ]);
      setPreview(previewData);
      setAthlete(athleteData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!athleteId) return;
    setSending(true);
    setConfirmModalOpen(false);

    try {
      const result = await reportsApi.send(athleteId);
      setSentPin(result.pin);
      setReportId(result.id);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send report');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (sentPin) {
    return (
      <SendSuccess
        pin={sentPin}
        reportId={reportId!}
        athleteName={preview?.athleteName || ''}
        parentEmail={athlete?.parentEmail || ''}
        onDone={() => navigate(`/athletes/${athleteId}`)}
      />
    );
  }

  if (error || !preview) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Failed to load report'}</Alert>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate(`/athletes/${athleteId}`)}
          sx={{ mt: 2 }}
        >
          Back to Athlete
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate(`/athletes/${athleteId}`)}
          >
            Back
          </Button>
          <Typography variant="h5">Parent Report Preview</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<SendIcon />}
          onClick={() => setConfirmModalOpen(true)}
          disabled={sending}
        >
          {sending ? 'Sending...' : 'Send to Parent'}
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Report Metadata */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Report Summary
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Athlete
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {preview.athleteName}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Assessments Included
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {preview.assessmentCount}
              </Typography>
            </Box>

            {preview.latestScore && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Latest Score
                </Typography>
                <Chip
                  label={`${preview.latestScore}/5`}
                  color={preview.latestScore >= 4 ? 'success' : 'warning'}
                />
              </Box>
            )}

            {preview.teamRank && preview.teamTotal && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Team Ranking
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  #{preview.teamRank} of {preview.teamTotal}
                </Typography>
              </Box>
            )}

            <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary">
                Will be sent to
              </Typography>
              <Typography variant="body1">
                {athlete?.parentEmail}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Report Content */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Report Content
            </Typography>
            <Box
              sx={{
                '& p': { mb: 2 },
                '& h1, & h2, & h3': { mt: 3, mb: 1 },
                '& ul, & ol': { pl: 2, mb: 2 },
                '& li': { mb: 0.5 },
              }}
            >
              <ReactMarkdown>{preview.content}</ReactMarkdown>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Confirm Modal */}
      <SendConfirmModal
        open={confirmModalOpen}
        parentEmail={athlete?.parentEmail || ''}
        athleteName={preview.athleteName}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleSend}
      />
    </Container>
  );
}
```

### pages/Reports/SendConfirmModal.tsx
```typescript
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import { Email as EmailIcon } from '@mui/icons-material';

interface SendConfirmModalProps {
  open: boolean;
  parentEmail: string;
  athleteName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function SendConfirmModal({
  open,
  parentEmail,
  athleteName,
  onClose,
  onConfirm,
}: SendConfirmModalProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Send Report to Parent?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          This will send a progress report for <strong>{athleteName}</strong> to:
        </DialogContentText>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mt: 2,
            p: 2,
            bgcolor: 'grey.100',
            borderRadius: 1,
          }}
        >
          <EmailIcon color="action" />
          <Typography fontWeight="medium">{parentEmail}</Typography>
        </Box>

        <DialogContentText sx={{ mt: 2 }}>
          The parent will receive an email with a link and a unique PIN to view the report.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained">
          Send Report
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

### pages/Reports/SendSuccess.tsx
```typescript
import { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';

interface SendSuccessProps {
  pin: string;
  reportId: string;
  athleteName: string;
  parentEmail: string;
  onDone: () => void;
}

export function SendSuccess({
  pin,
  reportId,
  athleteName,
  parentEmail,
  onDone,
}: SendSuccessProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyPin = () => {
    navigator.clipboard.writeText(pin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <SuccessIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />

        <Typography variant="h5" gutterBottom>
          Report Sent!
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 3 }}>
          A progress report for <strong>{athleteName}</strong> has been sent to{' '}
          <strong>{parentEmail}</strong>.
        </Typography>

        <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
          The parent will need this PIN to view the report:
        </Alert>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            py: 3,
            px: 4,
            bgcolor: 'grey.100',
            borderRadius: 2,
            mb: 3,
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontFamily: 'monospace',
              letterSpacing: 8,
              fontWeight: 'bold',
            }}
          >
            {pin}
          </Typography>
          <Tooltip title={copied ? 'Copied!' : 'Copy PIN'}>
            <IconButton onClick={handleCopyPin} color={copied ? 'success' : 'default'}>
              <CopyIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Save this PIN in case the parent needs it. The email also contains the PIN.
        </Typography>

        <Button variant="contained" onClick={onDone} size="large">
          Done
        </Button>
      </Paper>
    </Container>
  );
}
```

## Estimated Complexity
**S** (Small) - 3 hours

## Testing Instructions

1. Navigate to `/athletes/:id/report`
2. Verify report preview generates and displays
3. Verify metadata (assessment count, score, rank) shows
4. Click "Send to Parent"
5. Verify confirmation modal shows correct email
6. Confirm and send
7. Verify success screen shows PIN
8. Click "Copy PIN" and verify clipboard
9. Click "Done" and verify navigation

## UI Reference

### Preview Screen
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back   Parent Report Preview              [Send to Parent]    │
├───────────────────┬─────────────────────────────────────────────┤
│ Report Summary    │  Report Content                             │
│                   │                                             │
│ Athlete           │  Dear Parent,                               │
│ John Smith        │                                             │
│                   │  We're excited to share how well John       │
│ Assessments       │  is progressing in athletic development!    │
│ 5                 │                                             │
│                   │  **What We Tested**                         │
│ Latest Score      │  John completed our balance assessment...   │
│ [4/5] (green)     │                                             │
│                   │  **How John Did**                           │
│ Team Ranking      │  John held his balance for 18.5 seconds...  │
│ #3 of 12          │                                             │
│ ─────────────     │  ...                                        │
│ Will be sent to   │                                             │
│ parent@email.com  │                                             │
└───────────────────┴─────────────────────────────────────────────┘
```

### Success Screen
```
┌──────────────────────────────────────┐
│              ✅                      │
│          Report Sent!                │
│                                      │
│ A progress report for John Smith     │
│ has been sent to parent@email.com.   │
│                                      │
│ ℹ️ The parent will need this PIN    │
│    to view the report:               │
│                                      │
│    ┌────────────────────────────┐    │
│    │   4 8 2 9 5 7        📋    │    │
│    └────────────────────────────┘    │
│                                      │
│ Save this PIN in case the parent     │
│ needs it.                            │
│                                      │
│           [Done]                     │
└──────────────────────────────────────┘
```
