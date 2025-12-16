import { Backdrop, CircularProgress, Box, Typography } from '@mui/material';

interface LoadingOverlayProps {
  open: boolean;
  message?: string;
  progress?: number; // 0-100, undefined for indeterminate
}

/**
 * Modal loading overlay that blocks user interaction.
 * Use sparingly for critical operations that should not be interrupted.
 *
 * **When to use:**
 * - Critical operations that must complete (payment processing, data migration)
 * - Operations where user interaction would cause errors
 *
 * **When NOT to use:**
 * - Regular API calls (use GlobalLoadingBar instead)
 * - Non-blocking operations (use ProgressIndicator instead)
 *
 * @param open - Whether the overlay is visible
 * @param message - Optional message to display
 * @param progress - Optional progress percentage (0-100), undefined for indeterminate
 *
 * @example
 * // Basic usage
 * const { isLoading } = useLoading('process-data');
 * return <LoadingOverlay open={isLoading} message="Processing..." />;
 *
 * @example
 * // With progress
 * const { isLoading, progress } = useLoading('upload');
 * return <LoadingOverlay open={isLoading} message="Uploading..." progress={progress} />;
 */
export function LoadingOverlay({ open, message, progress }: LoadingOverlayProps) {
  return (
    <Backdrop
      open={open}
      sx={{
        zIndex: 1300,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <Box position="relative" display="inline-flex">
        <CircularProgress
          size={60}
          variant={progress !== undefined ? 'determinate' : 'indeterminate'}
          value={progress ?? 0}
        />
        {progress !== undefined && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
              {Math.round(progress)}%
            </Typography>
          </Box>
        )}
      </Box>
      {message && (
        <Typography variant="body2" color="textSecondary" align="center">
          {message}
        </Typography>
      )}
    </Backdrop>
  );
}
