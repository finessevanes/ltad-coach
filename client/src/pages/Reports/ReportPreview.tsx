import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Chip,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import { reportsApi, ReportPreview } from '../../services/reports';
import athletesService from '../../services/athletes';
import { Athlete } from '../../types/athlete';
import { SendConfirmModal } from './SendConfirmModal';
import { SendSuccess } from './SendSuccess';

export default function ReportPreviewPage() {
  const { athleteId } = useParams();
  const navigate = useNavigate();

  const [preview, setPreview] = useState<ReportPreview | null>(null);
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentPin, setSentPin] = useState<string | null>(null);

  useEffect(() => {
    loadPreview();
  }, [athleteId]);

  const loadPreview = async () => {
    if (!athleteId) return;
    try {
      setLoading(true);
      const [previewData, athleteData] = await Promise.all([
        reportsApi.generatePreview(athleteId),
        athletesService.getById(athleteId),
      ]);
      setPreview(previewData);
      setAthlete(athleteData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!athleteId) return;
    setSending(true);
    setConfirmModalOpen(false);

    try {
      const result = await reportsApi.send(athleteId);
      setSentPin(result.pin);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send report');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (sentPin) {
    return (
      <SendSuccess
        pin={sentPin}
        athleteName={preview?.athleteName || ''}
        parentEmail={athlete?.parentEmail || ''}
        onDone={() => navigate(`/athletes/${athleteId}`)}
      />
    );
  }

  if (error || !preview) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Failed to load report'}</Alert>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate(`/athletes/${athleteId}`)}
          sx={{ mt: 2 }}
        >
          Back to Athlete
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate(`/athletes/${athleteId}`)}
          >
            Back
          </Button>
          <Typography variant="h5">Parent Report Preview</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<SendIcon />}
          onClick={() => setConfirmModalOpen(true)}
          disabled={sending}
        >
          {sending ? 'Sending...' : 'Send to Parent'}
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Report Metadata */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Report Summary
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Athlete
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {preview.athleteName}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Assessments Included
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {preview.assessmentCount}
              </Typography>
            </Box>

            {preview.latestScore && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Latest Score
                </Typography>
                <Chip
                  label={`${preview.latestScore}/5`}
                  color={preview.latestScore >= 4 ? 'success' : 'warning'}
                />
              </Box>
            )}

            <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary">
                Will be sent to
              </Typography>
              <Typography variant="body1">
                {athlete?.parentEmail}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Report Content */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Report Content
            </Typography>
            <Box
              sx={{
                '& p': { mb: 2 },
                '& h1, & h2, & h3': { mt: 3, mb: 1 },
                '& ul, & ol': { pl: 2, mb: 2 },
                '& li': { mb: 0.5 },
              }}
            >
              <ReactMarkdown>{preview.content}</ReactMarkdown>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Confirm Modal */}
      <SendConfirmModal
        open={confirmModalOpen}
        parentEmail={athlete?.parentEmail || ''}
        athleteName={preview.athleteName}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleSend}
      />
    </Container>
  );
}
