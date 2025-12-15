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
  Grid,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
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

/**
 * Calculate quick symmetry score from hold times
 */
const calculateQuickSymmetry = (
  leftResult: LegResult,
  rightResult: LegResult
) => {
  const timeDiff = Math.abs(leftResult.holdTime - rightResult.holdTime);
  const maxTime = Math.max(leftResult.holdTime, rightResult.holdTime);
  const timeDiffPct = maxTime > 0 ? (timeDiff / maxTime) * 100 : 0;
  const durationSymmetry = 1 - Math.min(timeDiffPct / 100, 1.0);
  const score = Math.round(durationSymmetry * 100);

  let assessment: string;
  if (score >= 85) assessment = 'Excellent';
  else if (score >= 70) assessment = 'Good';
  else if (score >= 50) assessment = 'Fair';
  else assessment = 'Needs Improvement';

  return { score, assessment, timeDiff, timeDiffPct };
};

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

  const symmetry = calculateQuickSymmetry(leftLegResult, rightLegResult);

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
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h5" component="span">
          Review Both Tests
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* Side-by-side test results */}
          <Grid container spacing={2}>
            {/* Left Leg Result */}
            <Grid item xs={12} sm={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Typography variant="h6">Left Leg</Typography>
                    {leftLegResult.success ? (
                      <CheckCircleIcon color="success" fontSize="small" />
                    ) : (
                      <CancelIcon color="warning" fontSize="small" />
                    )}
                  </Box>

                  <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                    (Right foot raised)
                  </Typography>

                  <Typography variant="h3" color="primary" sx={{ my: 1 }}>
                    {leftLegResult.holdTime.toFixed(1)}s
                  </Typography>

                  <Chip
                    label={leftLegResult.success ? 'Passed' : 'Failed'}
                    color={leftLegResult.success ? 'success' : 'warning'}
                    size="small"
                    sx={{ mt: 1 }}
                  />

                  {!leftLegResult.success && leftLegResult.failureReason && (
                    <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                      {leftLegResult.failureReason}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Right Leg Result */}
            <Grid item xs={12} sm={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Typography variant="h6">Right Leg</Typography>
                    {rightLegResult.success ? (
                      <CheckCircleIcon color="success" fontSize="small" />
                    ) : (
                      <CancelIcon color="warning" fontSize="small" />
                    )}
                  </Box>

                  <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                    (Left foot raised)
                  </Typography>

                  <Typography variant="h3" color="primary" sx={{ my: 1 }}>
                    {rightLegResult.holdTime.toFixed(1)}s
                  </Typography>

                  <Chip
                    label={rightLegResult.success ? 'Passed' : 'Failed'}
                    color={rightLegResult.success ? 'success' : 'warning'}
                    size="small"
                    sx={{ mt: 1 }}
                  />

                  {!rightLegResult.success && rightLegResult.failureReason && (
                    <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                      {rightLegResult.failureReason}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Quick symmetry preview */}
          <Box sx={{ bgcolor: 'grey.50', p: 2.5, borderRadius: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Quick Symmetry Preview
            </Typography>
            <Box display="flex" alignItems="center" gap={2} mt={1.5}>
              <Typography variant="h4" color="primary">
                {symmetry.score}/100
              </Typography>
              <Chip
                label={symmetry.assessment}
                size="small"
                color={
                  symmetry.score >= 85
                    ? 'success'
                    : symmetry.score >= 70
                      ? 'primary'
                      : symmetry.score >= 50
                        ? 'warning'
                        : 'error'
                }
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Time difference: {symmetry.timeDiff.toFixed(1)}s ({symmetry.timeDiffPct.toFixed(0)}%)
            </Typography>
          </Box>

          {/* Info alert */}
          <Alert severity="info">
            Ready to upload? Full symmetry analysis will be available after processing.
          </Alert>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: 1, px: 3, pb: 3 }}>
        <Button
          onClick={onReshootLeft}
          variant="outlined"
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Reshoot Left
        </Button>
        <Button
          onClick={onReshootRight}
          variant="outlined"
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Reshoot Right
        </Button>
        <Button
          onClick={onContinueToUpload}
          variant="contained"
          autoFocus
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Upload & Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};
