import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { Edit, VideoCall, Upload, Person, Email, Cake, Wc } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { generateRoute } from '../utils/routes';

const AthleteProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [athlete, setAthlete] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [athleteResponse, assessmentsResponse] = await Promise.all([
        api.get(`/api/athletes/${id}`),
        api.get(`/api/assessments/athlete/${id}`),
      ]);

      setAthlete(athleteResponse.data);
      setAssessments(assessmentsResponse.data);
    } catch (err) {
      setError(err.message || 'Failed to load athlete data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !athlete) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Athlete not found'}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          {athlete.name}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Edit />}
          onClick={() => navigate(generateRoute.editAthlete(id))}
        >
          Edit
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Athlete Details */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Athlete Details
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Person color="action" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Name
                  </Typography>
                  <Typography variant="body1">{athlete.name}</Typography>
                </Box>
              </Box>

              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Cake color="action" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Age
                  </Typography>
                  <Typography variant="body1">{athlete.age} years</Typography>
                </Box>
              </Box>

              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Wc color="action" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Gender
                  </Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {athlete.gender}
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Email color="action" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Parent Email
                  </Typography>
                  <Typography variant="body1">{athlete.parent_email}</Typography>
                </Box>
              </Box>

              <Box mt={2}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Consent Status
                </Typography>
                <Chip
                  label={athlete.consent_status || 'pending'}
                  color={getStatusColor(athlete.consent_status)}
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Assessments */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Assessments</Typography>
              <Box display="flex" gap={1}>
                <Button
                  variant="contained"
                  startIcon={<VideoCall />}
                  onClick={() => navigate(generateRoute.cameraSetup(id))}
                  disabled={athlete.consent_status !== 'active'}
                >
                  Record Assessment
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Upload />}
                  onClick={() => navigate(generateRoute.uploadVideo(id))}
                  disabled={athlete.consent_status !== 'active'}
                >
                  Upload Video
                </Button>
              </Box>
            </Box>

            {athlete.consent_status !== 'active' && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Waiting for parent consent. Assessments will be available once consent is
                granted.
              </Alert>
            )}

            <Divider sx={{ mb: 2 }} />

            {assessments.length === 0 ? (
              <Alert severity="info">
                No assessments yet. Click "Record Assessment" to create the first one.
              </Alert>
            ) : (
              <List>
                {assessments.map((assessment, index) => (
                  <Box key={assessment.id}>
                    <ListItem
                      button
                      onClick={() => navigate(generateRoute.assessmentResults(assessment.id))}
                    >
                      <ListItemText
                        primary={`Assessment ${index + 1}`}
                        secondary={`Date: ${new Date(
                          assessment.created_at
                        ).toLocaleDateString()} | Status: ${assessment.status}`}
                      />
                      <Chip
                        label={assessment.status}
                        size="small"
                        color={assessment.status === 'completed' ? 'success' : 'default'}
                      />
                    </ListItem>
                    {index < assessments.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AthleteProfilePage;
