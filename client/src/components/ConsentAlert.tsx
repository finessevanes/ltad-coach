import { useState } from 'react';
import { Alert, Button, CircularProgress, Box } from '@mui/material';
import { Athlete } from '../types/athlete';

interface ConsentAlertProps {
  athlete: Athlete;
  onResend?: () => Promise<void>;
  onDismiss?: () => void;
}

export function ConsentAlert({ athlete, onResend, onDismiss }: ConsentAlertProps) {
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
        onClose={onDismiss}
        sx={{
          alignItems: 'flex-start',
          borderRadius: 1,
          borderLeft: '4px solid',
          borderLeftColor: '#F59E0B',
          '& .MuiAlert-message': {
            width: '100%',
            py: 0.5,
          },
          '& .MuiAlert-icon': {
            mr: 1.5,
            mt: 0.25,
          },
          '& .MuiIconButton-root': {
            ml: 1,
            mt: -0.5,
          },
        }}
      >
        <Box sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: { xs: 1, sm: 1.5 },
          width: '100%'
        }}>
          <Box sx={{ flex: 1, minWidth: 0, pt: 0.25, pr: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Pending Consent
            </Typography>
            <Typography variant="body2">
              Parental consent has not been received. Email was sent to <strong>{athlete.parentEmail}</strong>.
            </Typography>
          </Box>
          {onResend && (
            <Button
              color="warning"
              variant="contained"
              onClick={handleResend}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={14} color="inherit" /> : null}
              sx={{
                flexShrink: 0,
                whiteSpace: 'nowrap',
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                py: 0.75,
                px: 2,
                minHeight: 'auto',
                height: { xs: '32px', sm: '36px' },
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                lineHeight: 1.4,
              }}
            >
              {loading ? 'Sending...' : 'Resend Email'}
            </Button>
          )}
        </Box>
      </Alert>
    );
  }

  // Declined consent variant
  if (athlete.consentStatus === 'declined') {
    return (
      <Alert
        severity="error"
        onClose={onDismiss}
        sx={{
          alignItems: 'flex-start',
          borderRadius: 1,
          borderLeft: '4px solid',
          borderLeftColor: '#EF4444',
          '& .MuiAlert-message': {
            py: 0.5,
          },
          '& .MuiAlert-icon': {
            mr: 1.5,
            mt: 0.25,
          },
          '& .MuiIconButton-root': {
            ml: 1,
            mt: -0.5,
          },
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
          Consent Declined
        </Typography>
        <Typography variant="body2">
          Parent/guardian has declined consent. Contact <strong>{athlete.parentEmail}</strong> directly to
          discuss. Assessments cannot be conducted for this athlete.
        </Typography>
      </Alert>
    );
  }

  return null;
}
