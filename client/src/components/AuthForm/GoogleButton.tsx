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
