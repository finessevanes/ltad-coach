import { useState } from 'react';
import { useNavigate, Link as RouterLink, Navigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Divider,
  Alert,
  CircularProgress,
  Link,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '../contexts/AuthContext';
import { GoogleButton } from '../components/AuthForm/GoogleButton';
import { registerSchema, RegisterFormData } from '../utils/validation';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors';

export default function Register() {
  const { user, signUpWithEmail, signInWithGoogle, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
  });

  if (!authLoading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data: RegisterFormData) => {
    setError('');
    setLoading(true);
    try {
      await signUpWithEmail(data.email, data.password, data.name);
      navigate('/dashboard');
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
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" align="center" gutterBottom>
            Create Account
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Join AI Coach to track athlete progress
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <GoogleButton onClick={handleGoogleSignIn} disabled={loading} />

          <Divider sx={{ my: 3 }}>or</Divider>

          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              {...register('name')}
              label="Full Name"
              fullWidth
              margin="normal"
              error={!!errors.name}
              helperText={errors.name?.message}
              disabled={loading}
            />
            <TextField
              {...register('email')}
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              error={!!errors.email}
              helperText={errors.email?.message}
              disabled={loading}
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
            />
            <TextField
              {...register('confirmPassword')}
              label="Confirm Password"
              type="password"
              fullWidth
              margin="normal"
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              disabled={loading}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              sx={{ mt: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Create Account'}
            </Button>
          </form>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2">
              Already have an account?{' '}
              <Link component={RouterLink} to="/login">
                Sign in
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
