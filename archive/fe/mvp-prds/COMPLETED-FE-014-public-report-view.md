---
id: FE-014
depends_on: [FE-001]
blocks: []
---

# FE-014: Public Parent Report View

## Title
Implement public PIN-protected report viewing for parents

## Scope

### In Scope
- Public report page at `/report/:id`
- PIN entry form
- Report content display after verification
- Mobile-responsive layout
- No authentication required

### Out of Scope
- Report generation (FE-013)
- Multiple reports list for parents

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| PIN Input | 6 individual digit boxes | Better UX, prevents typos |
| Layout | Mobile-first | Parents likely view on phone |
| Verification | Client-side form, server validates | Simple, secure |

## Acceptance Criteria

- [x] Page accessible at `/report/:id` without login
- [x] Shows athlete name before PIN entry
- [x] PIN input accepts 6 digits
- [x] Auto-submit when all digits entered
- [x] Invalid PIN shows error message
- [x] Valid PIN reveals report content
- [x] Report renders with markdown formatting
- [x] Mobile-responsive design
- [x] No navigation to other parts of app

## Files to Create/Modify

```
client/src/
├── pages/
│   └── Reports/
│       ├── PublicReport.tsx         # Main public page
│       ├── PinEntry.tsx             # PIN input component
│       └── ReportContent.tsx        # Report display
├── services/
│   └── reports.ts                   # Add public endpoints (modify)
└── routes/
    └── index.tsx                    # Add public report route (modify)
```

## Implementation Details

### services/reports.ts (additions)
```typescript
export interface ReportInfo {
  reportId: string;
  athleteName: string;
  createdAt: string;
}

export interface ReportView {
  athleteName: string;
  reportContent: string;
  createdAt: string;
}

// Note: The api client (defined in FE-001) uses camelcase-keys interceptor
// to automatically transform snake_case responses to camelCase.
// No manual mapping is needed - response.data is already in camelCase.

// Add to reportsApi:
export const reportsApi = {
  // ... existing methods ...

  getInfo: async (reportId: string): Promise<ReportInfo> => {
    const response = await api.get(`/reports/view/${reportId}`);
    return response.data;  // Already transformed by interceptor
  },

  verifyPin: async (reportId: string, pin: string): Promise<ReportView> => {
    const response = await api.post(`/reports/view/${reportId}/verify`, { pin });
    return response.data;  // Already transformed by interceptor
  },
};
```

### pages/Reports/PublicReport.tsx
```typescript
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { reportsApi, ReportInfo, ReportView } from '../../services/reports';
import { PinEntry } from './PinEntry';
import { ReportContent } from './ReportContent';

export default function PublicReport() {
  const { reportId } = useParams();

  const [info, setInfo] = useState<ReportInfo | null>(null);
  const [report, setReport] = useState<ReportView | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReportInfo();
  }, [reportId]);

  const loadReportInfo = async () => {
    if (!reportId) return;
    try {
      const data = await reportsApi.getInfo(reportId);
      setInfo(data);
    } catch (err) {
      setError('Report not found or has expired.');
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async (pin: string) => {
    if (!reportId) return;
    setError('');
    setVerifying(true);

    try {
      const data = await reportsApi.verifyPin(reportId, pin);
      setReport(data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Incorrect PIN. Please try again.');
      } else {
        setError('Failed to verify PIN. Please try again.');
      }
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !info) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Report Not Found
          </Typography>
          <Typography color="text.secondary">
            This report link may be invalid or expired.
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (report) {
    return (
      <ReportContent
        athleteName={report.athleteName}
        content={report.reportContent}
        createdAt={report.createdAt}
      />
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{ color: 'primary.main', fontWeight: 'bold', mb: 1 }}
          >
            AI Coach
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Progress Report
          </Typography>
        </Box>

        {/* Athlete Info */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            {info?.athleteName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Report generated on{' '}
            {info?.createdAt
              ? new Date(info.createdAt).toLocaleDateString()
              : ''}
          </Typography>
        </Box>

        {/* PIN Entry */}
        <Typography variant="body1" sx={{ mb: 2 }}>
          Enter the 6-digit PIN from your email:
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <PinEntry onSubmit={handlePinSubmit} disabled={verifying} />

        {verifying && (
          <Box sx={{ mt: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </Paper>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', textAlign: 'center', mt: 2 }}
      >
        Questions about this report? Contact your child's coach.
      </Typography>
    </Container>
  );
}
```

