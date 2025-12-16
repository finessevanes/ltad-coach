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
  Divider,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { reportsApi, ReportPreview } from '../../services/reports';
import athletesService from '../../services/athletes';
import { Athlete } from '../../types/athlete';
import { SendConfirmModal } from './SendConfirmModal';
import { SendSuccess } from './SendSuccess';
import { ReportContent } from './ReportContent';

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
    if (!athleteId || !preview) return;
    setSending(true);
    setConfirmModalOpen(false);

    try {
      const result = await reportsApi.send(athleteId, {
        content: preview.content,
        assessmentIds: preview.assessmentIds,
        assessmentCount: preview.assessmentCount,
        latestScore: preview.latestScore,
        // New fields for enhanced parent reports
        graphData: preview.graphData,
        progressSnapshot: preview.progressSnapshot,
        milestones: preview.milestones,
      });
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
    <Box sx={{ backgroundColor: '#F5F5F5', minHeight: '100vh' }}>
      {/* Fixed Header */}
      <Paper
        elevation={0}
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E5E5E5',
          px: 3,
          py: 2,
        }}
      >
        <Container maxWidth="lg">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={2}>
              <Button
                startIcon={<BackIcon />}
                onClick={() => navigate(`/athletes/${athleteId}`)}
                sx={{ color: '#2D2D2D' }}
              >
                Back
              </Button>
              <Divider orientation="vertical" flexItem />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Preview Report
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body2" color="text.secondary">
                Will be sent to: <strong>{athlete?.parentEmail}</strong>
              </Typography>
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={() => setConfirmModalOpen(true)}
                disabled={sending}
                sx={{
                  backgroundColor: '#2563EB',
                  '&:hover': { backgroundColor: '#1D4ED8' },
                }}
              >
                {sending ? 'Sending...' : 'Send to Parent'}
              </Button>
            </Box>
          </Box>
        </Container>
      </Paper>

      {/* Report Preview (WYSIWYG - exactly what parent will see) */}
      <Box sx={{ py: 2 }}>
        <ReportContent
          athleteName={preview.athleteName}
          content={preview.content}
          createdAt={new Date().toISOString()}
          graphData={preview.graphData}
          progressSnapshot={preview.progressSnapshot}
          milestones={preview.milestones}
        />
      </Box>

      {/* Confirm Modal */}
      <SendConfirmModal
        open={confirmModalOpen}
        parentEmail={athlete?.parentEmail || ''}
        athleteName={preview.athleteName}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleSend}
      />
    </Box>
  );
}
