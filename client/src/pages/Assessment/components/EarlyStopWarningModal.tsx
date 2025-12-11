import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

interface EarlyStopWarningModalProps {
  open: boolean;
  elapsedTime: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const EarlyStopWarningModal: React.FC<EarlyStopWarningModalProps> = ({
  open,
  elapsedTime,
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="warning" />
        Recording Too Short
      </DialogTitle>

      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          This recording is only{' '}
          <strong>
            {elapsedTime} second{elapsedTime !== 1 ? 's' : ''}
          </strong>{' '}
          long.
        </Alert>

        <Typography variant="body2" color="text.secondary" paragraph>
          For accurate assessment, we recommend recording for at least 5 seconds.
          Short recordings may not provide enough data for meaningful analysis.
        </Typography>

        <Typography variant="body2" fontWeight="medium">
          Are you sure you want to stop the recording now?
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel} variant="outlined">
          Continue Recording
        </Button>
        <Button onClick={onConfirm} variant="contained" color="error">
          Stop Anyway
        </Button>
      </DialogActions>
    </Dialog>
  );
};
