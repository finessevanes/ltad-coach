import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Chip,
  CircularProgress,
  Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useSnackbar } from '../../contexts/SnackbarContext';
import assessmentsService from '../../services/assessments';

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

export default function AssessmentsList() {
  const [assessments, setAssessments] = useState<AssessmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setLoading(true);
        const data = await assessmentsService.getAll(50);
        setAssessments(data);
      } catch (error) {
        console.error('Failed to fetch assessments:', error);
        showSnackbar('Failed to load assessments', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, [showSnackbar]);

  const handleAssessmentClick = (assessmentId: string) => {
    navigate(`/assessments/${assessmentId}`);
  };

  const handleAthleteClick = (e: React.MouseEvent, athleteId: string) => {
    e.stopPropagation();
    navigate(`/athletes/${athleteId}`);
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
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
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Empty state
  if (assessments.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" gutterBottom color="text.secondary">
            No Assessments Yet
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Start by adding athletes and conducting your first balance assessment.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/athletes')}
            sx={{ mt: 2 }}
          >
            View Athletes
          </Button>
        </Box>
      </Container>
    );
  }

  // Main content
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          All Assessments
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {assessments.length} assessment{assessments.length !== 1 ? 's' : ''} total
        </Typography>
      </Box>

      {/* Assessments Grid */}
      <Grid container spacing={2}>
        {assessments.map((assessment) => (
          <Grid item xs={12} key={assessment.id}>
            <Card>
              <CardActionArea onClick={() => handleAssessmentClick(assessment.id)}>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    {/* Athlete Name */}
                    <Grid item xs={12} sm={3}>
                      <Typography
                        variant="subtitle1"
                        component="a"
                        onClick={(e) => handleAthleteClick(e, assessment.athleteId)}
                        sx={{
                          color: 'primary.main',
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' },
                          cursor: 'pointer',
                        }}
                      >
                        {assessment.athleteName}
                      </Typography>
                    </Grid>

                    {/* Test Details */}
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        {assessment.testType === 'one_leg_balance' ? 'One-Leg Balance' : assessment.testType}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {assessment.legTested === 'left' ? 'Left Leg' : 'Right Leg'}
                      </Typography>
                    </Grid>

                    {/* Duration */}
                    <Grid item xs={12} sm={2}>
                      <Typography variant="body2" fontWeight="medium">
                        {assessment.durationSeconds
                          ? `${assessment.durationSeconds.toFixed(1)}s`
                          : 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Hold Time
                      </Typography>
                    </Grid>

                    {/* Date */}
                    <Grid item xs={12} sm={2}>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(assessment.createdAt)}
                      </Typography>
                    </Grid>

                    {/* Status */}
                    <Grid item xs={12} sm={2}>
                      <Chip
                        label={assessment.status.charAt(0).toUpperCase() + assessment.status.slice(1)}
                        color={getStatusColor(assessment.status)}
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
