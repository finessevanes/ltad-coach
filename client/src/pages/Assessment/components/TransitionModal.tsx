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
  Info as InfoIcon,
} from '@mui/icons-material';

interface TransitionModalProps {
  open: boolean;
  leftLegResult: {
    success: boolean;
    holdTime: number;
    failureReason?: string;
  } | null;
  completedLeg: 'left' | 'right';
  onContinue: () => void;
  onReshootLeft: () => void;
}

export const TransitionModal: React.FC<TransitionModalProps> = ({
  open,
  leftLegResult,
  completedLeg,
  onContinue,
  onReshootLeft,
}) => {
  if (!leftLegResult) {
    return null;
  }

  const { success, holdTime, failureReason } = leftLegResult;

  // Determine which leg comes next (opposite of completed leg)
  const nextLeg = completedLeg === 'left' ? 'right' : 'left';
  const completedLegName = completedLeg === 'left' ? 'Left' : 'Right';
  const nextLegName = nextLeg === 'left' ? 'Left' : 'Right';

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
        <Typography variant="h5" component="span">
          {completedLegName} Leg Test Complete
        </Typography>
        <Typography variant="body2" color="primary" sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <InfoIcon fontSize="small" />
          Let's review your attempt
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* Hold Time */}
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Hold Time
            </Typography>
            <Typography variant="h3" component="div" color="primary">
              {holdTime.toFixed(1)}s
            </Typography>
          </Box>

          {/* What happened note (if test ended early) */}
          {!success && failureReason && (
            <Box
              sx={{
                bgcolor: 'warning.50',
                p: 2,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'warning.200',
              }}
            >
              <Typography variant="body2" color="text.secondary" gutterBottom>
                What happened:
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
              Ready to test the {nextLegName.toLowerCase()} leg?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              You can try the {completedLegName.toLowerCase()} leg again to improve your time, or move on to test your {nextLegName.toLowerCase()} leg.
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
          Try {completedLegName} Leg Again
        </Button>
        <Button
          onClick={onContinue}
          variant="contained"
          color="primary"
          size="large"
          autoFocus
        >
          Continue to {nextLegName} Leg
        </Button>
      </DialogActions>
    </Dialog>
  );
};
