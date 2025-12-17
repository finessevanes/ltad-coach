import { Box, Typography, Button } from '@mui/material';
import { PersonAdd } from '@mui/icons-material';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * EmptyState component
 * Generic component for displaying empty state with optional action
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 2,
        textAlign: 'center',
      }}
    >
      <PersonAdd
        sx={{
          fontSize: 64,
          color: '#BDBDBD',
          mb: 3,
        }}
      />
      <Typography
        variant="h5"
        gutterBottom
        sx={{
          fontWeight: 600,
          fontSize: '1.5rem',
          mb: 1,
        }}
      >
        {title}
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{
          mb: 4,
          maxWidth: 500,
          fontSize: '1rem',
        }}
      >
        {description}
      </Typography>
      {actionLabel && onAction && (
        <Button
          variant="contained"
          onClick={onAction}
          startIcon={<PersonAdd />}
          sx={{
            borderRadius: 1.5,
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            py: 1.5,
          }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};
