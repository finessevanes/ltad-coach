import { Box, Typography, Paper, Chip, Grid } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { ProgressSnapshot } from '../../services/reports';

interface ProgressSnapshotCardProps {
  snapshot: ProgressSnapshot;
}

/**
 * Get LTAD score color based on score (1-5).
 * Per design system score color system.
 */
function getScoreColor(score: number): string {
  switch (score) {
    case 1:
      return '#EF4444'; // Red - Beginning
    case 2:
      return '#F59E0B'; // Orange - Developing
    case 3:
      return '#FB923C'; // Light Orange - Competent
    case 4:
      return '#34D399'; // Light Green - Proficient
    case 5:
      return '#10B981'; // Green - Advanced
    default:
      return '#6B6B6B';
  }
}

/**
 * Get LTAD score label based on score (1-5).
 */
function getScoreLabel(score: number): string {
  switch (score) {
    case 1:
      return 'Beginning';
    case 2:
      return 'Developing';
    case 3:
      return 'Competent';
    case 4:
      return 'Proficient';
    case 5:
      return 'Advanced';
    default:
      return 'Unknown';
  }
}

/**
 * Side-by-side comparison card showing "Started" vs "Current".
 * Uses Athletic Blue (#2563EB) for current values.
 */
export function ProgressSnapshotCard({ snapshot }: ProgressSnapshotCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        borderRadius: 3,
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E5E5',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          color: '#2D2D2D',
          mb: 3,
          fontSize: '1.125rem',
        }}
      >
        Progress Snapshot
      </Typography>

      <Grid container spacing={3} alignItems="center">
        {/* Started Column */}
        <Grid item xs={5}>
          <Box
            sx={{
              p: 3,
              borderRadius: 2,
              backgroundColor: '#F5F5F5',
              textAlign: 'center',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: '#6B6B6B',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Started
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: '#6B6B6B', mt: 0.5, mb: 2 }}
            >
              {snapshot.startedDate}
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: '#2D2D2D',
                mb: 1,
              }}
            >
              {snapshot.startedDuration.toFixed(1)}s
            </Typography>
            <Chip
              label={getScoreLabel(snapshot.startedScore)}
              size="small"
              sx={{
                backgroundColor: `${getScoreColor(snapshot.startedScore)}20`,
                color: getScoreColor(snapshot.startedScore),
                fontWeight: 600,
              }}
            />
          </Box>
        </Grid>

        {/* Arrow */}
        <Grid item xs={2}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <ArrowForwardIcon sx={{ color: '#6B6B6B', fontSize: 32 }} />
          </Box>
        </Grid>

        {/* Current Column */}
        <Grid item xs={5}>
          <Box
            sx={{
              p: 3,
              borderRadius: 2,
              backgroundColor: '#EFF6FF',
              textAlign: 'center',
              border: '2px solid #2563EB',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: '#2563EB',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Current
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: '#2563EB', mt: 0.5, mb: 2 }}
            >
              {snapshot.currentDate}
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: '#2563EB',
                mb: 1,
              }}
            >
              {snapshot.currentDuration.toFixed(1)}s
            </Typography>
            <Chip
              label={getScoreLabel(snapshot.currentScore)}
              size="small"
              sx={{
                backgroundColor: `${getScoreColor(snapshot.currentScore)}20`,
                color: getScoreColor(snapshot.currentScore),
                fontWeight: 600,
              }}
            />
          </Box>
        </Grid>
      </Grid>

      {/* Improvement indicator */}
      {snapshot.currentDuration > snapshot.startedDuration && (
        <Box
          sx={{
            mt: 3,
            pt: 2,
            borderTop: '1px solid #E5E5E5',
            textAlign: 'center',
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: '#10B981', fontWeight: 600 }}
          >
            +{(snapshot.currentDuration - snapshot.startedDuration).toFixed(1)}s improvement
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
