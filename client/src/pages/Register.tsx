import { useNavigate, Link as RouterLink, Navigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  Box,
  Alert,
  Link,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  if (!authLoading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Sign-ups are currently disabled
  const SIGNUPS_DISABLED = true;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#F5F5F5',
        py: 4,
        px: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 5,
          maxWidth: 480,
          width: '100%',
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'grey.200',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          position: 'relative',
        }}
      >
        {/* Back to Home Button */}
        <IconButton
          onClick={() => navigate('/')}
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            color: '#6B6B6B',
            '&:hover': {
              bgcolor: '#F5F5F5',
              color: '#2D2D2D',
            },
          }}
          aria-label="Back to home"
        >
          <ArrowBackIcon />
        </IconButton>

        <Typography
          variant="h3"
          align="center"
          gutterBottom
          sx={{
            fontWeight: 700,
            fontSize: '2rem',
            mb: 1,
          }}
        >
          Create Account
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Join Coach Lens to track athlete progress
        </Typography>

        {SIGNUPS_DISABLED ? (
          <Alert
            severity="info"
            sx={{
              mb: 3,
              borderRadius: 1.5,
              borderLeft: '4px solid',
              borderLeftColor: '#3B82F6',
            }}
          >
            New sign-ups are temporarily disabled. We're preparing to launch our paid plans. Please check back soon or{' '}
            <Link
              component={RouterLink}
              to="/login"
              sx={{
                fontWeight: 600,
                color: '#3B82F6',
                textDecoration: 'underline',
              }}
            >
              sign in
            </Link>{' '}
            if you already have an account.
          </Alert>
        ) : null}

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Already have an account?{' '}
            <Link
              component={RouterLink}
              to="/login"
              sx={{
                fontWeight: 600,
                color: '#000000',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              Sign in
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
