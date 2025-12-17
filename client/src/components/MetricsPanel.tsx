import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { TestState, CurrentMetrics } from '../types/balanceTest';
import { LegTested } from '../types/assessment';

interface MetricsPanelProps {
  testState: TestState;
  holdTime: number;
  currentMetrics: CurrentMetrics | null;
  targetDuration: number;
  legTested: LegTested;
}

// Helper function for time formatting
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const tenths = Math.floor((seconds % 1) * 10);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${tenths}`;
};

export const MetricsPanel: React.FC<MetricsPanelProps> = ({
  testState,
  holdTime,
  currentMetrics,
  targetDuration = 30,
  legTested,
}) => {
  // Don't render in idle state
  if (testState === 'idle') {
    return null;
  }

  // Determine instruction text based on leg being tested
  const getPositionInstruction = () => {
    if (legTested === 'left') {
      return 'Raise your RIGHT foot and hold your arms out';
    } else if (legTested === 'right') {
      return 'Raise your LEFT foot and hold your arms out';
    } else {
      return 'Raise your LEFT foot and hold your arms out';
    }
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'white',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'grey.200',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        p: 3,
      }}
    >
      {/* READY STATE */}
      {testState === 'ready' && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            textAlign: 'center',
            px: 1,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              mb: 2,
              color: 'text.primary',
            }}
          >
            Get in Position
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
            {getPositionInstruction()}
          </Typography>
        </Box>
      )}

      {/* HOLDING STATE */}
      {testState === 'holding' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Test Time */}
          <Box>
            <Typography
              variant="caption"
              sx={{
                textTransform: 'uppercase',
                color: 'text.secondary',
                fontWeight: 700,
                letterSpacing: 0.5,
                fontSize: '0.7rem',
                mb: 0.5,
                display: 'block',
              }}
            >
              Test Time
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontFamily: 'monospace',
                fontWeight: 700,
                mt: 0.5,
                fontSize: '2.5rem',
              }}
            >
              {formatTime(holdTime)}
            </Typography>
          </Box>

          {/* Progress Bar */}
          <Box>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography
                variant="caption"
                color="text.secondary"
                fontSize="0.7rem"
                fontWeight={700}
                sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
              >
                Progress
              </Typography>
              <Typography variant="caption" color="text.secondary" fontSize="0.7rem" fontWeight={600}>
                Target: {targetDuration.toFixed(1)}s
              </Typography>
            </Box>
            <Box
              sx={{
                width: '100%',
                height: 8,
                bgcolor: 'grey.200',
                borderRadius: 999,
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  width: `${Math.min((holdTime / targetDuration) * 100, 100)}%`,
                  height: '100%',
                  bgcolor: '#2563EB',
                  borderRadius: 999,
                  transition: 'width 100ms linear',
                }}
              />
            </Box>
          </Box>

          {/* Real-time Metrics */}
          {currentMetrics && (
            <>
              {/* Arm Angles */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    textTransform: 'uppercase',
                    color: 'text.secondary',
                    fontWeight: 600,
                    letterSpacing: 0.5,
                    fontSize: '0.65rem',
                  }}
                >
                  Arm Angles
                </Typography>
                <Box display="flex" gap={1.5} mt={0.25}>
                  <Box flex={1}>
                    <Typography variant="caption" color="text.secondary" fontSize="0.65rem">
                      Left
                    </Typography>
                    <Typography variant="h6" fontFamily="monospace">
                      {currentMetrics.armAngleLeft.toFixed(1)}°
                    </Typography>
                  </Box>
                  <Box flex={1}>
                    <Typography variant="caption" color="text.secondary" fontSize="0.65rem">
                      Right
                    </Typography>
                    <Typography variant="h6" fontFamily="monospace">
                      {currentMetrics.armAngleRight.toFixed(1)}°
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Hip Sway */}
              {currentMetrics.hipSway !== undefined && (
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      textTransform: 'uppercase',
                      color: 'text.secondary',
                      fontWeight: 600,
                      letterSpacing: 0.5,
                      fontSize: '0.65rem',
                    }}
                  >
                    Hip Sway
                  </Typography>
                  <Typography variant="h6" fontFamily="monospace" mt={0.25}>
                    {currentMetrics.hipSway.toFixed(1)} cm
                  </Typography>
                </Box>
              )}

              {/* Corrections */}
              {currentMetrics.corrections !== undefined && (
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      textTransform: 'uppercase',
                      color: 'text.secondary',
                      fontWeight: 600,
                      letterSpacing: 0.5,
                      fontSize: '0.65rem',
                    }}
                  >
                    Corrections
                  </Typography>
                  <Typography variant="h6" fontFamily="monospace" mt={0.25}>
                    {currentMetrics.corrections}
                  </Typography>
                </Box>
              )}

              {/* Balance Status */}
              {currentMetrics.balanceStatus && (
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      textTransform: 'uppercase',
                      color: 'text.secondary',
                      fontWeight: 600,
                      letterSpacing: 0.5,
                      fontSize: '0.65rem',
                      mb: 0.5,
                      display: 'block',
                    }}
                  >
                    Status
                  </Typography>
                  <Chip
                    label={currentMetrics.balanceStatus}
                    size="small"
                    color={currentMetrics.balanceStatus === 'STABLE' ? 'success' : 'warning'}
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.75rem',
                    }}
                  />
                </Box>
              )}
            </>
          )}

          {/* Coaching Tip */}
          <Box
            sx={{
              mt: 'auto',
              pt: 1.5,
              borderTop: 1,
              borderColor: 'divider',
            }}
          >
            <Typography variant="body2" color="text.secondary" fontSize="0.75rem">
              💡 Keep arms horizontal
            </Typography>
            <Typography variant="caption" color="text.secondary" fontSize="0.65rem">
              Target: &lt;10° deviation
            </Typography>
          </Box>
        </Box>
      )}

      {/* COMPLETED STATE */}
      {testState === 'completed' && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            textAlign: 'center',
          }}
        >
          <Typography sx={{ fontSize: '64px', mb: 2 }}>✓</Typography>
          <Typography
            variant="h5"
            color="success.main"
            fontWeight={700}
            textTransform="uppercase"
            letterSpacing={0.5}
            mb={2}
          >
            Great Job!
          </Typography>
          <Typography variant="h4" fontFamily="monospace" fontWeight={700}>
            {formatTime(holdTime)}
          </Typography>
        </Box>
      )}

      {/* FAILED STATE */}
      {testState === 'failed' && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h5"
            color="warning.main"
            fontWeight={700}
            textTransform="uppercase"
            letterSpacing={0.5}
            mb={2}
          >
            Test Ended
          </Typography>
          <Typography variant="h4" fontFamily="monospace" fontWeight={700}>
            {formatTime(holdTime)}
          </Typography>
        </Box>
      )}
    </Box>
  );
};
