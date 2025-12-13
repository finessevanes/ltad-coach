import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Chip,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import assessmentsService from '../../services/assessments';
import athletesService from '../../services/athletes';
import { Assessment } from '../../types/assessment';
import { Athlete } from '../../types/athlete';

export default function AssessmentResults() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!assessmentId) {
        setError('No assessment ID provided');
        setLoading(false);
        return;
      }

      try {
        const assessmentData = await assessmentsService.getById(assessmentId);
        setAssessment(assessmentData);

        // Fetch athlete info
        const athleteData = await athletesService.getById(assessmentData.athleteId);
        setAthlete(athleteData);
      } catch (err: any) {
        setError(err.message || 'Failed to load assessment');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [assessmentId]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading assessment...</Typography>
      </Container>
    );
  }

  if (error || !assessment) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Assessment not found'}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/athletes')}
          sx={{ mt: 2 }}
        >
          Back to Athletes
        </Button>
      </Container>
    );
  }

  // Use metrics (from backend) which now use client-calculated values
  const { metrics } = assessment;

  // Format date
  const formattedDate = new Date(assessment.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Helper to format numbers
  const formatNum = (val: number | undefined, decimals = 2): string => {
    if (val === undefined || val === null) return '-';
    return val.toFixed(decimals);
  };

  // Determine test result
  const testPassed = metrics && metrics.holdTime >= 30;
  const failureReason = assessment.failureReason;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">Assessment Results</Typography>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/athletes')}
          >
            Back
          </Button>
        </Box>

        <Box display="flex" flexWrap="wrap" gap={3}>
          <Box>
            <Typography variant="body2" color="text.secondary">Athlete</Typography>
            <Typography variant="body1">{athlete?.name || 'Unknown'}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Date</Typography>
            <Typography variant="body1">{formattedDate}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Test</Typography>
            <Typography variant="body1">One-Leg Balance</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Leg Tested</Typography>
            <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
              {assessment.legTested}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Result</Typography>
            {testPassed ? (
              <Chip icon={<CheckCircleIcon />} label="PASS" color="success" size="small" />
            ) : (
              <Chip icon={<CancelIcon />} label="FAIL" color="error" size="small" />
            )}
          </Box>
        </Box>
        {failureReason && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Failure Reason: {failureReason}
          </Typography>
        )}
      </Paper>

      {/* Key Metrics Cards */}
      {metrics && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="primary">
                  {formatNum(metrics.holdTime, 1)}s
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Hold Time
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="primary">
                  {formatNum(metrics.stabilityScore, 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Stability Score
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="primary">
                  {metrics.durationScore}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  LTAD Score ({metrics.durationScoreLabel})
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="primary">
                  {metrics.correctionsCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Balance Corrections
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Metrics Comparison: Normalized vs World */}
      {metrics && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Metrics Comparison
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Comparing normalized (0-1 scale) vs world landmarks (real units: cm, degrees)
          </Typography>

          <TableContainer>
            <Table size="small">
              <TableBody>
                {/* Sway Metrics Header */}
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell><strong>Sway Metrics</strong></TableCell>
                  <TableCell align="center"><strong>Normalized</strong></TableCell>
                  <TableCell align="center"><strong>World (cm)</strong></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ pl: 2 }}>Sway Std X</TableCell>
                  <TableCell align="center">{formatNum(metrics.swayStdX, 6)}</TableCell>
                  <TableCell align="center">
                    {metrics.worldMetrics ? `${formatNum(metrics.worldMetrics.swayStdX, 2)} cm` : '-'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ pl: 2 }}>Sway Std Y</TableCell>
                  <TableCell align="center">{formatNum(metrics.swayStdY, 6)}</TableCell>
                  <TableCell align="center">
                    {metrics.worldMetrics ? `${formatNum(metrics.worldMetrics.swayStdY, 2)} cm` : '-'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ pl: 2 }}>Sway Path Length</TableCell>
                  <TableCell align="center">{formatNum(metrics.swayPathLength, 6)}</TableCell>
                  <TableCell align="center">
                    {metrics.worldMetrics ? `${formatNum(metrics.worldMetrics.swayPathLength, 2)} cm` : '-'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ pl: 2 }}>Sway Velocity</TableCell>
                  <TableCell align="center">{formatNum(metrics.swayVelocity, 6)}</TableCell>
                  <TableCell align="center">
                    {metrics.worldMetrics ? `${formatNum(metrics.worldMetrics.swayVelocity, 2)} cm/s` : '-'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ pl: 2 }}>Corrections</TableCell>
                  <TableCell align="center">{metrics.correctionsCount}</TableCell>
                  <TableCell align="center">
                    {metrics.worldMetrics ? metrics.worldMetrics.correctionsCount : '-'}
                  </TableCell>
                </TableRow>

                {/* Arm Metrics Header */}
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell><strong>Arm Metrics</strong></TableCell>
                  <TableCell align="center"><strong>Normalized</strong></TableCell>
                  <TableCell align="center"><strong>World (degrees)</strong></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ pl: 2 }}>Left Arm</TableCell>
                  <TableCell align="center">{formatNum(metrics.armDeviationLeft, 4)}</TableCell>
                  <TableCell align="center">
                    {metrics.worldMetrics ? `${formatNum(metrics.worldMetrics.armAngleLeft, 1)}°` : '-'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ pl: 2 }}>Right Arm</TableCell>
                  <TableCell align="center">{formatNum(metrics.armDeviationRight, 4)}</TableCell>
                  <TableCell align="center">
                    {metrics.worldMetrics ? `${formatNum(metrics.worldMetrics.armAngleRight, 1)}°` : '-'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ pl: 2 }}>Asymmetry Ratio</TableCell>
                  <TableCell align="center">{formatNum(metrics.armAsymmetryRatio, 2)}</TableCell>
                  <TableCell align="center">
                    {metrics.worldMetrics ? formatNum(metrics.worldMetrics.armAsymmetryRatio, 2) : '-'}
                  </TableCell>
                </TableRow>

                {/* Scores Header */}
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell><strong>Scores</strong></TableCell>
                  <TableCell align="center"><strong>Normalized</strong></TableCell>
                  <TableCell align="center"><strong>World</strong></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ pl: 2 }}>Stability Score</TableCell>
                  <TableCell align="center">{formatNum(metrics.stabilityScore, 1)}</TableCell>
                  <TableCell align="center">
                    {metrics.worldMetrics ? formatNum(metrics.worldMetrics.stabilityScore, 1) : '-'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ pl: 2 }}>LTAD Score</TableCell>
                  <TableCell align="center" colSpan={2}>
                    <Chip
                      label={`${metrics.durationScore} - ${metrics.durationScoreLabel}`}
                      color="primary"
                      size="small"
                    />
                  </TableCell>
                </TableRow>
                {metrics.ageExpectation && (
                  <TableRow>
                    <TableCell sx={{ pl: 2 }}>Age Expectation</TableCell>
                    <TableCell align="center" colSpan={2}>
                      <Chip
                        label={metrics.ageExpectation}
                        color={
                          metrics.ageExpectation === 'above' ? 'success' :
                          metrics.ageExpectation === 'below' ? 'warning' : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Temporal Analysis (Fatigue Pattern) */}
      {metrics?.worldMetrics?.temporal && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Temporal Analysis (Fatigue Pattern)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Metrics broken down by test segment to identify fatigue patterns
          </Typography>

          <TableContainer>
            <Table size="small">
              <TableBody>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell><strong>Segment</strong></TableCell>
                  <TableCell align="center"><strong>Arm Left</strong></TableCell>
                  <TableCell align="center"><strong>Arm Right</strong></TableCell>
                  <TableCell align="center"><strong>Sway Velocity</strong></TableCell>
                  <TableCell align="center"><strong>Corrections</strong></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>First Third (0-33%)</TableCell>
                  <TableCell align="center">
                    {formatNum(metrics.worldMetrics.temporal.firstThird.armAngleLeft, 1)}°
                  </TableCell>
                  <TableCell align="center">
                    {formatNum(metrics.worldMetrics.temporal.firstThird.armAngleRight, 1)}°
                  </TableCell>
                  <TableCell align="center">
                    {formatNum(metrics.worldMetrics.temporal.firstThird.swayVelocity, 2)} cm/s
                  </TableCell>
                  <TableCell align="center">
                    {metrics.worldMetrics.temporal.firstThird.correctionsCount}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Middle Third (33-66%)</TableCell>
                  <TableCell align="center">
                    {formatNum(metrics.worldMetrics.temporal.middleThird.armAngleLeft, 1)}°
                  </TableCell>
                  <TableCell align="center">
                    {formatNum(metrics.worldMetrics.temporal.middleThird.armAngleRight, 1)}°
                  </TableCell>
                  <TableCell align="center">
                    {formatNum(metrics.worldMetrics.temporal.middleThird.swayVelocity, 2)} cm/s
                  </TableCell>
                  <TableCell align="center">
                    {metrics.worldMetrics.temporal.middleThird.correctionsCount}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Last Third (66-100%)</TableCell>
                  <TableCell align="center">
                    {formatNum(metrics.worldMetrics.temporal.lastThird.armAngleLeft, 1)}°
                  </TableCell>
                  <TableCell align="center">
                    {formatNum(metrics.worldMetrics.temporal.lastThird.armAngleRight, 1)}°
                  </TableCell>
                  <TableCell align="center">
                    {formatNum(metrics.worldMetrics.temporal.lastThird.swayVelocity, 2)} cm/s
                  </TableCell>
                  <TableCell align="center">
                    {metrics.worldMetrics.temporal.lastThird.correctionsCount}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {/* Fatigue Pattern Analysis */}
          {(() => {
            const temporal = metrics.worldMetrics!.temporal;
            const armDrop = temporal.lastThird.armAngleLeft - temporal.firstThird.armAngleLeft;
            const swayIncrease = temporal.lastThird.swayVelocity - temporal.firstThird.swayVelocity;
            const showFatigue = armDrop > 5 || swayIncrease > 0.5;

            return showFatigue ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Pattern Detected:</Typography>
                <Typography variant="body2">
                  {armDrop > 5 && `Arms dropped ${formatNum(armDrop, 1)}° from start to end. `}
                  {swayIncrease > 0.5 && `Sway velocity increased by ${formatNum(swayIncrease, 2)} cm/s. `}
                  This suggests progressive fatigue during the test.
                </Typography>
              </Alert>
            ) : (
              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Consistent performance throughout the test - no significant fatigue pattern detected.
                </Typography>
              </Alert>
            );
          })()}
        </Paper>
      )}

      {/* World metrics not available warning */}
      {metrics && !metrics.worldMetrics && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          World landmark metrics not available for this assessment. Real-world unit comparisons (cm, degrees) require world landmarks from MediaPipe.
        </Alert>
      )}

      {/* No metrics fallback */}
      {!metrics && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          No metrics available for this assessment.
        </Alert>
      )}

      {/* Actions */}
      <Box display="flex" gap={2} justifyContent="center">
        <Button
          variant="contained"
          onClick={() => navigate(`/assess/${assessment.athleteId}`)}
        >
          New Assessment
        </Button>
        <Button
          variant="outlined"
          onClick={() => navigate('/athletes')}
        >
          Back to Athletes
        </Button>
      </Box>
    </Container>
  );
}
