import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { reportsApi, ReportInfo, ReportView } from '../../services/reports';
import { PinEntry } from './PinEntry';
import { ReportContent } from './ReportContent';

export function PublicReport() {
  const { reportId } = useParams();

  const [info, setInfo] = useState<ReportInfo | null>(null);
  const [report, setReport] = useState<ReportView | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReportInfo();
  }, [reportId]);

  const loadReportInfo = async () => {
    if (!reportId) return;
    try {
      const data = await reportsApi.getInfo(reportId);
      setInfo(data);
    } catch (err) {
      setError('Report not found or has expired.');
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async (pin: string) => {
    if (!reportId) return;
    setError('');
    setVerifying(true);

    try {
      const data = await reportsApi.verifyPin(reportId, pin);
      setReport(data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Incorrect PIN. Please try again.');
      } else if (err.response?.status === 429) {
        setError('Too many attempts. Please wait a minute before trying again.');
      } else if (err.response?.status === 403) {
        setError('This report has been locked due to too many failed attempts. Contact the coach.');
      } else if (err.response?.status === 410) {
        setError('This report has expired. Please contact the coach for a new report.');
      } else {
        setError('Failed to verify PIN. Please try again.');
      }
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !info) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Report Not Found
          </Typography>
          <Typography color="text.secondary">
            This report link may be invalid or expired.
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (report) {
    return (
      <ReportContent
        athleteName={report.athleteName}
        content={report.reportContent}
        createdAt={report.createdAt}
        graphData={report.graphData}
        progressSnapshot={report.progressSnapshot}
        milestones={report.milestones}
      />
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{ color: 'primary.main', fontWeight: 'bold', mb: 1 }}
          >
            AI Coach
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Progress Report
          </Typography>
        </Box>

        {/* Athlete Info */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            {info?.athleteName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Report generated on{' '}
            {info?.createdAt
              ? new Date(info.createdAt).toLocaleDateString()
              : ''}
          </Typography>
        </Box>

        {/* PIN Entry */}
        <Typography variant="body1" sx={{ mb: 2 }}>
          Enter the 6-digit PIN from your email:
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <PinEntry onSubmit={handlePinSubmit} disabled={verifying} />

        {verifying && (
          <Box sx={{ mt: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </Paper>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', textAlign: 'center', mt: 2 }}
      >
        Questions about this report? Contact your child's coach.
      </Typography>
    </Container>
  );
}
