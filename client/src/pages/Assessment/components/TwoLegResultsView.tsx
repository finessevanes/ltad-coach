import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Chip,
  Alert,
  Button,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import { Assessment } from '../../../types/assessment';
import { Athlete } from '../../../types/athlete';
import { VideoPlayer } from '../../../components/VideoPlayer';

interface TwoLegResultsViewProps {
  assessment: Assessment;
  athlete: Athlete;
}

export const TwoLegResultsView: React.FC<TwoLegResultsViewProps> = ({
  assessment,
  athlete,
}) => {
  const navigate = useNavigate();
  const { leftLegMetrics, rightLegMetrics, bilateralComparison } = assessment;

  if (!leftLegMetrics || !rightLegMetrics || !bilateralComparison) {
    return (
      <Alert severity="error">
        Missing bilateral data. This assessment may be corrupted.
      </Alert>
    );
  }

  const getDifferenceColor = (diffPct: number): 'success' | 'warning' | 'error' => {
    if (diffPct < 10) return 'success';
    if (diffPct < 20) return 'warning';
    return 'error';
  };

  const getSymmetryColor = (score: number): string => {
    if (score >= 85) return '#4caf50'; // green
    if (score >= 70) return '#ff9800'; // orange
    if (score >= 50) return '#ff5722'; // red-orange
    return '#f44336'; // red
  };

  const getSymmetryChipColor = (assessment: string): 'success' | 'primary' | 'warning' | 'default' => {
    if (assessment === 'excellent') return 'success';
    if (assessment === 'good') return 'primary';
    if (assessment === 'fair') return 'warning';
    return 'default';
  };

  // Format date
  const formattedDate = new Date(assessment.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <div>
            <Typography variant="h5">Bilateral Balance Assessment</Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {athlete.name} • {formattedDate}
            </Typography>
          </div>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/athletes')}
          >
            Back
          </Button>
        </Box>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Left Leg Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Standing on Left Leg
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                (Right foot raised)
              </Typography>
              <Typography variant="h3">{leftLegMetrics.holdTime.toFixed(1)}s</Typography>
              <Chip
                label={`Score: ${leftLegMetrics.durationScore}/5`}
                color={leftLegMetrics.durationScore >= 4 ? 'success' : 'default'}
                sx={{ mt: 1 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Sway: {leftLegMetrics.swayVelocity.toFixed(2)} cm/s
                <br />
                Corrections: {leftLegMetrics.correctionsCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Symmetry Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ textAlign: 'center' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Symmetry Analysis
              </Typography>
              <Typography variant="h3" sx={{ color: getSymmetryColor(bilateralComparison.overallSymmetryScore) }}>
                {bilateralComparison.overallSymmetryScore.toFixed(0)}/100
              </Typography>
              <LinearProgress
                variant="determinate"
                value={bilateralComparison.overallSymmetryScore}
                sx={{
                  mt: 2,
                  height: 10,
                  borderRadius: 5,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getSymmetryColor(bilateralComparison.overallSymmetryScore),
                  },
                }}
              />
              <Chip
                label={bilateralComparison.symmetryAssessment.toUpperCase()}
                color={getSymmetryChipColor(bilateralComparison.symmetryAssessment)}
                sx={{ mt: 2 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Dominant: {bilateralComparison.dominantLeg === 'balanced' ? 'Balanced' : `${bilateralComparison.dominantLeg} leg`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Leg Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="secondary" gutterBottom>
                Standing on Right Leg
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                (Left foot raised)
              </Typography>
              <Typography variant="h3">{rightLegMetrics.holdTime.toFixed(1)}s</Typography>
              <Chip
                label={`Score: ${rightLegMetrics.durationScore}/5`}
                color={rightLegMetrics.durationScore >= 4 ? 'success' : 'default'}
                sx={{ mt: 1 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Sway: {rightLegMetrics.swayVelocity.toFixed(2)} cm/s
                <br />
                Corrections: {rightLegMetrics.correctionsCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Video Comparison */}
      {(assessment.leftLegVideoUrl || assessment.rightLegVideoUrl) && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Video Comparison
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Standing on Left Leg (Right foot raised)
                </Typography>
                {assessment.leftLegVideoUrl ? (
                  <VideoPlayer
                    videoUrl={assessment.leftLegVideoUrl}
                    videoId={`${assessment.id}-left`}
                    label="Left Leg Support"
                  />
                ) : (
                  <Alert severity="info">Video not available</Alert>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="secondary" gutterBottom>
                  Standing on Right Leg (Left foot raised)
                </Typography>
                {assessment.rightLegVideoUrl ? (
                  <VideoPlayer
                    videoUrl={assessment.rightLegVideoUrl}
                    videoId={`${assessment.id}-right`}
                    label="Right Leg Support"
                  />
                ) : (
                  <Alert severity="info">Video not available</Alert>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Metrics Comparison Table */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Detailed Comparison
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Metric</TableCell>
                  <TableCell align="right">Left Support<br/><Typography variant="caption">(Right raised)</Typography></TableCell>
                  <TableCell align="right">Right Support<br/><Typography variant="caption">(Left raised)</Typography></TableCell>
                  <TableCell align="right">Difference</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Hold Time</TableCell>
                  <TableCell align="right">{leftLegMetrics.holdTime.toFixed(1)}s</TableCell>
                  <TableCell align="right">{rightLegMetrics.holdTime.toFixed(1)}s</TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${bilateralComparison.holdTimeDifference.toFixed(1)}s (${bilateralComparison.holdTimeDifferencePct.toFixed(1)}%)`}
                      size="small"
                      color={getDifferenceColor(bilateralComparison.holdTimeDifferencePct)}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Sway Velocity</TableCell>
                  <TableCell align="right">{leftLegMetrics.swayVelocity.toFixed(2)} cm/s</TableCell>
                  <TableCell align="right">{rightLegMetrics.swayVelocity.toFixed(2)} cm/s</TableCell>
                  <TableCell align="right">
                    {bilateralComparison.swayVelocityDifference.toFixed(2)} cm/s
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Corrections</TableCell>
                  <TableCell align="right">{leftLegMetrics.correctionsCount}</TableCell>
                  <TableCell align="right">{rightLegMetrics.correctionsCount}</TableCell>
                  <TableCell align="right">
                    {bilateralComparison.correctionsCountDifference > 0 ? '+' : ''}
                    {bilateralComparison.correctionsCountDifference}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Arm Angle (Avg)</TableCell>
                  <TableCell align="right">
                    {((leftLegMetrics.armAngleLeft + leftLegMetrics.armAngleRight) / 2).toFixed(1)}°
                  </TableCell>
                  <TableCell align="right">
                    {((rightLegMetrics.armAngleLeft + rightLegMetrics.armAngleRight) / 2).toFixed(1)}°
                  </TableCell>
                  <TableCell align="right">
                    {bilateralComparison.armAngleDifference.toFixed(1)}°
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Sway Std X</TableCell>
                  <TableCell align="right">{leftLegMetrics.swayStdX.toFixed(2)} cm</TableCell>
                  <TableCell align="right">{rightLegMetrics.swayStdX.toFixed(2)} cm</TableCell>
                  <TableCell align="right">
                    {Math.abs(leftLegMetrics.swayStdX - rightLegMetrics.swayStdX).toFixed(2)} cm
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Sway Std Y</TableCell>
                  <TableCell align="right">{leftLegMetrics.swayStdY.toFixed(2)} cm</TableCell>
                  <TableCell align="right">{rightLegMetrics.swayStdY.toFixed(2)} cm</TableCell>
                  <TableCell align="right">
                    {Math.abs(leftLegMetrics.swayStdY - rightLegMetrics.swayStdY).toFixed(2)} cm
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Sway Path Length</TableCell>
                  <TableCell align="right">{leftLegMetrics.swayPathLength.toFixed(2)} cm</TableCell>
                  <TableCell align="right">{rightLegMetrics.swayPathLength.toFixed(2)} cm</TableCell>
                  <TableCell align="right">
                    {Math.abs(leftLegMetrics.swayPathLength - rightLegMetrics.swayPathLength).toFixed(2)} cm
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* AI Bilateral Feedback */}
      {assessment.aiCoachAssessment && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Coach AI Assessment
            </Typography>
            <Box sx={{ '& p': { mb: 2 }, '& ul': { pl: 3 }, '& li': { mb: 1 } }}>
              <ReactMarkdown>{assessment.aiCoachAssessment}</ReactMarkdown>
            </Box>
          </CardContent>
        </Card>
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
    </Box>
  );
};
