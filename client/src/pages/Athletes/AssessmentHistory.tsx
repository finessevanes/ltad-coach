import {
  Typography,
  Box,
  List,
  ListItem,
  ListItemButton,
} from '@mui/material';

interface AssessmentListItem {
  id: string;
  athleteId: string;
  athleteName: string;
  testType: string;
  legTested: string;
  createdAt: string;
  status: string;
  durationSeconds?: number;
  leftLegHoldTime?: number;
  rightLegHoldTime?: number;
}

interface AssessmentHistoryProps {
  assessments: AssessmentListItem[];
  onAssessmentClick: (id: string) => void;
}

const SCORE_COLORS: Record<number, string> = {
  1: '#EF4444', // Red
  2: '#F59E0B', // Orange
  3: '#FB923C', // Light Orange
  4: '#34D399', // Light Green
  5: '#10B981', // Green
};

const SCORE_BG_COLORS: Record<number, string> = {
  1: '#FEE2E2',
  2: '#FEF3C7',
  3: '#FED7AA',
  4: '#D1FAE5',
  5: '#ECFDF5',
};

function getScore(duration: number): number {
  if (duration >= 25) return 5;
  if (duration >= 20) return 4;
  if (duration >= 15) return 3;
  if (duration >= 10) return 2;
  return 1;
}

export function AssessmentHistory({ assessments, onAssessmentClick }: AssessmentHistoryProps) {
  if (assessments.length === 0) {
    return (
      <Box py={4} textAlign="center">
        <Typography color="text.secondary">
          No assessments yet
        </Typography>
      </Box>
    );
  }

  return (
    <List
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      {assessments.map((assessment) => {
        const score = assessment.durationSeconds
          ? getScore(assessment.durationSeconds)
          : null;
        const scoreColor = score ? SCORE_COLORS[score] : '#6B6B6B';
        const scoreBgColor = score ? SCORE_BG_COLORS[score] : '#F5F5F5';

        return (
          <ListItem key={assessment.id} disablePadding>
            <ListItemButton
              onClick={() => onAssessmentClick(assessment.id)}
              sx={{
                borderRadius: 1,
                py: 2,
                px: 2,
                bgcolor: 'white',
                border: '1px solid',
                borderColor: 'grey.200',
                borderLeft: '4px solid',
                borderLeftColor: scoreColor,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                '&:hover': {
                  bgcolor: 'grey.50',
                },
              }}
            >
              {/* Left side: Test info */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                  One-Leg Balance Test
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                  {new Date(assessment.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  {' • '}
                  <span style={{ textTransform: 'capitalize' }}>{assessment.legTested} Leg</span>
                </Typography>
              </Box>

              {/* Right side: Duration and Score */}
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                {assessment.durationSeconds && (
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      Duration
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {assessment.durationSeconds.toFixed(1)}s
                    </Typography>
                  </Box>
                )}
                {score && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: scoreBgColor,
                      borderRadius: 1,
                      px: 2,
                      py: 1,
                      minWidth: 60,
                    }}
                  >
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: scoreColor,
                      }}
                    >
                      {score}
                    </Typography>
                  </Box>
                )}
              </Box>
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
}
