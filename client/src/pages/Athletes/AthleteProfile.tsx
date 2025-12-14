import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import athletesService from '../../services/athletes';
import assessmentsService from '../../services/assessments';
import { Athlete } from '../../types/athlete';
import { StatusBadge } from '../../components/StatusBadge';
import { AssessmentHistory } from './AssessmentHistory';
import { ProgressChart } from './ProgressChart';
import { EditAthleteModal } from './EditAthleteModal';
import { useSnackbar } from '../../contexts/SnackbarContext';

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

export default function AthleteProfile() {
  const { athleteId } = useParams<{ athleteId: string }>();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [assessments, setAssessments] = useState<AssessmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    loadData();
  }, [athleteId]);

  const loadData = async () => {
    if (!athleteId) return;
    try {
      setLoading(true);
      const [athleteData, assessmentsResponse] = await Promise.all([
        athletesService.getById(athleteId),
        assessmentsService.getByAthlete(athleteId),
      ]);
      setAthlete(athleteData);
      setAssessments(assessmentsResponse.assessments);
    } catch (err: any) {
      setError(err.message || 'Failed to load athlete data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!athleteId) return;
    try {
      await athletesService.delete(athleteId);
      showSnackbar('Athlete deleted successfully', 'success');
      navigate('/athletes');
    } catch (err: any) {
      showSnackbar(err.message || 'Failed to delete athlete', 'error');
    }
    setDeleteDialogOpen(false);
  };

  const handleAthleteUpdated = async () => {
    await loadData();
    showSnackbar('Athlete updated successfully', 'success');
  };

  const isPending = athlete?.consentStatus === 'pending';

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !athlete) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Athlete not found'}</Alert>
        <Button
          variant="outlined"
          onClick={() => navigate('/athletes')}
          sx={{ mt: 2 }}
        >
          Back to Athletes
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Consent Alert */}
      {isPending && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">Pending Parent Consent</Typography>
          <Typography variant="body2">
            Assessments are disabled until {athlete.name}'s parent provides consent.
            A consent request has been sent to {athlete.parentEmail}.
          </Typography>
        </Alert>
      )}

      {/* Profile Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box display="flex" gap={2}>
            <Avatar
              sx={{ width: 80, height: 80, fontSize: 32, bgcolor: 'primary.main' }}
            >
              {athlete.name.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h4">{athlete.name}</Typography>
              <Typography variant="body1" color="text.secondary">
                {athlete.age} years old • {athlete.gender}
              </Typography>
              <Box mt={1}>
                <StatusBadge status={athlete.consentStatus} />
              </Box>
            </Box>
          </Box>

          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate(`/assess/${athlete.id}`)}
              disabled={isPending}
            >
              New Assessment
            </Button>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => navigate(`/assess/${athlete.id}/upload`)}
              disabled={isPending}
            >
              Upload Video
            </Button>
            <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
              <MoreIcon />
            </IconButton>
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
            >
              <MenuItem onClick={() => { setEditModalOpen(true); setMenuAnchor(null); }}>
                <EditIcon sx={{ mr: 1 }} /> Edit Athlete
              </MenuItem>
              <MenuItem
                onClick={() => { setDeleteDialogOpen(true); setMenuAnchor(null); }}
                sx={{ color: 'error.main' }}
              >
                <DeleteIcon sx={{ mr: 1 }} /> Delete Athlete
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Progress Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Progress Over Time
            </Typography>
            {assessments.length > 0 ? (
              <ProgressChart assessments={assessments} />
            ) : (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                No assessments yet. Complete an assessment to see progress.
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Assessment History */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Assessment History
            </Typography>
            <AssessmentHistory
              assessments={assessments}
              onAssessmentClick={(id) => navigate(`/assessments/${id}`)}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Edit Modal */}
      <EditAthleteModal
        open={editModalOpen}
        athlete={athlete}
        onClose={() => setEditModalOpen(false)}
        onSuccess={handleAthleteUpdated}
      />

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Athlete?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove {athlete.name} from your roster?
            This will also delete all their assessment history. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
