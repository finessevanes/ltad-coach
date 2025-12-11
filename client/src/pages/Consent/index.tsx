import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import { consentService } from '../../services/consent';
import { ConsentFormData } from '../../types/consent';

type Status = 'loading' | 'form' | 'success' | 'declined' | 'error';

export default function ConsentForm() {
  const { token } = useParams<{ token: string }>();
  const [formData, setFormData] = useState<ConsentFormData | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchFormData = async () => {
      if (!token) {
        setError('Invalid consent link.');
        setStatus('error');
        return;
      }

      try {
        setStatus('loading');
        const data = await consentService.getForm(token);
        setFormData(data);
        setStatus('form');
      } catch (err: any) {
        let errorMessage = 'Failed to load consent form. Please try again.';

        if (err.response) {
          const statusCode = err.response.status;

          switch (statusCode) {
            case 404:
              errorMessage = 'This consent link is invalid.';
              break;
            case 410:
              errorMessage =
                'This consent link has expired (30 days). Please contact the coach to request a new consent link.';
              break;
            case 400:
              const message = err.response.data?.detail || '';
              if (message.toLowerCase().includes('already consented')) {
                errorMessage = 'Consent has already been provided for this athlete.';
              } else if (message.toLowerCase().includes('already declined')) {
                errorMessage = 'Consent has already been declined for this athlete.';
              } else {
                errorMessage = message || errorMessage;
              }
              break;
          }
        }

        setError(errorMessage);
        setStatus('error');
      }
    };

    fetchFormData();
  }, [token]);

  const handleProvideConsent = async () => {
    if (!token || !acknowledged) return;

    try {
      setSubmitting(true);
      await consentService.sign(token);
      setStatus('success');
    } catch (err: any) {
      let errorMessage = 'Failed to provide consent. Please try again.';

      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      }

      setError(errorMessage);
      setStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!token) return;

    if (!window.confirm('Are you sure you want to decline consent?')) {
      return;
    }

    try {
      setSubmitting(true);
      await consentService.decline(token);
      setStatus('declined');
    } catch (err: any) {
      let errorMessage = 'Failed to decline consent. Please try again.';

      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      }

      setError(errorMessage);
      setStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        );

      case 'form':
        return (
          <>
            <Typography variant="h4" component="h1" gutterBottom>
              Athletic Assessment Consent Form
            </Typography>

            <Box sx={{ my: 3 }}>
              <Typography variant="body1" gutterBottom>
                <strong>Athlete Name:</strong> {formData?.athleteName}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Coach Name:</strong> {formData?.coachName}
              </Typography>
            </Box>

            <Box
              sx={{
                my: 3,
                p: 2,
                maxHeight: '300px',
                overflow: 'auto',
                backgroundColor: 'grey.50',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'grey.300',
              }}
            >
              <Typography
                variant="body2"
                component="div"
                sx={{ whiteSpace: 'pre-line' }}
              >
                {formData?.legalText}
              </Typography>
            </Box>

            <FormControlLabel
              control={
                <Checkbox
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  disabled={submitting}
                />
              }
              label="I acknowledge and agree to the terms above"
            />

            <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleProvideConsent}
                disabled={!acknowledged || submitting}
                sx={{ flex: { xs: '1 1 100%', sm: '1 1 auto' } }}
              >
                {submitting ? 'Processing...' : 'Provide Consent'}
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleDecline}
                disabled={submitting}
                sx={{ flex: { xs: '1 1 100%', sm: '1 1 auto' } }}
              >
                Decline Consent
              </Button>
            </Box>
          </>
        );

      case 'success':
        return (
          <Box textAlign="center" py={4}>
            <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="success.main">
              Consent Provided Successfully
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Thank you for providing consent. The coach has been notified and will proceed
              with athletic assessments. You will receive progress reports via email.
            </Typography>
          </Box>
        );

      case 'declined':
        return (
          <Box textAlign="center" py={4}>
            <Cancel sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="error.main">
              Consent Declined
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your decision has been recorded. The coach has been notified. If you wish to
              change your decision, please contact the coach directly.
            </Typography>
          </Box>
        );

      case 'error':
        return (
          <Box py={4}>
            <Alert severity="error">{error}</Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: 'grey.100',
        display: 'flex',
        alignItems: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Paper sx={{ p: { xs: 2, sm: 4 } }}>{renderContent()}</Paper>
      </Container>
    </Box>
  );
}
