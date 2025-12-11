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
          color: 'warning' as const,
          icon: <HourglassEmpty />,
        };
      case 'active':
        return {
          label: 'Active',
          color: 'success' as const,
          icon: <CheckCircle />,
        };
      case 'declined':
        return {
          label: 'Declined',
          color: 'error' as const,
          icon: <Cancel />,
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Chip
      label={config.label}
      color={config.color}
      icon={config.icon}
      variant="outlined"
      size="small"
    />
  );
};
