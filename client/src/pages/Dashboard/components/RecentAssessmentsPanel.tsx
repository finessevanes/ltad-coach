import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Box,
  Chip,
  Button,
  Divider,
  Skeleton,
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BarChartIcon from '@mui/icons-material/BarChart';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';
import { formatRelativeTime } from '../../../utils/dateUtils';

interface AssessmentListItem {
  id: string;
  athleteId: string;
  athleteName: string;
  testType: string;
  legTested: string;
  createdAt: string;
  status: string;
  durationSeconds?: number;
}

interface RecentAssessmentsPanelProps {
  assessments: AssessmentListItem[];
  loading?: boolean;
}

export function RecentAssessmentsPanel({
  assessments,
  loading = false,
}: RecentAssessmentsPanelProps) {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Card
        sx={{
          height: '100%',
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'grey.100',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Header Skeleton */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Skeleton variant="text" width={180} height={32} />
            <Skeleton variant="rectangular" width={90} height={28} sx={{ borderRadius: 2 }} />
          </Box>

          {/* Assessment List Skeleton */}
          <List sx={{ p: 0 }}>
            {[1, 2, 3].map((i) => (
              <Box key={i}>
                {i > 1 && <Divider sx={{ my: 1 }} />}
                <ListItem sx={{ px: 1, py: 1.5 }}>
                  <ListItemAvatar>
                    <Skeleton variant="circular" width={40} height={40} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Skeleton variant="text" width={120} height={24} />
                        <Skeleton variant="rectangular" width={80} height={20} sx={{ borderRadius: 2 }} />
                      </Box>
                    }
                    secondary={
                      <Skeleton variant="text" width="80%" height={20} sx={{ mt: 0.5 }} />
                    }
                  />
                </ListItem>
              </Box>
            ))}
          </List>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'grey.100',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Recent Assessments
          </Typography>
          <Button
            size="small"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/assessments')}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              color: 'primary.main',
            }}
          >
            View All
          </Button>
        </Box>

        {/* Empty State */}
        {assessments.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 6,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <BarChartIcon
              sx={{ fontSize: 64, color: 'grey.300', mb: 2 }}
            />
            <Typography variant="body1" color="text.secondary">
              No assessments yet. Start testing your athletes!
            </Typography>
          </Box>
        ) : (
          /* Assessment List */
          <List sx={{ p: 0 }}>
            {assessments.slice(0, 5).map((assessment, index) => (
              <Box key={assessment.id}>
                {index > 0 && <Divider sx={{ my: 1 }} />}
                <ListItem
                  sx={{
                    px: 1,
                    py: 1.5,
                    cursor: 'pointer',
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                  onClick={() => navigate(`/assessments/${assessment.id}`)}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: 'primary.light',
                        color: 'primary.main',
                      }}
                    >
                      <AssessmentIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        <Typography
                          variant="body1"
                          component="span"
                          sx={{ fontWeight: 600 }}
                        >
                          {assessment.athleteName}
                        </Typography>
                        <Chip
                          label={assessment.status}
                          size="small"
                          color={getStatusColor(assessment.status) as any}
                          sx={{
                            textTransform: 'capitalize',
                            borderRadius: 2,
                            fontWeight: 500,
                            fontSize: '0.7rem',
                          }}
                        />
                      </Box>
                    }
                    primaryTypographyProps={{ component: 'div' }}
                    secondary={
                      <Box
                        component="span"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          mt: 0.5,
                        }}
                      >
                        <Typography
                          variant="body2"
                          component="span"
                          color="text.secondary"
                        >
                          Balance Test
                        </Typography>
                        {assessment.durationSeconds !== undefined && (
                          <>
                            <Typography
                              variant="body2"
                              component="span"
                              color="text.secondary"
                            >
                              •
                            </Typography>
                            <Typography
                              variant="body2"
                              component="span"
                              sx={{ fontWeight: 600, color: 'primary.main' }}
                            >
                              {assessment.durationSeconds.toFixed(1)}s
                            </Typography>
                          </>
                        )}
                        <Typography
                          variant="body2"
                          component="span"
                          color="text.secondary"
                        >
                          • {formatRelativeTime(assessment.createdAt)}
                        </Typography>
                      </Box>
                    }
                    secondaryTypographyProps={{ component: 'div' }}
                  />
                </ListItem>
              </Box>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
