import { Box, Typography } from '@mui/material';

interface RecordingTimerProps {
  timeRemaining: number;
}

export const RecordingTimer: React.FC<RecordingTimerProps> = ({ timeRemaining }) => {
  const isLow = timeRemaining <= 5;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 5,
      }}
    >
      <Typography
        sx={{
          fontSize: '120px',
          fontWeight: 'bold',
          color: isLow ? '#ff4444' : 'white',
          textShadow: '0 4px 20px rgba(0,0,0,0.5)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {timeRemaining}
      </Typography>
    </Box>
  );
};
