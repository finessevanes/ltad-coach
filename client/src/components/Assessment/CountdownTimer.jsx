import { Box, Typography } from '@mui/material';

const CountdownTimer = ({ seconds, variant = 'countdown' }) => {
  const isCountdown = variant === 'countdown';
  const displayValue = Math.max(0, Math.ceil(seconds));

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: isCountdown ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        px: 3,
        py: 2,
        borderRadius: 2,
        zIndex: 10,
      }}
    >
      <Typography variant="h3" component="div" fontWeight="bold">
        {displayValue}
      </Typography>
      {!isCountdown && (
        <Typography variant="caption" component="div" textAlign="center">
          seconds
        </Typography>
      )}
    </Box>
  );
};

export default CountdownTimer;
