import { useState } from 'react';
import { Alert, Button, CircularProgress } from '@mui/material';
import { Athlete } from '../types/athlete';

interface ConsentAlertProps {
  athlete: Athlete;
  onResend?: () => Promise<void>;
}

export function ConsentAlert({ athlete, onResend }: ConsentAlertProps) {
  const [loading, setLoading] = useState(false);

  // Don't show alert for active athletes
  if (athlete.consentStatus === 'active') {
    return null;
  }

  const handleResend = async () => {
    if (!onResend) return;

    setLoading(true);
    try {
      await onResend();
    } finally {
      setLoading(false);
    }
  };

  // Pending consent variant
  if (athlete.consentStatus === 'pending') {
    return (
      <Alert
        severity="warning"
        action={
          onResend && (
            <Button
              color="inherit"
              size="small"
              onClick={handleResend}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {loading ? 'Sending...' : 'Resend Email'}
            </Button>
          )
        }
        sx={{ mb: 2 }}
      >
        Parental consent has not been received. Email was sent to {athlete.parentEmail}.
      </Alert>
    );
  }

  // Declined consent variant
  if (athlete.consentStatus === 'declined') {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Parent/guardian has declined consent. Contact {athlete.parentEmail} directly to
        discuss. Assessments cannot be conducted for this athlete.
      </Alert>
    );
  }

  return null;
}
