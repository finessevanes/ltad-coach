import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Box,
  Alert,
  CircularProgress,
  Typography,
} from '@mui/material';
import api from '../services/api';
import PinEntry from '../components/Reports/PinEntry';
import ReportPreview from '../components/Reports/ReportPreview';

const ParentReportPage = () => {
  const { id } = useParams();
  const [verified, setVerified] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleVerifyPin = async (pin) => {
    try {
      setLoading(true);
      setError(null);

      // Verify PIN and get report
      const response = await api.post(`/api/reports/view/${id}/verify`, {
        pin,
      });

      if (response.data.verified) {
        // Fetch the full report
        const reportResponse = await api.get(`/api/reports/view/${id}`, {
          params: { pin },
        });

        setReportData(reportResponse.data);
        setVerified(true);
      } else {
        throw new Error('Invalid PIN');
      }
    } catch (err) {
      console.error('Error verifying PIN:', err);
      throw new Error(err.response?.data?.detail || 'Invalid PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!verified) {
    return <PinEntry onVerify={handleVerifyPin} error={error} />;
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: { xs: 2, sm: 4 } }}>
      <Container maxWidth="lg">
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" fontWeight={700} gutterBottom sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
            Balance Assessment Report
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This is a secure, parent-friendly view of your athlete's balance assessment results
          </Typography>
        </Box>

        <ReportPreview reportData={reportData} />

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            If you have questions about this report, please contact your athlete's coach.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default ParentReportPage;
