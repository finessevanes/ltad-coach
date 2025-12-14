---
id: FE-003
depends_on: [FE-001, FE-002]
blocks: [FE-004, FE-015]
---

# FE-003: Login and Register Pages

## Title
Implement login and registration pages with Google OAuth and email/password

## Scope

### In Scope
- Login page with email/password form and Google OAuth button
- Registration page with name, email, password form and Google OAuth
- Form validation with error messages
- Loading states during authentication
- Redirect to dashboard after successful auth
- "Remember me" functionality (Firebase default)
- Link between login and register pages

### Out of Scope
- Password reset flow (post-MVP)
- Email verification (post-MVP)
- Other OAuth providers

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Form Library | React Hook Form | Lightweight, good validation, MUI compatible |
| Validation | Yup | Schema-based, integrates with React Hook Form |
| OAuth Flow | Popup | Better UX than redirect on desktop |

## Acceptance Criteria

- [x] Login page accessible at `/login`
- [x] Register page accessible at `/register`
- [x] Email/password login works with valid credentials
- [x] Google OAuth sign-in works via popup
- [x] Form validates email format, password min length (6 chars)
- [x] Registration validates name is not empty
- [x] Error messages display for invalid credentials
- [x] Loading spinner shows during authentication
- [x] Successful auth redirects to `/dashboard`
- [x] Already authenticated users redirected away from auth pages
- [x] Links between login/register pages work
- [x] Forms are responsive (work on tablet)

## Files to Create/Modify

```
client/src/
├── pages/
│   ├── Login.tsx              # Login page
│   └── Register.tsx           # Registration page
├── components/
│   ├── AuthForm/
│   │   ├── index.tsx          # Shared form container
│   │   ├── GoogleButton.tsx   # Google sign-in button
│   │   └── EmailForm.tsx      # Email/password fields
│   └── Layout/
│       └── AuthLayout.tsx     # Centered card layout for auth pages
├── routes/
│   └── index.tsx              # Add login/register routes (modify)
└── utils/
    └── validation.ts          # Yup schemas
```

## Implementation Details

### pages/Login.tsx
```typescript
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
import * as yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import { GoogleButton } from '../components/AuthForm/GoogleButton';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

type FormData = yup.InferType<typeof schema>;

export default function Login() {
  const { user, signInWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data: FormData) => {
    setError('');
    setLoading(true);
    try {
      await signInWithEmail(data.email, data.password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
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
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
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
            Sign In
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Welcome back to AI Coach
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
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              sx={{ mt: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </form>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2">
              Don't have an account?{' '}
              <Link component={RouterLink} to="/register">
                Sign up
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
```

### pages/Register.tsx
```typescript
// Similar structure to Login, with additional 'name' field
// and uses signUpWithEmail instead of signInWithEmail

const schema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});
```

### components/AuthForm/GoogleButton.tsx
```typescript
import { Button } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';

interface GoogleButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function GoogleButton({ onClick, disabled }: GoogleButtonProps) {
  return (
    <Button
      variant="outlined"
      fullWidth
      size="large"
      startIcon={<GoogleIcon />}
      onClick={onClick}
      disabled={disabled}
      sx={{
        borderColor: '#4285f4',
        color: '#4285f4',
        '&:hover': {
          borderColor: '#357abd',
          backgroundColor: 'rgba(66, 133, 244, 0.04)',
        },
      }}
    >
      Continue with Google
    </Button>
  );
}
```

## Dependencies to Add

```json
{
  "dependencies": {
    "react-hook-form": "^7.49.0",
    "@hookform/resolvers": "^3.3.0",
    "yup": "^1.3.0"
  }
}
```

## Estimated Complexity
**S** (Small) - 3-4 hours

## Testing Instructions

1. Test email/password registration:
   - Go to /register
   - Fill form with valid data
   - Should create account and redirect to dashboard

2. Test email/password login:
   - Go to /login
   - Use registered credentials
   - Should redirect to dashboard

3. Test Google OAuth:
   - Click Google button
   - Complete OAuth popup
   - Should redirect to dashboard

4. Test validation:
   - Submit empty form - should show errors
   - Enter invalid email - should show error
   - Enter short password - should show error

5. Test redirects:
   - While logged in, navigate to /login
   - Should redirect to /dashboard

## UI Reference

```
┌──────────────────────────────────────┐
│            Sign In                   │
│   Welcome back to AI Coach           │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │  🔵  Continue with Google        │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ─────────── or ───────────          │
│                                      │
│ Email                                │
│ ┌──────────────────────────────────┐ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Password                             │
│ ┌──────────────────────────────────┐ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │          Sign In                 │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Don't have an account? Sign up       │
└──────────────────────────────────────┘
```

## Error Messages

| Scenario | Message |
|----------|---------|
| Invalid credentials | "Invalid email or password" |
| User not found | "No account found with this email" |
| Email already in use | "An account with this email already exists" |
| Weak password | "Password must be at least 6 characters" |
| Network error | "Network error. Please try again." |
| Google popup closed | "Sign in cancelled" |
