import { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';

interface CountdownOverlayProps {
  onComplete: () => void;
  startFrom?: number;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({
  onComplete,
  startFrom = 3,
}) => {
  const [count, setCount] = useState(startFrom);

  useEffect(() => {
    if (count === 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setCount(count - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [count, onComplete]);

  if (count === 0) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 10,
      }}
    >
      <Typography
        variant="h1"
        sx={{
          color: 'white',
          fontSize: '200px',
          fontWeight: 'bold',
          textShadow: '0 4px 20px rgba(0,0,0,0.5)',
          animation: 'scaleIn 0.3s ease-out',
          '@keyframes scaleIn': {
            '0%': { transform: 'scale(1.5)', opacity: 0 },
            '100%': { transform: 'scale(1)', opacity: 1 },
          },
        }}
      >
        {count}
      </Typography>
    </Box>
  );
};
