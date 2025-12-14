import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Chip,
  Box,
  Stack,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

interface TransitionModalProps {
  open: boolean;
  leftLegResult: {
    success: boolean;
    holdTime: number;
    failureReason?: string;
  } | null;
  onContinue: () => void;
  onReshootLeft: () => void;
}

export const TransitionModal: React.FC<TransitionModalProps> = ({
  open,
  leftLegResult,
  onContinue,
  onReshootLeft,
}) => {
  if (!leftLegResult) {
    return null;
  }

  const { success, holdTime, failureReason } = leftLegResult;

  return (
    <Dialog
      open={open}
      disableEscapeKeyDown
      onClose={(_event, reason) => {
        // Prevent closing via backdrop click or ESC key
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
          return;
        }
      }}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h5" component="span">
            Left Leg Test Complete
          </Typography>
          {success ? (
            <CheckCircleIcon color="success" fontSize="large" />
          ) : (
            <CancelIcon color="warning" fontSize="large" />
          )}
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* Status Chip */}
          <Box>
            <Chip
              label={success ? 'Test Passed' : 'Test Failed'}
              color={success ? 'success' : 'warning'}
              icon={success ? <CheckCircleIcon /> : <CancelIcon />}
              sx={{ fontSize: '1rem', py: 2.5 }}
            />
          </Box>

          {/* Hold Time */}
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Hold Time
            </Typography>
            <Typography variant="h3" component="div" color="primary">
              {holdTime.toFixed(1)}s
            </Typography>
          </Box>

          {/* Failure Reason (if applicable) */}
          {!success && failureReason && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Reason
              </Typography>
              <Typography variant="body1">
                {failureReason}
              </Typography>
            </Box>
          )}

          {/* Next Step Prompt */}
          <Box
            sx={{
              bgcolor: 'primary.50',
              p: 2,
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'primary.200',
            }}
          >
            <Typography variant="body1" fontWeight="medium">
              Ready to test the right leg?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              You can reshoot the left leg if needed, or continue to the right leg test.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onReshootLeft}
          variant="outlined"
          color="secondary"
          size="large"
        >
          Reshoot Left Leg
        </Button>
        <Button
          onClick={onContinue}
          variant="contained"
          color="primary"
          size="large"
          autoFocus
        >
          Continue to Right Leg
        </Button>
      </DialogActions>
    </Dialog>
  );
};
