import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Lock, Visibility } from '@mui/icons-material';

const PinEntry = ({ onVerify, error: externalError }) => {
  const [pin, setPin] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (pin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }

    try {
      setVerifying(true);
      setError(null);
      await onVerify(pin);
    } catch (err) {
      setError(err.message || 'Invalid PIN. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(value);
    setError(null);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                display: 'inline-flex',
                p: 2,
                borderRadius: '50%',
                backgroundColor: 'primary.light',
                color: 'primary.contrastText',
                mb: 2,
              }}
            >
              <Lock sx={{ fontSize: 40 }} />
            </Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Secure Report Access
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter the 4-digit PIN from your email to view the report
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="4-Digit PIN"
              value={pin}
              onChange={handlePinChange}
              variant="outlined"
              type="text"
              inputMode="numeric"
              placeholder="0000"
              autoFocus
              required
              sx={{
                mb: 2,
                '& input': {
                  fontSize: '2rem',
                  textAlign: 'center',
                  letterSpacing: '0.5em',
                  fontWeight: 700,
                },
              }}
              error={!!error || !!externalError}
              helperText={error || externalError}
            />

            {(error || externalError) && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error || externalError}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={pin.length !== 4 || verifying}
              startIcon={verifying ? <CircularProgress size={20} /> : <Visibility />}
            >
              {verifying ? 'Verifying...' : 'View Report'}
            </Button>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
              If you did not receive an email with the PIN, please contact your coach.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PinEntry;