### pages/Reports/PinEntry.tsx
```typescript
import { useState, useRef, KeyboardEvent, ClipboardEvent } from 'react';
import { Box, TextField } from '@mui/material';

interface PinEntryProps {
  onSubmit: (pin: string) => void;
  disabled?: boolean;
}

export function PinEntry({ onSubmit, disabled }: PinEntryProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    // Only accept digits
    if (value && !/^\d$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (newDigits.every((d) => d) && value) {
      onSubmit(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Move to previous on backspace
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');

    if (pastedData.length === 6) {
      const newDigits = pastedData.split('');
      setDigits(newDigits);
      onSubmit(pastedData);
    }
  };

  return (
    <Box display="flex" justifyContent="center" gap={1}>
      {digits.map((digit, index) => (
        <TextField
          key={index}
          inputRef={(el) => (inputRefs.current[index] = el)}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e as any)}
          onPaste={handlePaste}
          disabled={disabled}
          inputProps={{
            maxLength: 1,
            style: {
              textAlign: 'center',
              fontSize: '24px',
              fontWeight: 'bold',
              width: '40px',
              padding: '12px 0',
            },
            inputMode: 'numeric',
          }}
          variant="outlined"
        />
      ))}
    </Box>
  );
}
```

### pages/Reports/ReportContent.tsx
```typescript
import { Container, Paper, Typography, Box, Divider } from '@mui/material';
import ReactMarkdown from 'react-markdown';

interface ReportContentProps {
  athleteName: string;
  content: string;
  createdAt: string;
}

export function ReportContent({ athleteName, content, createdAt }: ReportContentProps) {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography
          variant="h4"
          sx={{ color: 'primary.main', fontWeight: 'bold', mb: 1 }}
        >
          AI Coach
        </Typography>
        <Typography variant="h5" gutterBottom>
          Progress Report
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {athleteName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {new Date(createdAt).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Typography>
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* Report Content */}
      <Paper sx={{ p: 4 }}>
        <Box
          sx={{
            '& p': { mb: 2, lineHeight: 1.7 },
            '& h1, & h2, & h3': { mt: 3, mb: 2 },
            '& ul, & ol': { pl: 3, mb: 2 },
            '& li': { mb: 1 },
            '& strong': { fontWeight: 600 },
            fontSize: '1.05rem',
          }}
        >
          <ReactMarkdown>{content}</ReactMarkdown>
        </Box>
      </Paper>

      {/* Footer */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          This report was generated by AI Coach.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          For questions, please contact your child's coach.
        </Typography>
      </Box>
    </Container>
  );
}
```

### routes/index.tsx (addition)
```typescript
// Add to routes array - no ProtectedRoute wrapper
{
  path: '/report/:reportId',
  element: <PublicReport />,
}
```

## Estimated Complexity
**S** (Small) - 3 hours

## Testing Instructions

1. Get a report link and PIN from FE-013
2. Open `/report/:id` in incognito (no auth)
3. Verify athlete name shows
4. Enter wrong PIN - should show error
5. Enter correct PIN - should show report
6. Test paste - paste full 6 digits
7. Test on mobile viewport
8. Test with expired/invalid report ID

## UI Reference

### PIN Entry Screen
```
┌──────────────────────────────────────┐
│                                      │
│           AI Coach                   │
│         Progress Report              │
│                                      │
│          John Smith                  │
│    Report generated on Jan 15, 2024  │
│                                      │
│  Enter the 6-digit PIN from your     │
│  email:                              │
│                                      │
│    ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐          │
│    │4│ │8│ │2│ │ │ │ │ │ │          │
│    └─┘ └─┘ └─┘ └─┘ └─┘ └─┘          │
│                                      │
│  Questions? Contact your child's     │
│  coach.                              │
│                                      │
└──────────────────────────────────────┘
```

### Report View
```
┌──────────────────────────────────────┐
│                                      │
│           AI Coach                   │
│         Progress Report              │
│                                      │
│          John Smith                  │
│    Monday, January 15, 2024          │
│                                      │
│  ────────────────────────────────    │
│                                      │
│  Dear Parent,                        │
│                                      │
│  We're excited to share how well     │
│  John is progressing...              │
│                                      │
│  **What We Tested**                  │
│  John completed our balance          │
│  assessment...                       │
│                                      │
│  **How John Did**                    │
│  John held his balance for           │
│  18.5 seconds...                     │
│                                      │
│  ...                                 │
│                                      │
│  ────────────────────────────────    │
│                                      │
│  This report was generated by        │
│  AI Coach.                           │
│                                      │
└──────────────────────────────────────┘
```

## Notes
- No app navigation shown - standalone page
- Mobile-first design since parents likely open on phone
- PIN can be pasted for convenience
- Auto-submit improves UX
