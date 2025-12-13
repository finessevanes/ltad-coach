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

      {/* Detailed Metrics */}
      {metrics && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Detailed Metrics
          </Typography>

          <TableContainer>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell><strong>Sway Metrics</strong></TableCell>
                  <TableCell></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ pl: 4 }}>Sway Std X</TableCell>
                  <TableCell align="right">{formatNum(metrics.swayStdX, 6)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ pl: 4 }}>Sway Std Y</TableCell>
                  <TableCell align="right">{formatNum(metrics.swayStdY, 6)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ pl: 4 }}>Sway Path Length</TableCell>
                  <TableCell align="right">{formatNum(metrics.swayPathLength, 6)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ pl: 4 }}>Sway Velocity</TableCell>
                  <TableCell align="right">{formatNum(metrics.swayVelocity, 6)}</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell><strong>Arm Metrics</strong></TableCell>
                  <TableCell></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ pl: 4 }}>Arm Deviation Left</TableCell>
                  <TableCell align="right">{formatNum(metrics.armDeviationLeft, 4)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ pl: 4 }}>Arm Deviation Right</TableCell>
                  <TableCell align="right">{formatNum(metrics.armDeviationRight, 4)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ pl: 4 }}>Arm Asymmetry Ratio</TableCell>
                  <TableCell align="right">{formatNum(metrics.armAsymmetryRatio, 2)}</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell><strong>Scores</strong></TableCell>
                  <TableCell></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ pl: 4 }}>Stability Score</TableCell>
                  <TableCell align="right">{formatNum(metrics.stabilityScore, 1)} / 100</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ pl: 4 }}>LTAD Duration Score</TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${metrics.durationScore} - ${metrics.durationScoreLabel}`}
                      color="primary"
                      size="small"
                    />
                  </TableCell>
                </TableRow>
                {metrics.ageExpectation && (
                  <TableRow>
                    <TableCell sx={{ pl: 4 }}>Age Expectation</TableCell>
                    <TableCell align="right">
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
