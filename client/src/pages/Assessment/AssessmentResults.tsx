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
  TableHead,
  TableRow,
  Chip,
  Divider,
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

  const { metrics, clientMetrics } = assessment;

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

  // Helper to calculate difference
  const calcDiff = (client: number | undefined, backend: number | undefined): string => {
    if (client === undefined || backend === undefined) return '-';
    const diff = Math.abs(client - backend);
    return diff.toFixed(3);
  };

  // Comparison rows for metrics that exist on both sides
  const comparisonRows = [
    {
      metric: 'Hold Time (s)',
      client: clientMetrics?.holdTime,
      backend: metrics?.holdTime,
      formatDecimals: 2,
    },
    {
      metric: 'Result',
      client: clientMetrics?.success !== undefined ? (clientMetrics.success ? 'PASS' : 'FAIL') : undefined,
      backend: assessment.failureReason ? 'FAIL' : metrics ? 'PASS' : undefined,
      isText: true,
    },
    {
      metric: 'Failure Reason',
      client: clientMetrics?.failureReason || '-',
      backend: assessment.failureReason || '-',
      isText: true,
    },
  ];

  const armDeviationRows = [
    {
      metric: 'Arm Deviation Left',
      client: clientMetrics?.armDeviationLeft,
      backend: metrics?.armDeviationLeft,
      formatDecimals: 4,
    },
    {
      metric: 'Arm Deviation Right',
      client: clientMetrics?.armDeviationRight,
      backend: metrics?.armDeviationRight,
      formatDecimals: 4,
    },
  ];

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
            <Typography variant="body2" color="text.secondary">Status</Typography>
            <Chip
              label={assessment.status}
              color={assessment.status === 'completed' ? 'success' : assessment.status === 'failed' ? 'error' : 'warning'}
              size="small"
            />
          </Box>
        </Box>
      </Paper>

      {/* Metrics Comparison */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Metrics Comparison
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Client metrics are calculated in real-time during recording. Backend metrics are calculated from the uploaded video.
        </Typography>

        {!clientMetrics && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No client-side metrics available for this assessment.
          </Alert>
        )}

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Metric</strong></TableCell>
                <TableCell align="right"><strong>Client</strong></TableCell>
                <TableCell align="right"><strong>Backend</strong></TableCell>
                <TableCell align="right"><strong>Difference</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {comparisonRows.map((row) => (
                <TableRow key={row.metric}>
                  <TableCell>{row.metric}</TableCell>
                  <TableCell align="right">
                    {row.isText ? (
                      row.client === 'PASS' ? (
                        <Chip icon={<CheckCircleIcon />} label="PASS" color="success" size="small" />
                      ) : row.client === 'FAIL' ? (
                        <Chip icon={<CancelIcon />} label="FAIL" color="error" size="small" />
                      ) : (
                        row.client || '-'
                      )
                    ) : (
                      formatNum(row.client as number, row.formatDecimals)
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {row.isText ? (
                      row.backend === 'PASS' ? (
                        <Chip icon={<CheckCircleIcon />} label="PASS" color="success" size="small" />
                      ) : row.backend === 'FAIL' ? (
                        <Chip icon={<CancelIcon />} label="FAIL" color="error" size="small" />
                      ) : (
                        row.backend || '-'
                      )
                    ) : (
                      formatNum(row.backend as number, row.formatDecimals)
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {row.isText ? '-' : calcDiff(row.client as number, row.backend as number)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider sx={{ my: 3 }} />

        <Typography variant="subtitle1" gutterBottom>
          Arm Deviation (same algorithm - should match closely)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Values = wrist.y - shoulder.y (normalized coords). Positive = wrist below shoulder.
        </Typography>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Metric</strong></TableCell>
                <TableCell align="right"><strong>Client</strong></TableCell>
                <TableCell align="right"><strong>Backend</strong></TableCell>
                <TableCell align="right"><strong>Difference</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {armDeviationRows.map((row) => (
                <TableRow key={row.metric}>
                  <TableCell>{row.metric}</TableCell>
                  <TableCell align="right">{formatNum(row.client, row.formatDecimals)}</TableCell>
                  <TableCell align="right">{formatNum(row.backend, row.formatDecimals)}</TableCell>
                  <TableCell align="right">{calcDiff(row.client, row.backend)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Backend-Only Metrics */}
      {metrics && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Backend-Only Metrics
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            These metrics are only calculated server-side from video analysis.
          </Typography>

          <TableContainer>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell>Stability Score</TableCell>
                  <TableCell align="right">{formatNum(metrics.stabilityScore, 1)} / 100</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Sway Std X</TableCell>
                  <TableCell align="right">{formatNum(metrics.swayStdX, 6)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Sway Std Y</TableCell>
                  <TableCell align="right">{formatNum(metrics.swayStdY, 6)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Sway Path Length</TableCell>
                  <TableCell align="right">{formatNum(metrics.swayPathLength, 6)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Sway Velocity</TableCell>
                  <TableCell align="right">{formatNum(metrics.swayVelocity, 6)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Arm Asymmetry Ratio</TableCell>
                  <TableCell align="right">{formatNum(metrics.armAsymmetryRatio, 2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Corrections Count</TableCell>
                  <TableCell align="right">{metrics.correctionsCount}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>LTAD Duration Score</TableCell>
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
                    <TableCell>Age Expectation</TableCell>
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
