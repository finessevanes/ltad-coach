import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link,
  Chip,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Share,
  Home,
  Person,
} from '@mui/icons-material';
import api from '../services/api';
import MetricsCard from '../components/Assessment/MetricsCard';
import { format } from 'date-fns';
import { generateRoute } from '../utils/routes';

const AssessmentResultsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const [athlete, setAthlete] = useState(null);
  const [teamRank, setTeamRank] = useState(null);
  const [coachNotes, setCoachNotes] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchAssessmentData();
  }, [id]);

  const fetchAssessmentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch assessment details
      const response = await api.get(`/api/assessments/${id}`);
      const assessmentData = response.data;
      setAssessment(assessmentData);
      setCoachNotes(assessmentData.coachNotes || '');

      // Fetch athlete details
      if (assessmentData.athleteId) {
        const athleteResponse = await api.get(`/api/athletes/${assessmentData.athleteId}`);
        setAthlete(athleteResponse.data);
      }

      // Fetch team ranking if available
      if (assessmentData.teamRankId) {
        const rankResponse = await api.get(`/api/assessments/${id}/team-rank`);
        setTeamRank(rankResponse.data);
      }
    } catch (err) {
      console.error('Error fetching assessment:', err);
      setError(err.response?.data?.detail || 'Failed to load assessment results');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      setSaving(true);
      setError(null);

      await api.patch(`/api/assessments/${id}/notes`, {
        coachNotes,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving notes:', err);
      setError(err.response?.data?.detail || 'Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateReport = () => {
    if (athlete) {
      navigate(`/athletes/${athlete.id}/report`);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error && !assessment) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          underline="hover"
          color="inherit"
          href="/dashboard"
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
        >
          <Home sx={{ mr: 0.5, fontSize: 20 }} />
          Dashboard
        </Link>
        {athlete && (
          <Link
            underline="hover"
            color="inherit"
            onClick={() => navigate(generateRoute.athleteProfile(athlete.id))}
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          >
            <Person sx={{ mr: 0.5, fontSize: 20 }} />
            {athlete.name}
          </Link>
        )}
        <Typography color="text.primary">Assessment Results</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
              Assessment Results
            </Typography>
            {athlete && (
              <Typography variant="h6" color="text.secondary" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                {athlete.name}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate(-1)}
              size={isMobile ? 'small' : 'medium'}
            >
              Back
            </Button>
            <Button
              variant="contained"
              startIcon={<Share />}
              onClick={handleGenerateReport}
              size={isMobile ? 'small' : 'medium'}
            >
              Generate Report
            </Button>
          </Box>
        </Box>

        {/* Assessment Info */}
        {assessment && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={`${format(new Date(assessment.createdAt), 'MMM dd, yyyy HH:mm')}`}
              size="small"
            />
            <Chip
              label={`${assessment.legTested === 'left' ? 'Left' : 'Right'} Leg`}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip
              label={assessment.testType?.replace(/_/g, ' ').toUpperCase()}
              size="small"
              variant="outlined"
            />
          </Box>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(false)}>
          Notes saved successfully!
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Metrics Card */}
        <Grid item xs={12} lg={8}>
          <MetricsCard metrics={assessment?.metrics} teamRank={teamRank} />
        </Grid>

        {/* AI Feedback & Coach Notes */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* AI Feedback */}
            {assessment?.aiFeedback && (
              <Card sx={{ backgroundColor: 'primary.light', color: 'primary.contrastText' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight={600} sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                    AI Analysis
                  </Typography>
                  <Divider sx={{ mb: 2, borderColor: 'primary.contrastText', opacity: 0.3 }} />
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line', fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>
                    {assessment.aiFeedback}
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Coach Notes */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600} sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                  Coach Notes
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  placeholder="Add your observations, recommendations, or notes here..."
                  value={coachNotes}
                  onChange={(e) => setCoachNotes(e.target.value)}
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={16} /> : <Save />}
                  onClick={handleSaveNotes}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Notes'}
                </Button>
              </CardContent>
            </Card>
          </Box>
        </Grid>

        {/* Peer Comparison */}
        {assessment?.metrics?.percentile !== undefined && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Peer Comparison
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h3" color="primary" fontWeight={700}>
                    {assessment.metrics.percentile}th
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Percentile for age {athlete?.age || 'group'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    This athlete performed better than {assessment.metrics.percentile}% of peers in the same age group.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default AssessmentResultsPage;
