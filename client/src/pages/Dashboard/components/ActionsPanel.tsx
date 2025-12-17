import {
  Box,
  Typography,
  Button,
  Skeleton,
} from '@mui/material';
import { ActionItem, ActionPriority } from '../../../types/actions';

interface ActionsPanelProps {
  actions?: ActionItem[];
  loading?: boolean;
}

const getPriorityConfig = (priority: ActionPriority) => {
  switch (priority) {
    case 'high':
      return {
        label: 'HIGH PRIORITY',
        borderColor: '#EF4444',
        bgColor: 'transparent',
        labelColor: '#EF4444',
        labelBgColor: '#FFFFFF',
      };
    case 'approval':
      return {
        label: 'APPROVAL',
        borderColor: '#D4FF00',
        bgColor: 'transparent',
        labelColor: '#84CC16',
        labelBgColor: '#F7FEE7',
      };
    case 'medium':
    default:
      return {
        label: 'MEDIUM',
        borderColor: '#F59E0B',
        bgColor: 'transparent',
        labelColor: '#F59E0B',
        labelBgColor: '#FEF3C7',
      };
  }
};

// Mock actions for now - in real app, this would come from API/props
const getMockActions = (): ActionItem[] => {
  return [
    {
      id: '1',
      priority: 'high',
      title: 'Pending Consent Form',
      description: '1 pending action - consent form not signed',
      actionLabel: 'REVIEW',
    },
  ];
};

export function ActionsPanel({ actions = getMockActions(), loading = false }: ActionsPanelProps) {
  if (loading) {
    return (
      <Box sx={{ height: '100%' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
            pb: 1.5,
            borderBottom: '1px solid',
            borderColor: 'grey.200',
          }}
        >
          <Skeleton variant="text" width={100} height={24} />
          <Skeleton variant="circular" width={8} height={8} />
        </Box>
        {[1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              mb: 2,
              p: 2,
              bgcolor: 'white',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'grey.200',
              borderLeft: '4px solid',
              borderLeftColor: 'grey.300',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
            }}
          >
            <Skeleton variant="text" width={100} height={20} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="80%" height={24} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="60%" height={20} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1.5 }} />
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%' }}>
      {/* Header with Pending Count and Divider */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          pb: 1.5,
          borderBottom: '1px solid',
          borderColor: 'grey.200',
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            fontSize: '1.125rem',
            color: '#2D2D2D',
          }}
        >
          Actions
        </Typography>
        {actions.length > 0 && (
          <Box
            sx={{
              backgroundColor: '#EF4444',
              borderRadius: '50%',
              width: 8,
              height: 8,
            }}
          />
        )}
      </Box>

      {/* Action Items */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {actions.map((action) => {
          const config = getPriorityConfig(action.priority);

          return (
            <Box
              key={action.id}
              sx={{
                borderRadius: 1,
                backgroundColor: 'white',
                border: '1px solid',
                borderColor: 'grey.200',
                borderLeft: '4px solid',
                borderLeftColor: config.borderColor,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                p: 2,
              }}
            >
              {/* Priority Label */}
              <Box
                sx={{
                  display: 'inline-block',
                  backgroundColor: config.labelBgColor,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    color: config.labelColor,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {config.label}
                </Typography>
              </Box>

              {/* Action Title */}
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  mb: 0.5,
                  color: 'text.primary',
                }}
              >
                {action.title}
              </Typography>

              {/* Action Description */}
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.8rem',
                  color: 'text.secondary',
                  mb: 1.5,
                }}
              >
                {action.description}
              </Typography>

              {/* Action Button */}
              <Button
                variant="contained"
                fullWidth
                onClick={action.onAction}
                sx={{
                  backgroundColor: '#000',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  py: 1,
                  borderRadius: 1.5,
                  '&:hover': {
                    backgroundColor: '#2D2D2D',
                  },
                }}
              >
                {action.actionLabel}
              </Button>
            </Box>
          );
        })}
      </Box>

      {/* Empty State */}
      {actions.length === 0 && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: 'center', py: 4 }}
        >
          No pending actions
        </Typography>
      )}
    </Box>
  );
}
