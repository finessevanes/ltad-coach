import { Chip } from '@mui/material';
import { HourglassEmpty, CheckCircle, Cancel } from '@mui/icons-material';
import { ConsentStatus } from '../types/athlete';

interface StatusBadgeProps {
  status: ConsentStatus;
}

/**
 * StatusBadge component
 * Displays a colored chip with icon for athlete consent status
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusConfig = (status: ConsentStatus) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pending',
          icon: <HourglassEmpty />,
          borderColor: '#D97706', // Muted orange
          backgroundColor: '#FFFEF8', // Very light orange background
          textColor: '#D97706', // Text matches border
        };
      case 'active':
        return {
          label: 'Active',
          icon: <CheckCircle />,
          borderColor: '#65A30D', // Muted green
          backgroundColor: '#FCFEF9', // Very light green background
          textColor: '#65A30D', // Text matches border
        };
      case 'declined':
        return {
          label: 'Declined',
          icon: <Cancel />,
          borderColor: '#DC2626', // Muted red
          backgroundColor: '#FFFCFC', // Very light red background
          textColor: '#DC2626', // Text matches border
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Chip
      label={config.label}
      icon={config.icon}
      variant="outlined"
      size="small"
      sx={{
        fontWeight: 600,
        fontSize: '0.75rem',
        borderRadius: 1,
        minWidth: 100,
        borderColor: config.borderColor,
        backgroundColor: config.backgroundColor,
        color: config.textColor,
        '& .MuiChip-icon': {
          color: config.textColor,
        },
      }}
    />
  );
};
