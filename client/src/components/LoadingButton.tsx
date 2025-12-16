import { Button, CircularProgress, Box, ButtonProps } from '@mui/material';

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  progress?: number; // 0-100, undefined for indeterminate spinner
  loadingLabel?: string; // Text to show while loading
}

/**
 * Button with integrated loading state and optional progress indicator.
 * Automatically disables the button while loading to prevent double-submission.
 *
 * **Features:**
 * - Shows spinner during loading
 * - Shows progress circle if progress value provided
 * - Automatically disables button when loading
 * - Optional loading label override
 *
 * @param loading - Whether the button is in loading state
 * @param progress - Optional progress percentage (0-100) for determinate spinner
 * @param loadingLabel - Optional text to show while loading (defaults to children)
 * @param {...ButtonProps} - All standard MUI Button props are supported
 *
 * @example
 * // Basic form submission
 * const { isLoading, withLoading } = useLoadingState();
 * const handleSubmit = () => withLoading(() => submitForm(data));
 *
 * return (
 *   <LoadingButton
 *     variant="contained"
 *     loading={isLoading}
 *     onClick={handleSubmit}
 *   >
 *     Submit
 *   </LoadingButton>
 * );
 *
 * @example
 * // File upload with progress
 * const { isLoading, progress } = useLoading('upload-file');
 *
 * return (
 *   <LoadingButton
 *     variant="contained"
 *     loading={isLoading}
 *     progress={progress}
 *     loadingLabel="Uploading..."
 *     onClick={handleUpload}
 *   >
 *     Upload Video
 *   </LoadingButton>
 * );
 */
export function LoadingButton({
  loading = false,
  progress,
  loadingLabel,
  disabled,
  children,
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={disabled || loading} {...props}>
      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {progress !== undefined ? (
            <Box position="relative" display="inline-flex">
              <CircularProgress
                size={20}
                variant="determinate"
                value={Math.min(100, Math.max(0, progress))}
              />
            </Box>
          ) : (
            <CircularProgress size={20} />
          )}
          {loadingLabel || children}
        </Box>
      ) : (
        children
      )}
    </Button>
  );
}
