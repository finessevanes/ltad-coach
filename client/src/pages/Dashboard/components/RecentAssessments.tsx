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
} from '@mui/material';
import { Assessment as AssessmentIcon, ArrowForward } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface AssessmentListItem {
  id: string;
  athleteId: string;
  athleteName: string;
  testType: string;
  legTested: string;
  createdAt: string;
  status: string;
  durationSeconds?: number;
  stabilityScore?: number;
}

interface RecentAssessmentsProps {
  assessments: AssessmentListItem[];
  loading?: boolean;
}

export const RecentAssessments: React.FC<RecentAssessmentsProps> = ({
  assessments,
}) => {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" component="h2">
            Recent Assessments
          </Typography>
          <Button
            size="small"
            endIcon={<ArrowForward />}
            onClick={() => navigate('/assessments')}
          >
            View All
          </Button>
        </Box>

        {assessments.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <AssessmentIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              No assessments yet. Start testing your athletes!
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {assessments.map((assessment, index) => (
              <Box key={assessment.id}>
                {index > 0 && <Divider />}
                <ListItem
                  sx={{
                    px: 0,
                    py: 2,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      borderRadius: 1,
                    },
                  }}
                  onClick={() => navigate(`/assessments/${assessment.id}`)}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <AssessmentIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight={600}>
                          {assessment.athleteName}
                        </Typography>
                        <Chip
                          label={assessment.status}
                          size="small"
                          color={getStatusColor(assessment.status) as any}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          One-Leg Balance
                        </Typography>
                        {assessment.durationSeconds !== undefined && (
                          <>
                            <Typography variant="body2" color="text.secondary">
                              •
                            </Typography>
                            <Typography variant="body2" fontWeight={600} color="primary.main">
                              {assessment.durationSeconds.toFixed(1)}s
                            </Typography>
                          </>
                        )}
                        <Typography variant="body2" color="text.secondary">
                          • {formatDate(assessment.createdAt)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              </Box>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};
