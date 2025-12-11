import { Box, CircularProgress, Typography } from '@mui/material';

export default function Loading({ message = 'Loading...', fullScreen = false }) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight={fullScreen ? '100vh' : '200px'}
      gap={2}
    >
      <CircularProgress size={fullScreen ? 60 : 40} />
      {message && (
        <Typography variant="body1" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );
}
