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
                        <Typography variant="body1" component="span" fontWeight={600}>
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
                    primaryTypographyProps={{ component: 'div' }}
                    secondary={
                      <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Typography variant="body2" component="span" color="text.secondary">
                          One-Leg Balance
                        </Typography>
                        {assessment.durationSeconds !== undefined && (
                          <>
                            <Typography variant="body2" component="span" color="text.secondary">
                              •
                            </Typography>
                            <Typography variant="body2" component="span" fontWeight={600} color="primary.main">
                              {assessment.durationSeconds.toFixed(1)}s
                            </Typography>
                          </>
                        )}
                        <Typography variant="body2" component="span" color="text.secondary">
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
};
