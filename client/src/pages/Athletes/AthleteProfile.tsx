import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
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
  Description as ReportIcon,
} from '@mui/icons-material';
import { useAthlete, useDeleteAthlete } from '../../hooks/useAthletes';
import { useAthleteAssessments } from '../../hooks/useAssessments';
import { reportsApi } from '../../services/reports';
import { StatusBadge } from '../../components/StatusBadge';
import { AssessmentHistory } from './AssessmentHistory';
import { ProgressChart } from './ProgressChart';
import { EditAthleteModal } from './EditAthleteModal';
import { ReportHistory } from '../Reports/ReportHistory';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { useQuery } from '@tanstack/react-query';

export default function AthleteProfile() {
  const { athleteId } = useParams<{ athleteId: string }>();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  // Use React Query hooks for parallel data fetching with caching
  const { data: athlete, isLoading: athleteLoading, error: athleteError } = useAthlete(athleteId);
  const { data: assessmentsResponse, isLoading: assessmentsLoading } = useAthleteAssessments(athleteId);
  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['reports', 'athlete', athleteId],
    queryFn: () => reportsApi.getByAthlete(athleteId!),
    enabled: !!athleteId,
  });

  const deleteAthleteMutation = useDeleteAthlete();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  // Combine loading states
  const loading = athleteLoading || assessmentsLoading || reportsLoading;
  const error = athleteError ? (athleteError as any).message || 'Failed to load athlete data' : '';

  // Extract assessments from response
  const assessments = assessmentsResponse?.assessments || [];

  const handleDelete = async () => {
    if (!athleteId) return;

    deleteAthleteMutation.mutate(athleteId, {
      onSuccess: () => {
        showSnackbar('Athlete deleted successfully', 'success');
        navigate('/athletes');
      },
      onError: (err: any) => {
        showSnackbar(err.message || 'Failed to delete athlete', 'error');
      },
    });
  };

  const loadData = async () => {
    // No longer needed - React Query handles refetching automatically
    // Kept as empty function for compatibility with existing code
  };

  const handleAthleteUpdated = () => {
    // React Query will automatically refetch when cache is invalidated
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
      <Box sx={{ py: 5, px: { xs: 2, sm: 4 } }}>
        <Alert severity="error">{error || 'Athlete not found'}</Alert>
        <Button
          variant="outlined"
          onClick={() => navigate('/athletes')}
          sx={{ mt: 2, borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
        >
          Back to Athletes
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 5, px: { xs: 2, sm: 4 } }}>
      {/* Header Row: Athlete Name + Actions */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 3,
          gap: 2,
        }}
      >
        <Box display="flex" gap={2} alignItems="center">
          <Avatar
            sx={{
              width: 64,
              height: 64,
              fontSize: 28,
              bgcolor: athlete.consentStatus === 'active' ? 'success.main' :
                athlete.consentStatus === 'pending' ? 'warning.main' : 'error.main',
              fontWeight: 700,
            }}
          >
            {athlete.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 900,
                fontSize: { xs: '1.75rem', md: '2rem' },
                textTransform: 'uppercase',
                letterSpacing: '-0.02em',
                mb: 0.5,
              }}
            >
              {athlete.name}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              {athlete.age} years old • {athlete.gender.charAt(0).toUpperCase() + athlete.gender.slice(1)}
            </Typography>
            <StatusBadge status={athlete.consentStatus} />
          </Box>
        </Box>

        <Box display="flex" gap={1} flexWrap="wrap">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(`/assess/${athlete.id}`)}
            disabled={isPending}
            sx={{
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            New Assessment
          </Button>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => navigate(`/assess/${athlete.id}/upload`)}
            disabled={isPending}
            sx={{
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              borderColor: 'black',
              color: 'black',
              '& .MuiSvgIcon-root': {
                color: 'black',
              },
              '&:hover': {
                borderColor: 'black',
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            Upload Video
          </Button>
          <Button
            variant="outlined"
            startIcon={<ReportIcon />}
            onClick={() => navigate(`/athletes/${athlete.id}/report`)}
            disabled={isPending || assessments.length === 0}
            sx={{
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              borderColor: 'black',
              color: 'black',
              '& .MuiSvgIcon-root': {
                color: 'black',
              },
              '&:hover': {
                borderColor: 'black',
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            Generate Report
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

      {/* Consent Alert */}
      {isPending && (
        <Alert
          severity="warning"
          sx={{
            mb: 3,
            borderRadius: 1,
            borderLeft: '4px solid',
            borderLeftColor: '#F59E0B',
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Pending Parent Consent
          </Typography>
          <Typography variant="body2">
            Assessments are disabled until {athlete.name}'s parent provides consent.
            A consent request has been sent to {athlete.parentEmail}.
          </Typography>
        </Alert>
      )}

      {/* Divider */}
      <Box
        sx={{
          borderBottom: '1px solid',
          borderColor: 'grey.200',
          mb: 4,
        }}
      />

      <Grid container spacing={3}>
        {/* Progress Chart */}
        <Grid item xs={12}>
          <Box>
            {/* Section Header */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
                pb: 1.5,
                borderBottom: '1px solid',
                borderColor: 'grey.200',
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  fontSize: '1.125rem',
                  color: '#2D2D2D',
                }}
              >
                Progress Over Time
              </Typography>
            </Box>
            {assessments.length > 0 ? (
              <ProgressChart assessments={assessments} />
            ) : (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                No assessments yet. Complete an assessment to see progress.
              </Typography>
            )}
          </Box>
        </Grid>

        {/* Assessment History */}
        <Grid item xs={12}>
          <Box>
            {/* Section Header */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
                pb: 1.5,
                borderBottom: '1px solid',
                borderColor: 'grey.200',
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  fontSize: '1.125rem',
                  color: '#2D2D2D',
                }}
              >
                Assessment History
              </Typography>
            </Box>
            <AssessmentHistory
              assessments={assessments}
              onAssessmentClick={(id) => navigate(`/assessments/${id}`)}
            />
          </Box>
        </Grid>

        {/* Report History */}
        <Grid item xs={12}>
          <ReportHistory
            athleteId={athleteId!}
            reports={reports || []}
            onReportResent={loadData}
          />
        </Grid>
      </Grid>

      {/* Edit Modal */}
      <EditAthleteModal
        open={editModalOpen}
        athlete={athlete}
        onClose={() => setEditModalOpen(false)}
        onSuccess={handleAthleteUpdated}
        onDelete={() => navigate('/athletes')}
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
    </Box>
  );
}
