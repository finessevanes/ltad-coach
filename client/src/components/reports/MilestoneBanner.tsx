import { Box, Typography, Paper } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Milestone } from '../../services/reports';

interface MilestoneBannerProps {
  milestones: Milestone[];
}

/**
 * Celebratory banner for athlete achievements.
 * Uses Energy Orange (#F97316) accent per design system.
 */
export function MilestoneBanner({ milestones }: MilestoneBannerProps) {
  if (milestones.length === 0) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {milestones.map((milestone, index) => (
        <Paper
          key={index}
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
            border: '1px solid #FDBA74',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              backgroundColor: '#FFF7ED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #F97316',
            }}
          >
            {milestone.type === 'twenty_seconds' ? (
              <EmojiEventsIcon sx={{ color: '#F97316', fontSize: 28 }} />
            ) : (
              <TrendingUpIcon sx={{ color: '#F97316', fontSize: 28 }} />
            )}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{
                color: '#EA580C',
                fontWeight: 600,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                mb: 0.5,
              }}
            >
              Milestone Reached!
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#2D2D2D',
                fontWeight: 500,
              }}
            >
              {milestone.message}
            </Typography>
          </Box>
        </Paper>
      ))}
    </Box>
  );
}
