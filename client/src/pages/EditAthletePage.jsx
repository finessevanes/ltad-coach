import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Alert,
  CircularProgress,
  Button,
  Divider,
} from '@mui/material';
import { Send } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { generateRoute } from '../utils/routes';
import AthleteForm from '../components/Athletes/AthleteForm';

const EditAthletePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [athlete, setAthlete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchAthlete();
  }, [id]);

  const fetchAthlete = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/api/athletes/${id}`);
      setAthlete(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load athlete');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setUpdating(true);
      setError(null);
      setSuccess(null);

      const response = await api.put(`/api/athletes/${id}`, formData);
      setAthlete(response.data);
      setSuccess('Athlete updated successfully!');

      // Navigate back to profile after a short delay
      setTimeout(() => {
        navigate(generateRoute.athleteProfile(id));
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to update athlete');
    } finally {
      setUpdating(false);
    }
  };

  const handleResendConsent = async () => {
    try {
      setResending(true);
      setError(null);
      setSuccess(null);

      await api.post(`/api/athletes/${id}/resend-consent`);
      setSuccess('Consent form resent successfully!');
    } catch (err) {
      setError(err.message || 'Failed to resend consent form');
    } finally {
      setResending(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error && !athlete) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Edit Athlete
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3, mt: 3 }}>
        {updating ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <AthleteForm
            initialData={athlete}
            onSubmit={handleSubmit}
            submitLabel="Update Athlete"
          />
        )}

        <Divider sx={{ my: 3 }} />

        <Box>
          <Typography variant="h6" gutterBottom>
            Consent Management
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Current consent status: <strong>{athlete?.consent_status || 'pending'}</strong>
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Send />}
            onClick={handleResendConsent}
            disabled={resending}
            fullWidth
          >
            {resending ? 'Sending...' : 'Resend Consent Form'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default EditAthletePage;
