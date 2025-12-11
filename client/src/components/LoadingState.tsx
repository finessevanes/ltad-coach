import { Box, CircularProgress } from '@mui/material';

interface LoadingStateProps {
  minHeight?: number | string;
}

export function LoadingState({ minHeight = 400 }: LoadingStateProps) {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight={minHeight}
    >
      <CircularProgress />
    </Box>
  );
}
