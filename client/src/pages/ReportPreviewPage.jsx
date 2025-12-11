import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Button,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link,
  Typography,
} from '@mui/material';
import {
  ArrowBack,
  Send,
  Home,
  Person,
} from '@mui/icons-material';
import api from '../services/api';
import ReportPreview from '../components/Reports/ReportPreview';
import SendConfirmation from '../components/Reports/SendConfirmation';
import { generateRoute } from '../utils/routes';

const ReportPreviewPage = () => {
  const { athleteId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [athlete, setAthlete] = useState(null);
  const [error, setError] = useState(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, [athleteId]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch athlete details
      const athleteResponse = await api.get(`/api/athletes/${athleteId}`);
      setAthlete(athleteResponse.data);

      // Generate report preview
      const reportResponse = await api.post(`/api/reports/generate/${athleteId}`);
      setReportData(reportResponse.data);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError(err.response?.data?.detail || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReport = async (email) => {
    try {
      // Send the report
      const response = await api.post(`/api/reports/send`, {
        athleteId,
        parentEmail: email,
      });

      return {
        pin: response.data.pin,
        reportId: response.data.reportId,
      };
    } catch (err) {
      throw err;
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
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
        <Typography color="text.primary">Report Preview</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          Parent Report Preview
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
          <Button
            variant="contained"
            startIcon={<Send />}
            onClick={() => setSendDialogOpen(true)}
          >
            Send to Parent
          </Button>
        </Box>
      </Box>

      {/* Report Preview */}
      <ReportPreview reportData={reportData} />

      {/* Send Confirmation Dialog */}
      <SendConfirmation
        open={sendDialogOpen}
        onClose={() => setSendDialogOpen(false)}
        onSend={handleSendReport}
        parentEmail={athlete?.parentEmail}
        athleteName={athlete?.name}
      />
    </Container>
  );
};

export default ReportPreviewPage;
