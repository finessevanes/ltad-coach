import { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { generateRoute, ROUTES } from '../utils/routes';
import AthleteForm from '../components/Athletes/AthleteForm';

const AddAthletePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const response = await api.post('/api/athletes', formData);
      const athlete = response.data;

      setSuccess(true);

      // Navigate to athlete profile after a short delay
      setTimeout(() => {
        navigate(generateRoute.athleteProfile(athlete.id));
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to create athlete');
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Add New Athlete
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Athlete created successfully! A consent form has been sent to the parent's email.
          Redirecting to athlete profile...
        </Alert>
      )}

      <Paper sx={{ p: 3, mt: 3 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <AthleteForm onSubmit={handleSubmit} submitLabel="Create Athlete" />
        )}
      </Paper>

      <Alert severity="info" sx={{ mt: 2 }}>
        A consent form will be automatically sent to the parent's email address.
      </Alert>
    </Container>
  );
};

export default AddAthletePage;
