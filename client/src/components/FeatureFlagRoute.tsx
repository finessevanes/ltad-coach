import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useFeatureFlags } from '../contexts/FeatureFlagContext';
import { FeatureFlagKey } from '../types/featureFlags';
import { Box, Typography, Container, Paper } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';

interface FeatureFlagRouteProps {
  children: ReactNode;
  flag: FeatureFlagKey;
  fallback?: 'redirect' | 'message';
  redirectTo?: string;
}

/**
 * Conditionally render a route based on a feature flag.
 *
 * @example
 * <FeatureFlagRoute flag="assessmentsEnabled">
 *   <AssessmentsList />
 * </FeatureFlagRoute>
 */
export function FeatureFlagRoute({
  children,
  flag,
  fallback = 'message',
  redirectTo = '/dashboard',
}: FeatureFlagRouteProps) {
  const { isEnabled, loading } = useFeatureFlags();

  // Show nothing while loading flags
  if (loading) {
    return null;
  }

  // If feature is enabled, render children
  if (isEnabled(flag)) {
    return <>{children}</>;
  }

  // Feature is disabled - show fallback
  if (fallback === 'redirect') {
    return <Navigate to={redirectTo} replace />;
  }

  // Show "feature disabled" message
  return (
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Paper
        elevation={0}
        sx={{
          p: 6,
          textAlign: 'center',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <BlockIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Feature Temporarily Unavailable
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This feature is currently disabled. Please check back later or contact support.
        </Typography>
      </Paper>
    </Container>
  );
}
