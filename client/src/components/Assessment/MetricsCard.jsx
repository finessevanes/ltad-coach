import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Divider,
  Collapse,
  Button,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Timer as TimerIcon,
  ShowChart as ShowChartIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import ScoreBadge from './ScoreBadge';

const MetricItem = ({ icon: Icon, label, value, unit, color = 'text.primary' }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
    {Icon && <Icon sx={{ color: 'primary.main', fontSize: 20 }} />}
    <Box sx={{ flex: 1 }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
        {label}
      </Typography>
      <Typography variant="h6" color={color} sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
        {value} {unit && <span style={{ fontSize: '0.9em', fontWeight: 400 }}>{unit}</span>}
      </Typography>
    </Box>
  </Box>
);

const MetricsCard = ({ metrics, teamRank }) => {
  const [expanded, setExpanded] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!metrics) {
    return (
      <Card>
        <CardContent>
          <Typography>No metrics available</Typography>
        </CardContent>
      </Card>
    );
  }

  const {
    durationSeconds,
    stabilityScore,
    swayVelocity,
    swayStdX,
    swayStdY,
    swayPathLength,
    armExcursionLeft,
    armExcursionRight,
    armAsymmetryRatio,
    correctionsCount,
    failureReason,
    durationScore,
    percentile,
  } = metrics;

  const formatDuration = (seconds) => {
    if (!seconds) return '0.0s';
    return `${seconds.toFixed(1)}s`;
  };

  const getFailureReasonText = (reason) => {
    const reasons = {
      'foot_touchdown': 'Foot touched down',
      'hands_on_hips': 'Hands removed from hips',
      'time_limit': 'Reached time limit',
      'other': 'Other reason',
    };
    return reasons[reason] || reason;
  };

  return (
    <Card
      sx={{
        height: '100%',
        transition: 'all 0.3s ease-in-out',
      }}
      data-testid="metrics-card"
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
          Assessment Metrics
        </Typography>

        <Grid container spacing={3}>
          {/* Score Badge */}
          {durationScore && (
            <Grid item xs={12} md={4}>
              <ScoreBadge durationScore={durationScore} />
            </Grid>
          )}

          {/* Primary Metrics */}
          <Grid item xs={12} md={durationScore ? 8 : 12}>
            <Box sx={{ mb: 2 }}>
              <MetricItem
                icon={TimerIcon}
                label="Duration"
                value={formatDuration(durationSeconds)}
                color="primary.main"
              />

              {stabilityScore !== undefined && (
                <MetricItem
                  icon={ShowChartIcon}
                  label="Stability Score"
                  value={stabilityScore}
                  unit="%"
                  color={stabilityScore >= 70 ? 'success.main' : stabilityScore >= 50 ? 'warning.main' : 'error.main'}
                />
              )}

              {percentile !== undefined && (
                <MetricItem
                  icon={TrendingUpIcon}
                  label="Percentile Rank"
                  value={percentile}
                  unit="th"
                  color="info.main"
                />
              )}

              {teamRank && (
                <Box sx={{ mt: 2, p: 2, backgroundColor: 'primary.light', borderRadius: 2, color: 'primary.contrastText' }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    Team Ranking
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                    #{teamRank.rank} of {teamRank.totalAthletes}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                    {teamRank.percentile}th percentile
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>

          {/* Detailed Quality Metrics */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Button
              fullWidth
              onClick={() => setExpanded(!expanded)}
              endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ justifyContent: 'space-between', fontSize: { xs: '0.85rem', sm: '0.9375rem' } }}
            >
              {expanded ? 'Hide' : 'View'} Detailed Quality Metrics
            </Button>

            <Collapse in={expanded}>
              <Box sx={{ mt: 3 }}>
                <Grid container spacing={2}>
                  {swayVelocity !== undefined && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Sway Velocity</Typography>
                      <Typography variant="body1" fontWeight={600}>{swayVelocity.toFixed(2)} cm/s</Typography>
                    </Grid>
                  )}

                  {swayStdX !== undefined && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Sway Std X</Typography>
                      <Typography variant="body1" fontWeight={600}>{swayStdX.toFixed(3)} m</Typography>
                    </Grid>
                  )}

                  {swayStdY !== undefined && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Sway Std Y</Typography>
                      <Typography variant="body1" fontWeight={600}>{swayStdY.toFixed(3)} m</Typography>
                    </Grid>
                  )}

                  {swayPathLength !== undefined && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Sway Path Length</Typography>
                      <Typography variant="body1" fontWeight={600}>{swayPathLength.toFixed(1)} cm</Typography>
                    </Grid>
                  )}

                  {armExcursionLeft !== undefined && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Left Arm Excursion</Typography>
                      <Typography variant="body1" fontWeight={600}>{(armExcursionLeft * 100).toFixed(1)}%</Typography>
                    </Grid>
                  )}

                  {armExcursionRight !== undefined && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Right Arm Excursion</Typography>
                      <Typography variant="body1" fontWeight={600}>{(armExcursionRight * 100).toFixed(1)}%</Typography>
                    </Grid>
                  )}

                  {armAsymmetryRatio !== undefined && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Arm Asymmetry Ratio</Typography>
                      <Typography variant="body1" fontWeight={600}>{armAsymmetryRatio.toFixed(2)}</Typography>
                    </Grid>
                  )}

                  {correctionsCount !== undefined && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Balance Corrections</Typography>
                      <Typography variant="body1" fontWeight={600}>{correctionsCount}</Typography>
                    </Grid>
                  )}

                  {failureReason && (
                    <Grid item xs={12}>
                      <Chip
                        icon={<WarningIcon />}
                        label={`Test ended: ${getFailureReasonText(failureReason)}`}
                        color="warning"
                        sx={{ mt: 1 }}
                      />
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Collapse>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default MetricsCard;
