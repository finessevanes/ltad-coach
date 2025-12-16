import React from 'react';
import { Box, Typography } from '@mui/material';
import { TestState, CurrentMetrics } from '../types/balanceTest';
import { LegTested } from '../types/assessment';

interface CoachingOverlayProps {
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

// Reusable metric display component
const MetricDisplay: React.FC<{
  label: string;
  value: string;
  unit?: string;
  typographyStyles: any;
}> = ({ label, value, unit, typographyStyles }) => (
  <Box sx={{ mb: 1.5 }}>
    <Typography sx={typographyStyles.label}>
      {label}
    </Typography>
    <Typography sx={{
      ...typographyStyles.metricValue,
      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
    }}>
      {value}{unit && <span style={{ fontSize: '0.8em' }}>{unit}</span>}
    </Typography>
  </Box>
);

export const CoachingOverlay: React.FC<CoachingOverlayProps> = ({
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
  // NOTE: Testing LEFT leg = stand on LEFT, raise RIGHT foot
  const getPositionInstruction = () => {
    if (legTested === 'left') {
      return 'Raise your RIGHT foot and hold your arms out';
    } else if (legTested === 'right') {
      return 'Raise your LEFT foot and hold your arms out';
    } else {
      // legTested === 'both' - starts with right leg test
      return 'Raise your LEFT foot and hold your arms out';
    }
  };

  // Typography configuration per spec
  const TYPOGRAPHY_STYLES = {
    label: {
      fontFamily: 'monospace',
      fontSize: '11px',
      textTransform: 'uppercase' as const,
      color: 'rgba(156, 163, 175, 1)', // gray-400
      letterSpacing: '0.1em',
      fontWeight: 400,
    },
    metricValue: {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: 'rgba(255, 255, 255, 0.9)',
      fontWeight: 300,
      fontVariantNumeric: 'tabular-nums',
    },
    timer: {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: 'rgba(255, 255, 255, 0.9)',
      fontWeight: 300,
      fontVariantNumeric: 'tabular-nums',
    },
    status: {
      fontFamily: 'monospace',
      fontSize: '15px',
      fontWeight: 500,
    },
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {/* READY STATE */}
      {testState === 'ready' && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            bgcolor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: 3,
            p: 4,
            minWidth: 400,
          }}
        >
          <Typography
            sx={{
              fontFamily: 'monospace',
              fontSize: '28px',
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              mb: 2,
            }}
          >
            Get in Position
          </Typography>

          <Typography
            sx={{
              fontFamily: 'monospace',
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.6)',
            }}
          >
            {getPositionInstruction()}
          </Typography>
        </Box>
      )}

      {/* HOLDING STATE - Four Quadrant Layout */}
      {testState === 'holding' && (
        <>
          {/* TOP-LEFT: Test Duration */}
          <Box
            sx={{
              position: 'absolute',
              top: 32,
              left: 32,
              textAlign: 'left',
            }}
          >
            {/* Label */}
            <Typography sx={TYPOGRAPHY_STYLES.label}>
              TEST TIME
            </Typography>

            {/* Timer (largest text on screen) */}
            <Typography sx={{
              ...TYPOGRAPHY_STYLES.timer,
              fontSize: '32px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              mt: 0.5,
            }}>
              {formatTime(holdTime)}
            </Typography>
          </Box>

          {/* TOP-RIGHT: Real-time Metrics */}
          {currentMetrics && currentMetrics.armAngleLeft !== undefined && currentMetrics.armAngleRight !== undefined && (
            <Box
              sx={{
                position: 'absolute',
                top: 32,
                right: 32,
                textAlign: 'right',
              }}
            >
              {/* Arm Angles */}
              <MetricDisplay
                label="ARM ANGLE L"
                value={currentMetrics.armAngleLeft.toFixed(1)}
                unit="°"
                typographyStyles={TYPOGRAPHY_STYLES}
              />

              <MetricDisplay
                label="ARM ANGLE R"
                value={currentMetrics.armAngleRight.toFixed(1)}
                unit="°"
                typographyStyles={TYPOGRAPHY_STYLES}
              />

              {/* Hip Sway */}
              {currentMetrics.hipSway !== undefined && (
                <MetricDisplay
                  label="HIP SWAY"
                  value={currentMetrics.hipSway.toFixed(1)}
                  unit=" cm"
                  typographyStyles={TYPOGRAPHY_STYLES}
                />
              )}

              {/* Corrections Count */}
              {currentMetrics.corrections !== undefined && (
                <MetricDisplay
                  label="CORRECTIONS"
                  value={currentMetrics.corrections.toString()}
                  typographyStyles={TYPOGRAPHY_STYLES}
                />
              )}

              {/* Balance Status */}
              {currentMetrics.balanceStatus && (
                <Box sx={{ mt: 1.5 }}>
                  <Typography sx={TYPOGRAPHY_STYLES.label}>
                    STATUS
                  </Typography>
                  <Typography sx={{
                    ...TYPOGRAPHY_STYLES.status,
                    color: currentMetrics.balanceStatus === 'STABLE'
                      ? '#4ADE80'  // green for stable
                      : '#FACC15', // yellow for unstable
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  }}>
                    {currentMetrics.balanceStatus}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* BOTTOM-LEFT: Arm Form Coaching */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 32,
              left: 32,
              textAlign: 'left',
            }}
          >
            <Typography
              sx={{
                fontFamily: 'monospace',
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.8)',
                mb: 0.5,
              }}
            >
              Keep arms horizontal
            </Typography>
            <Typography
              sx={{
                fontFamily: 'monospace',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              Target: &lt;10° deviation
            </Typography>
          </Box>

          {/* BOTTOM-RIGHT: Progress Bar */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 32,
              right: 32,
              textAlign: 'right',
              width: 280,
            }}
          >
            {/* Target duration label */}
            <Typography sx={{
              ...TYPOGRAPHY_STYLES.label,
              mb: 1,
            }}>
              TARGET: {targetDuration.toFixed(1)}s
            </Typography>

            {/* Progress bar */}
            <Box
              sx={{
                width: '100%',
                height: 4,
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
              }}
            >
              <Box
                sx={{
                  width: `${Math.min((holdTime / targetDuration) * 100, 100)}%`,
                  height: '100%',
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: 2,
                  transition: 'width 100ms linear', // Smooth 100ms transitions
                }}
              />
            </Box>
          </Box>
        </>
      )}

      {/* COMPLETED STATE */}
      {testState === 'completed' && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            bgcolor: 'rgba(0, 0, 0, 0.8)',
            borderRadius: 3,
            p: 5,
            minWidth: 400,
          }}
        >
          {/* Success icon */}
          <Typography sx={{ fontSize: '64px', mb: 2 }}>
            ✓
          </Typography>

          <Typography
            sx={{
              fontFamily: 'monospace',
              fontSize: '32px',
              color: '#4ADE80', // green
              fontWeight: 500,
              mb: 2,
            }}
          >
            Great Job!
          </Typography>

          <Typography
            sx={{
              fontFamily: 'monospace',
              fontSize: '28px',
              color: 'rgba(255, 255, 255, 0.9)',
            }}
          >
            {formatTime(holdTime)}
          </Typography>
        </Box>
      )}

      {/* FAILED STATE */}
      {testState === 'failed' && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            bgcolor: 'rgba(0, 0, 0, 0.8)',
            borderRadius: 3,
            p: 5,
            minWidth: 400,
          }}
        >
          <Typography
            sx={{
              fontFamily: 'monospace',
              fontSize: '28px',
              color: '#FACC15', // yellow (not red - youth appropriate)
              fontWeight: 500,
              mb: 2,
            }}
          >
            Test Ended
          </Typography>

          <Typography
            sx={{
              fontFamily: 'monospace',
              fontSize: '24px',
              color: 'rgba(255, 255, 255, 0.9)',
            }}
          >
            Time: {formatTime(holdTime)}
          </Typography>
        </Box>
      )}
    </Box>
  );
};
