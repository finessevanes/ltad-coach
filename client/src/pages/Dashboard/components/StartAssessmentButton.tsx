import { Button } from '@mui/material';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';

interface StartAssessmentButtonProps {
  onClick: () => void;
  loading?: boolean;
}

export const StartAssessmentButton: React.FC<StartAssessmentButtonProps> = ({
  onClick,
  loading,
}) => {
  return (
    <Button
      variant="contained"
      size="large"
      endIcon={<ArrowForwardIcon />}
      onClick={onClick}
      disabled={loading}
      sx={{
        backgroundColor: '#D4FF00',
        color: '#000',
        fontWeight: 700,
        textTransform: 'uppercase',
        fontSize: '0.875rem',
        px: 3,
        py: 1.5,
        borderRadius: 1,
        '&:hover': {
          backgroundColor: '#C0E600',
        },
        '&:disabled': {
          backgroundColor: 'grey.300',
          color: 'grey.600',
        },
      }}
    >
      Start Assessment
    </Button>
  );
};
