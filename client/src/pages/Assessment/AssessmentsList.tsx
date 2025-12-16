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
  Skeleton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useSnackbar } from '../../contexts/SnackbarContext';
import assessmentsService from '../../services/assessments';

// Assessment type card data
interface AssessmentType {
  id: string;
  name: string;
  image: string;
  isActive: boolean;
}

const assessmentTypes: AssessmentType[] = [
  { id: 'balance', name: 'Balance Test', image: '/balance-test.jpg', isActive: true },
  { id: 'pull-up', name: 'Pull Up', image: '/pull-up.jpg', isActive: false },
  { id: 'push-up', name: 'Push Up', image: '/push-up.jpg', isActive: false },
  { id: 'squat', name: 'Squat', image: '/squat.jpg', isActive: false },
];

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

export default function AssessmentsList() {
  const [assessments, setAssessments] = useState<AssessmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [comingSoonModalOpen, setComingSoonModalOpen] = useState(false);
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    console.log('[AssessmentsList] Component mounted, initializing fetch');

    const fetchAssessments = async () => {
      try {
        console.log('[AssessmentsList] Fetch started, loading=true');
        setLoading(true);
        const data = await assessmentsService.getAll(50);
        console.log('[AssessmentsList] Fetch success, received', data.length, 'assessments');
        setAssessments(data);
      } catch (error) {
        console.error('[AssessmentsList] Fetch error:', error);
        showSnackbar('Failed to load assessments', 'error');
      } finally {
        console.log('[AssessmentsList] Fetch completed, loading=false');
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

  const handleAssessmentTypeClick = (type: AssessmentType) => {
    if (type.isActive) {
      navigate('/athletes');
    } else {
      setComingSoonModalOpen(true);
    }
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

  console.log('[AssessmentsList] Render - loading:', loading, 'assessments count:', assessments.length);

  // Loading state
  if (loading) {
    console.log('[AssessmentsList] Rendering loading state');
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Page Header Skeleton */}
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" height={42} width="200px" sx={{ mb: 1 }} />
          <Skeleton variant="text" height={24} width="350px" />
        </Box>

        {/* Assessment Types Grid Skeleton */}
        <Box sx={{ mb: 5 }}>
          <Skeleton variant="text" height={32} width="220px" sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            {[1, 2, 3, 4].map((item) => (
              <Grid item xs={6} sm={4} md={3} key={item}>
                <Card>
                  {/* 3:4 Aspect Ratio Image Skeleton */}
                  <Box
                    sx={{
                      position: 'relative',
                      paddingTop: '133.33%', // 3:4 aspect ratio
                      overflow: 'hidden',
                    }}
                  >
                    <Skeleton
                      variant="rectangular"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                      }}
                    />
                  </Box>
                  {/* Card Label Skeleton */}
                  <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                    <Skeleton variant="text" height={24} width="80%" sx={{ mx: 'auto' }} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Completed Assessments Section Skeleton */}
        <Box sx={{ mb: 2 }}>
          <Skeleton variant="text" height={32} width="280px" sx={{ mb: 1 }} />
          <Skeleton variant="text" height={20} width="180px" />
        </Box>

        {/* Assessments Grid Skeleton */}
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5].map((item) => (
            <Grid item xs={12} key={item}>
              <Card>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    {/* Athlete Name Skeleton */}
                    <Grid item xs={12} sm={3}>
                      <Skeleton variant="text" height={24} width="150px" />
                    </Grid>

                    {/* Test Details Skeleton */}
                    <Grid item xs={12} sm={3}>
                      <Skeleton variant="text" height={20} width="140px" sx={{ mb: 0.5 }} />
                      <Skeleton variant="text" height={16} width="80px" />
                    </Grid>

                    {/* Duration Skeleton */}
                    <Grid item xs={12} sm={2}>
                      <Skeleton variant="text" height={20} width="50px" sx={{ mb: 0.5 }} />
                      <Skeleton variant="text" height={16} width="70px" />
                    </Grid>

                    {/* Date Skeleton */}
                    <Grid item xs={12} sm={2}>
                      <Skeleton variant="text" height={20} width="120px" />
                    </Grid>

                    {/* Status Chip Skeleton */}
                    <Grid item xs={12} sm={2}>
                      <Skeleton variant="rounded" height={24} width="90px" />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  // Empty state
  if (assessments.length === 0) {
    console.log('[AssessmentsList] Rendering empty state');
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
  console.log('[AssessmentsList] Rendering main content with', assessments.length, 'assessments');
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Assessments
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Select an assessment type to get started
        </Typography>
      </Box>

      {/* Assessment Types Grid */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
          Assessment Types
        </Typography>
        <Grid container spacing={2}>
          {assessmentTypes.map((type) => (
            <Grid item xs={6} sm={4} md={3} key={type.id}>
              <Card
                onClick={() => handleAssessmentTypeClick(type)}
                sx={{
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                {/* 3:4 Aspect Ratio Image Container */}
                <Box
                  sx={{
                    position: 'relative',
                    paddingTop: '133.33%',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    component="img"
                    src={type.image}
                    alt={type.name}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />

                  {/* Coming Soon Ribbon */}
                  {!type.isActive && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 20,
                        right: -35,
                        backgroundColor: 'warning.main',
                        color: 'white',
                        padding: '4px 40px',
                        transform: 'rotate(45deg)',
                        fontSize: '12px',
                        fontWeight: 600,
                        boxShadow: 2,
                      }}
                    >
                      Coming Soon
                    </Box>
                  )}
                </Box>

                {/* Card Label */}
                <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {type.name}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Completed Assessments Section */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          Completed Assessments
        </Typography>
        <Typography variant="body2" color="text.secondary">
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

      {/* Coming Soon Modal */}
      <Dialog
        open={comingSoonModalOpen}
        onClose={() => setComingSoonModalOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Coming Soon!</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This assessment is coming soon! We're working hard to bring you more
            assessment types.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setComingSoonModalOpen(false)}
            variant="contained"
          >
            Got it
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
