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
          fontSize: 80,
          color: 'text.secondary',
          mb: 2,
          opacity: 0.5,
        }}
      />
      <Typography variant="h5" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 500 }}>
        {description}
      </Typography>
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction} startIcon={<PersonAdd />}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};
