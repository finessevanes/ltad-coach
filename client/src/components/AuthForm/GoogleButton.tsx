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
        py: 1.5,
        borderRadius: 1.5,
        borderColor: '#000000',
        color: '#000000',
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '1rem',
        '&:hover': {
          borderColor: '#000000',
          backgroundColor: '#F5F5F5',
        },
      }}
    >
      Continue with Google
    </Button>
  );
}
