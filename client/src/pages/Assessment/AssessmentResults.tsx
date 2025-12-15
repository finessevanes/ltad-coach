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
import ReactMarkdown from 'react-markdown';
import assessmentsService from '../../services/assessments';
import athletesService from '../../services/athletes';
import { Assessment } from '../../types/assessment';
import { Athlete } from '../../types/athlete';
import { TwoLegResultsView } from './components/TwoLegResultsView';

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
        console.error('[AssessmentResults] No assessment ID provided');
        setError('No assessment ID provided');
        setLoading(false);
        return;
      }

      console.log('[AssessmentResults] Fetching assessment:', assessmentId);

      try {
        const assessmentData = await assessmentsService.getById(assessmentId);
        console.log('[AssessmentResults] Assessment fetched:', {
          id: assessmentData.id,
          legTested: assessmentData.legTested,
          hasMetrics: !!assessmentData.metrics,
          hasLeftLegMetrics: !!assessmentData.leftLegMetrics,
          hasRightLegMetrics: !!assessmentData.rightLegMetrics,
          hasBilateralComparison: !!assessmentData.bilateralComparison,
          status: assessmentData.status,
        });

        // Log detailed structure for bilateral assessments
        if (assessmentData.legTested === 'both') {
          console.log('[AssessmentResults] Bilateral assessment data structure:', {
            leftLegMetricsKeys: assessmentData.leftLegMetrics ? Object.keys(assessmentData.leftLegMetrics) : 'null',
            rightLegMetricsKeys: assessmentData.rightLegMetrics ? Object.keys(assessmentData.rightLegMetrics) : 'null',
            bilateralComparisonKeys: assessmentData.bilateralComparison ? Object.keys(assessmentData.bilateralComparison) : 'null',
          });
        }

        setAssessment(assessmentData);

        // Fetch athlete info
        const athleteData = await athletesService.getById(assessmentData.athleteId);
        console.log('[AssessmentResults] Athlete fetched:', athleteData.name);
        setAthlete(athleteData);
      } catch (err: any) {
        console.error('[AssessmentResults] Failed to fetch data:', err);
        console.error('[AssessmentResults] Error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        });
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

  // Routing logic: bilateral vs single-leg
  if (!athlete) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Athlete not found</Alert>
      </Container>
    );
  }

  const isBilateralAssessment = assessment.legTested === 'both';
  const hasBilateralData = Boolean(
    assessment.leftLegMetrics &&
    assessment.rightLegMetrics &&
    assessment.bilateralComparison
  );

  console.log('[AssessmentResults] Bilateral check:', {
    isBilateralAssessment,
    hasBilateralData,
    hasLeftLegMetrics: !!assessment.leftLegMetrics,
    hasRightLegMetrics: !!assessment.rightLegMetrics,
    hasBilateralComparison: !!assessment.bilateralComparison,
  });

  // Render bilateral view
  if (isBilateralAssessment) {
    if (!hasBilateralData) {
      console.error('[AssessmentResults] Bilateral assessment missing required data:', {
        assessmentId: assessment.id,
        legTested: assessment.legTested,
        leftLegMetrics: assessment.leftLegMetrics ? 'present' : 'MISSING',
        rightLegMetrics: assessment.rightLegMetrics ? 'present' : 'MISSING',
        bilateralComparison: assessment.bilateralComparison ? 'present' : 'MISSING',
        allKeys: Object.keys(assessment),
      });

      return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Alert severity="error">
            <Typography variant="subtitle2" gutterBottom>
              This assessment is marked as bilateral but is missing comparison data.
            </Typography>
            <Typography variant="body2" component="div" sx={{ mt: 1, fontFamily: 'monospace', fontSize: '0.875rem' }}>
              Debug info (Assessment ID: {assessment.id}):<br />
              - Left leg metrics: {assessment.leftLegMetrics ? '✓ Present' : '✗ MISSING'}<br />
              - Right leg metrics: {assessment.rightLegMetrics ? '✓ Present' : '✗ MISSING'}<br />
              - Bilateral comparison: {assessment.bilateralComparison ? '✓ Present' : '✗ MISSING'}<br />
              <br />
              Please check the browser console for detailed logs and contact support.
            </Typography>
          </Alert>
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

    return <TwoLegResultsView assessment={assessment} athlete={athlete} />;
  }

  // Render single-leg view (existing code below)
  // Use metrics (from backend) - all in real-world units (cm, degrees)
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
  const failureReason = metrics?.failureReason;

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
                  {metrics.durationScore}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  LTAD Score
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

      {/* Detailed Metrics Table */}
      {metrics && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Detailed Metrics
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            All metrics in real-world units (cm, degrees)
          </Typography>

          <TableContainer>
            <Table size="small">
              <TableBody>
                {/* Sway Metrics Header */}
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell><strong>Sway Metrics</strong></TableCell>
                  <TableCell align="right"><strong>Value</strong></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ pl: 2 }}>Sway Std X</TableCell>
                  <TableCell align="right">{formatNum(metrics.swayStdX, 2)} cm</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ pl: 2 }}>Sway Std Y</TableCell>
                  <TableCell align="right">{formatNum(metrics.swayStdY, 2)} cm</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ pl: 2 }}>Sway Path Length</TableCell>
                  <TableCell align="right">{formatNum(metrics.swayPathLength, 2)} cm</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ pl: 2 }}>Sway Velocity</TableCell>
                  <TableCell align="right">{formatNum(metrics.swayVelocity, 2)} cm/s</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ pl: 2 }}>Corrections</TableCell>
                  <TableCell align="right">{metrics.correctionsCount}</TableCell>
                </TableRow>

                {/* Arm Metrics Header */}
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell><strong>Arm Metrics</strong></TableCell>
                  <TableCell align="right"><strong>Value</strong></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ pl: 2 }}>Left Arm Angle</TableCell>
                  <TableCell align="right">{formatNum(metrics.armAngleLeft, 1)}°</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ pl: 2 }}>Right Arm Angle</TableCell>
                  <TableCell align="right">{formatNum(metrics.armAngleRight, 1)}°</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ pl: 2 }}>Asymmetry Ratio</TableCell>
                  <TableCell align="right">{formatNum(metrics.armAsymmetryRatio, 2)}</TableCell>
                </TableRow>

                {/* LTAD Score Header */}
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell><strong>LTAD Score</strong></TableCell>
                  <TableCell align="right"><strong>Value</strong></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ pl: 2 }}>Duration Score</TableCell>
                  <TableCell align="right">
                    <Chip
                      label={metrics.durationScore}
                      color="primary"
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* TODO: Temporal Analysis (Fatigue Pattern) - Re-implement with segmentedMetrics timeline visualization */}

      {/* AI Coach Assessment */}
      {assessment.aiCoachAssessment && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            AI Coach Assessment
          </Typography>
          <Box sx={{ '& p': { mb: 1 }, '& ul': { pl: 2 } }}>
            <ReactMarkdown>{assessment.aiCoachAssessment}</ReactMarkdown>
          </Box>
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
