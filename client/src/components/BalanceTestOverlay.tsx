import React from 'react';
import { Box, Typography } from '@mui/material';
import { CheckCircle, Cancel, Timer } from '@mui/icons-material';
import { TestState, PositionStatus, DEFAULT_TARGET_DURATION } from '../types/balanceTest';
import { DebugInfo } from '../hooks/useBalanceTest';

interface BalanceTestOverlayProps {
  testState: TestState;
  holdTime: number;
  failureReason: string | null;
  positionStatus: PositionStatus | null;
  targetDuration?: number;
  debugInfo?: DebugInfo | null;
}

export const BalanceTestOverlay: React.FC<BalanceTestOverlayProps> = ({
  testState,
  holdTime,
  failureReason,
  positionStatus,
  targetDuration = DEFAULT_TARGET_DURATION,
  debugInfo,
}) => {
  // Don't render anything in idle state
  if (testState === 'idle') {
    return null;
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const tenths = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${tenths}`;
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      {/* READY state - Get in position */}
      {testState === 'ready' && (
        <Box textAlign="center" px={3}>
          <Typography
            variant="h3"
            sx={{
              color: 'white',
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              mb: 3,
            }}
          >
            Get in Position
          </Typography>

          {positionStatus && positionStatus.failedChecks.length > 0 && (
            <Box
              sx={{
                bgcolor: 'rgba(0, 0, 0, 0.6)',
                borderRadius: 2,
                p: 2,
                maxWidth: 400,
              }}
            >
              {positionStatus.checks.map((check, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 1,
                    '&:last-child': { mb: 0 },
                  }}
                >
                  {check.passed ? (
                    <CheckCircle sx={{ color: '#4caf50', fontSize: 24 }} />
                  ) : (
                    <Cancel sx={{ color: '#f44336', fontSize: 24 }} />
                  )}
                  <Typography
                    sx={{
                      color: check.passed ? '#4caf50' : '#f44336',
                      fontSize: '1.1rem',
                      fontWeight: check.passed ? 'normal' : 'bold',
                    }}
                  >
                    {check.message}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {positionStatus && positionStatus.isInPosition && (
            <Typography
              sx={{
                color: '#4caf50',
                fontSize: '1.2rem',
                mt: 2,
                fontWeight: 'bold',
              }}
            >
              Hold steady...
            </Typography>
          )}
        </Box>
      )}

      {/* HOLDING state - Timer counting up */}
      {testState === 'holding' && (
        <Box textAlign="center">
          <Typography
            variant="h2"
            sx={{
              color: '#4caf50',
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              mb: 1,
              letterSpacing: 2,
            }}
          >
            HOLD IT!
          </Typography>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
            }}
          >
            <Timer sx={{ color: 'white', fontSize: 48 }} />
            <Typography
              sx={{
                color: 'white',
                fontSize: '4rem',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              }}
            >
              {formatTime(holdTime)}
            </Typography>
          </Box>

          <Typography
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '1rem',
              mt: 2,
            }}
          >
            Target: {targetDuration} seconds
          </Typography>

          {/* Progress bar */}
          <Box
            sx={{
              width: 300,
              height: 8,
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 4,
              mt: 2,
              mx: 'auto',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                width: `${Math.min((holdTime / targetDuration) * 100, 100)}%`,
                height: '100%',
                bgcolor: '#4caf50',
                borderRadius: 4,
                transition: 'width 0.1s linear',
              }}
            />
          </Box>

          {/* Debug Panel */}
          {debugInfo && (
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                right: 80,
                bgcolor: 'rgba(0, 0, 0, 0.85)',
                borderRadius: 2,
                p: 2,
                textAlign: 'left',
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                maxWidth: 350,
                zIndex: 20,
              }}
            >
              <Typography sx={{ color: '#00ff00', fontWeight: 'bold', mb: 1, fontSize: '0.85rem' }}>
                DEBUG MODE
              </Typography>

              {/* Confidence/Visibility Check */}
              <Box sx={{
                mb: 1.5,
                p: 1,
                bgcolor: debugInfo.skippedDueToLowConfidence
                  ? 'rgba(255,165,0,0.3)'
                  : debugInfo.visibilityPassed
                    ? 'rgba(0,255,0,0.1)'
                    : 'rgba(255,165,0,0.3)',
                borderRadius: 1
              }}>
                <Typography sx={{ color: '#00bfff', fontWeight: 'bold', fontSize: '0.75rem' }}>
                  CONFIDENCE (visibility 0-1)
                </Typography>
                <Typography sx={{
                  color: debugInfo.standingAnkleVisibility >= debugInfo.minVisibilityThreshold ? '#44ff44' : '#ffaa00'
                }}>
                  Standing ankle: {debugInfo.standingAnkleVisibility.toFixed(2)} {debugInfo.standingAnkleVisibility >= debugInfo.minVisibilityThreshold ? 'OK' : 'LOW'}
                </Typography>
                <Typography sx={{
                  color: debugInfo.raisedAnkleVisibility >= debugInfo.minVisibilityThreshold ? '#44ff44' : '#ffaa00'
                }}>
                  Raised ankle: {debugInfo.raisedAnkleVisibility.toFixed(2)} {debugInfo.raisedAnkleVisibility >= debugInfo.minVisibilityThreshold ? 'OK' : 'LOW'}
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.65rem' }}>
                  Min threshold: {debugInfo.minVisibilityThreshold}
                </Typography>
                {debugInfo.skippedDueToLowConfidence && (
                  <Typography sx={{ color: '#ffaa00', fontWeight: 'bold', mt: 0.5 }}>
                    FRAME SKIPPED (low confidence)
                  </Typography>
                )}
              </Box>

              {/* Foot Touchdown Check */}
              <Box sx={{ mb: 1.5, p: 1, bgcolor: debugInfo.wouldTriggerTouchdown ? 'rgba(255,0,0,0.3)' : 'rgba(0,255,0,0.1)', borderRadius: 1 }}>
                <Typography sx={{ color: '#ffff00', fontWeight: 'bold', fontSize: '0.75rem' }}>
                  FOOT TOUCHDOWN CHECK
                </Typography>
                <Typography sx={{ color: 'white' }}>
                  Standing ankle Y: {debugInfo.standingAnkleY.toFixed(4)}
                </Typography>
                <Typography sx={{ color: 'white' }}>
                  Raised ankle Y: {debugInfo.raisedAnkleY.toFixed(4)}
                </Typography>
                <Typography sx={{ color: debugInfo.footTouchdownDiff < debugInfo.touchdownThreshold ? '#ffaa00' : '#44ff44', fontWeight: 'bold' }}>
                  Diff: {debugInfo.footTouchdownDiff.toFixed(4)} (threshold: &lt;{debugInfo.touchdownThreshold})
                </Typography>
                <Typography sx={{ color: 'white', mt: 0.5 }}>
                  Initial raised Y: {debugInfo.initialRaisedAnkleY.toFixed(4)}
                </Typography>
                <Typography sx={{ color: debugInfo.raisedFootDescent > debugInfo.descentThreshold ? '#ffaa00' : '#44ff44', fontWeight: 'bold' }}>
                  Descent: {debugInfo.raisedFootDescent.toFixed(4)} (threshold: &gt;{debugInfo.descentThreshold})
                </Typography>
                <Typography sx={{
                  color: debugInfo.consecutiveTouchdownFrames === 0
                    ? '#44ff44'
                    : debugInfo.consecutiveTouchdownFrames < 4
                      ? '#ffaa00'
                      : debugInfo.consecutiveTouchdownFrames < debugInfo.consecutiveFramesRequired
                        ? '#ff8800'
                        : '#ff4444',
                  fontWeight: 'bold',
                  mt: 0.5
                }}>
                  Fail frames: {debugInfo.consecutiveTouchdownFrames}/{debugInfo.consecutiveFramesRequired}
                </Typography>
                <Typography sx={{ color: debugInfo.wouldTriggerTouchdown ? '#ff4444' : '#44ff44', fontWeight: 'bold' }}>
                  {debugInfo.wouldTriggerTouchdown ? 'TRIGGERED' : 'OK'}
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.6rem' }}>
                  (Requires {debugInfo.consecutiveFramesRequired} consecutive frames)
                </Typography>
              </Box>

              {/* Support Foot Movement Check */}
              <Box sx={{ p: 1, bgcolor: debugInfo.wouldTriggerMovement ? 'rgba(255,0,0,0.3)' : 'rgba(0,255,0,0.1)', borderRadius: 1 }}>
                <Typography sx={{ color: '#ffff00', fontWeight: 'bold', fontSize: '0.75rem' }}>
                  SUPPORT FOOT MOVEMENT CHECK
                </Typography>
                <Typography sx={{ color: 'white' }}>
                  Initial: X={debugInfo.initialStandingAnkleX.toFixed(4)}, Y={debugInfo.initialStandingAnkleY.toFixed(4)}
                </Typography>
                <Typography sx={{ color: 'white' }}>
                  Current: X={debugInfo.standingAnkleX.toFixed(4)}, Y={debugInfo.standingAnkleY.toFixed(4)}
                </Typography>
                <Typography sx={{ color: 'white' }}>
                  X shift: {debugInfo.supportFootXShift >= 0 ? '+' : ''}{debugInfo.supportFootXShift.toFixed(4)}
                </Typography>
                <Typography sx={{ color: 'white' }}>
                  Y shift: {debugInfo.supportFootYShift >= 0 ? '+' : ''}{debugInfo.supportFootYShift.toFixed(4)} {debugInfo.supportFootYShift > 0 ? '(down)' : debugInfo.supportFootYShift < 0 ? '(up)' : ''}
                </Typography>
                <Typography sx={{ color: debugInfo.wouldTriggerMovement ? '#ff4444' : '#44ff44', fontWeight: 'bold' }}>
                  Total displacement: {debugInfo.supportFootDisplacement.toFixed(4)} (threshold: &gt;{debugInfo.movementThreshold})
                </Typography>
                <Typography sx={{
                  color: debugInfo.consecutiveMovementFrames === 0
                    ? '#44ff44'
                    : debugInfo.consecutiveMovementFrames < 4
                      ? '#ffaa00'
                      : debugInfo.consecutiveMovementFrames < debugInfo.consecutiveFramesRequired
                        ? '#ff8800'
                        : '#ff4444',
                  fontWeight: 'bold',
                  mt: 0.5
                }}>
                  Fail frames: {debugInfo.consecutiveMovementFrames}/{debugInfo.consecutiveFramesRequired}
                </Typography>
                <Typography sx={{ color: debugInfo.wouldTriggerMovement ? '#ff4444' : '#44ff44' }}>
                  {debugInfo.wouldTriggerMovement ? 'TRIGGERED' : 'OK'}
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.6rem' }}>
                  (Requires {debugInfo.consecutiveFramesRequired} consecutive frames)
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* COMPLETED state - Success */}
      {testState === 'completed' && (
        <Box textAlign="center">
          <CheckCircle sx={{ color: '#4caf50', fontSize: 80, mb: 2 }} />
          <Typography
            variant="h2"
            sx={{
              color: '#4caf50',
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              mb: 2,
            }}
          >
            Great Job!
          </Typography>
          <Typography
            sx={{
              color: 'white',
              fontSize: '2.5rem',
              fontWeight: 'bold',
              fontFamily: 'monospace',
            }}
          >
            Time: {formatTime(holdTime)}
          </Typography>
        </Box>
      )}

      {/* FAILED state - Test ended early */}
      {testState === 'failed' && (
        <Box textAlign="center">
          <Cancel sx={{ color: '#ff9800', fontSize: 80, mb: 2 }} />
          <Typography
            variant="h3"
            sx={{
              color: '#ff9800',
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              mb: 2,
            }}
          >
            Test Ended
          </Typography>
          <Typography
            sx={{
              color: 'white',
              fontSize: '2.5rem',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              mb: 2,
            }}
          >
            Time: {formatTime(holdTime)}
          </Typography>
          {failureReason && (
            <Typography
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '1.2rem',
                bgcolor: 'rgba(255, 152, 0, 0.3)',
                px: 3,
                py: 1,
                borderRadius: 2,
                display: 'inline-block',
              }}
            >
              {failureReason}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};
