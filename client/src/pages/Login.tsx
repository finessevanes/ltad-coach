import { useState } from 'react';
import { useNavigate, Link as RouterLink, Navigate, useLocation } from 'react-router-dom';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Divider,
  Alert,
  CircularProgress,
  Link,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '../contexts/AuthContext';
import { GoogleButton } from '../components/AuthForm/GoogleButton';
import { loginSchema, LoginFormData } from '../utils/validation';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors';

export default function Login() {
  const { user, signInWithEmail, signInWithGoogle, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
  });

  // Redirect if already logged in
  if (!authLoading && user) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (data: LoginFormData) => {
    setError('');
    setLoading(true);
    try {
      await signInWithEmail(data.email, data.password);
      navigate(from);
    } catch (err: unknown) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate(from);
    } catch (err: unknown) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

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
          Sign In
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Welcome back to Coach Lens
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: 1.5,
              borderLeft: '4px solid',
              borderLeftColor: '#EF4444',
            }}
          >
            {error}
          </Alert>
        )}

        <GoogleButton onClick={handleGoogleSignIn} disabled={loading} />

        <Divider sx={{ my: 3, color: 'text.secondary', fontSize: '0.875rem' }}>or</Divider>

        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            {...register('email')}
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            error={!!errors.email}
            helperText={errors.email?.message}
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
              },
            }}
          />
          <TextField
            {...register('password')}
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            error={!!errors.password}
            helperText={errors.password?.message}
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            sx={{
              mt: 3,
              py: 1.5,
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              bgcolor: '#000000',
              color: '#FFFFFF',
              '&:hover': {
                bgcolor: '#2D2D2D',
              },
            }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>
        </form>

        {/* Sign-up link temporarily hidden while registrations are disabled */}
        {false && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{' '}
              <Link
                component={RouterLink}
                to="/register"
                sx={{
                  fontWeight: 600,
                  color: '#000000',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Sign up
              </Link>
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
