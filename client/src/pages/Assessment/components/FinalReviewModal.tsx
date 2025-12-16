import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Stack,
  Divider,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';

interface LegResult {
  success: boolean;
  holdTime: number;
  failureReason?: string;
}

interface FinalReviewModalProps {
  open: boolean;
  leftLegResult: LegResult | null;
  rightLegResult: LegResult | null;
  onContinueToUpload: () => void;
  onReshootLeft: () => void;
  onReshootRight: () => void;
}

export const FinalReviewModal: React.FC<FinalReviewModalProps> = ({
  open,
  leftLegResult,
  rightLegResult,
  onContinueToUpload,
  onReshootLeft,
  onReshootRight,
}) => {
  if (!leftLegResult || !rightLegResult) {
    return null;
  }

  const bothComplete = leftLegResult.success && rightLegResult.success;

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
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" fontWeight={600}>
          Review Your Tests
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={3}>
          {/* Test results - simple text lines */}
          <Box>
            <Typography variant="h6" sx={{ mb: 1.5 }}>
              <strong>Left Leg:</strong> {leftLegResult.holdTime.toFixed(1)}s
            </Typography>
            <Typography variant="h6" sx={{ mb: 1.5 }}>
              <strong>Right Leg:</strong> {rightLegResult.holdTime.toFixed(1)}s
            </Typography>
          </Box>

          <Divider />

          {/* Completion status */}
          <Box display="flex" alignItems="center" gap={1.5}>
            <CheckCircleIcon
              sx={{
                fontSize: 28,
                color: bothComplete ? 'success.main' : 'warning.main',
              }}
            />
            <Typography variant="body1" color="text.secondary">
              {bothComplete ? 'Both tests complete' : 'Tests recorded'}
            </Typography>
          </Box>

          <Divider />

          {/* Retake question */}
          <Box>
            <Typography variant="body1" fontWeight={500} sx={{ mb: 1.5 }}>
              Need to retake?
            </Typography>
            <Box display="flex" gap={1.5}>
              <Button
                onClick={onReshootLeft}
                variant="outlined"
                size="medium"
                sx={{ flex: 1 }}
              >
                Redo Left
              </Button>
              <Button
                onClick={onReshootRight}
                variant="outlined"
                size="medium"
                sx={{ flex: 1 }}
              >
                Redo Right
              </Button>
            </Box>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
        <Button
          onClick={onContinueToUpload}
          variant="contained"
          size="large"
          fullWidth
          endIcon={<ArrowForwardIcon />}
          autoFocus
        >
          View Full Report
        </Button>
      </DialogActions>
    </Dialog>
  );
};
