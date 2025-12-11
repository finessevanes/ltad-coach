import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Checkbox,
  FormControlLabel,
  Button,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import api from '../services/api';

const ConsentFormPage = () => {
  const { token } = useParams();
  const [consentData, setConsentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    fetchConsentData();
  }, [token]);

  const fetchConsentData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/api/consent/${token}`);
      setConsentData(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load consent form');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!agreed) {
      setError('Please check the consent box to continue');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await api.post(`/api/consent/${token}/sign`);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to submit consent form');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (success) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Consent Submitted Successfully
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Thank you for providing consent. The coach can now proceed with athletic
            assessments for {consentData?.athlete_name}.
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (error && !consentData) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Parent/Guardian Consent Form
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Athletic Assessment Authorization
        </Typography>

        <Divider sx={{ my: 3 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Athlete Information
          </Typography>
          <Typography variant="body1">
            <strong>Athlete Name:</strong> {consentData?.athlete_name}
          </Typography>
          <Typography variant="body1">
            <strong>Coach Name:</strong> {consentData?.coach_name}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Consent Agreement
          </Typography>
          <Typography variant="body1" paragraph>
            I, as the parent or legal guardian, hereby grant permission for the above-named
            athlete to participate in athletic assessments conducted by{' '}
            {consentData?.coach_name}.
          </Typography>
          <Typography variant="body1" paragraph>
            I understand that:
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Typography component="li" variant="body1" paragraph>
              Video recordings will be taken of the athlete performing various athletic
              movements for assessment purposes.
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              The video data will be analyzed using AI-powered motion analysis technology
              to evaluate athletic performance and development.
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              All video recordings and assessment data will be stored securely and used
              solely for the purpose of athletic development and coaching.
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              I will receive reports on my child's athletic development and progress based
              on these assessments.
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              I can withdraw this consent at any time by contacting the coach directly.
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Privacy & Data Protection
          </Typography>
          <Typography variant="body1" paragraph>
            Your child's privacy is important to us. All video recordings and personal data
            will be:
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Typography component="li" variant="body1">
              Stored securely with industry-standard encryption
            </Typography>
            <Typography component="li" variant="body1">
              Used only for athletic assessment and coaching purposes
            </Typography>
            <Typography component="li" variant="body1">
              Never shared with third parties without explicit consent
            </Typography>
            <Typography component="li" variant="body1">
              Retained only as long as necessary for athletic development tracking
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <FormControlLabel
          control={
            <Checkbox
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              color="primary"
            />
          }
          label={
            <Typography variant="body1">
              I have read and understood the above information and consent to my child's
              participation in athletic assessments.
            </Typography>
          }
        />

        <Button
          variant="contained"
          color="primary"
          size="large"
          fullWidth
          onClick={handleSubmit}
          disabled={!agreed || submitting}
          sx={{ mt: 3 }}
        >
          {submitting ? 'Submitting...' : 'Submit Consent'}
        </Button>
      </Paper>
    </Container>
  );
};

export default ConsentFormPage;
