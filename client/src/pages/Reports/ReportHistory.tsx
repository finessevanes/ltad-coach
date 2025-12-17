import { useState } from 'react';
import { formatDateTime } from '../../utils/dateUtils';
import {
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  Send as SendIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { reportsApi, ReportResendResponse } from '../../services/reports';
import { useSnackbar } from '../../contexts/SnackbarContext';

interface ReportHistoryItem {
  id: string;
  createdAt: string;
  sentAt?: string;
}

interface Props {
  athleteId: string;
  reports: ReportHistoryItem[];
  onReportResent: () => void;
}

export const ReportHistory: React.FC<Props> = ({ reports, onReportResent }) => {
  const { showSnackbar } = useSnackbar();
  const [resendDialogOpen, setResendDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportHistoryItem | null>(null);
  const [resending, setResending] = useState(false);
  const [newPin, setNewPin] = useState<string | null>(null);

  const handleResendClick = (report: ReportHistoryItem) => {
    setSelectedReport(report);
    setNewPin(null);
    setResendDialogOpen(true);
  };

  const handleResendConfirm = async () => {
    if (!selectedReport) return;

    setResending(true);
    try {
      const response: ReportResendResponse = await reportsApi.resend(selectedReport.id);
      setNewPin(response.pin);
      showSnackbar('Report resent with new PIN', 'success');
      onReportResent();
    } catch (err: any) {
      showSnackbar(err.response?.data?.detail || 'Failed to resend report', 'error');
      setResendDialogOpen(false);
    } finally {
      setResending(false);
    }
  };

  const handleCopyLink = (reportId: string) => {
    const link = `${window.location.origin}/report/${reportId}`;
    navigator.clipboard.writeText(link);
    showSnackbar('Report link copied to clipboard', 'success');
  };

  const handleCopyPin = (pin: string) => {
    navigator.clipboard.writeText(pin);
    showSnackbar('PIN copied to clipboard', 'success');
  };

  const handleCloseDialog = () => {
    setResendDialogOpen(false);
    setSelectedReport(null);
    setNewPin(null);
  };


  if (reports.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Report History
        </Typography>
        <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
          No reports generated yet. Click "Generate Report" to create the first parent report.
        </Typography>
      </Paper>
    );
  }

  return (
    <>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Report History
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          View all generated reports and resend with a new PIN if needed.
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Created</TableCell>
                <TableCell>Sent</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{formatDateTime(report.createdAt, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</TableCell>
                  <TableCell>
                    {report.sentAt ? formatDateTime(report.sentAt, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Not sent'}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleCopyLink(report.id)}
                      title="Copy report link"
                    >
                      <CopyIcon fontSize="small" />
                    </IconButton>
                    <Button
                      size="small"
                      startIcon={<SendIcon />}
                      onClick={() => handleResendClick(report)}
                      sx={{ ml: 1 }}
                    >
                      Resend
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Resend Dialog */}
      <Dialog open={resendDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {newPin ? 'New PIN Generated' : 'Resend Report with New PIN?'}
        </DialogTitle>
        <DialogContent>
          {newPin ? (
            <>
              <Alert severity="success" sx={{ mb: 2 }}>
                Report has been resent with a new PIN. The old PIN will no longer work.
              </Alert>
              <Box
                sx={{
                  p: 3,
                  bgcolor: 'primary.50',
                  borderRadius: 1,
                  textAlign: 'center',
                }}
              >
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  New PIN:
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                  }}
                >
                  <Typography
                    variant="h4"
                    component="code"
                    sx={{
                      fontFamily: 'monospace',
                      letterSpacing: '0.2em',
                      bgcolor: 'primary.100',
                      px: 2,
                      py: 1,
                      borderRadius: 1,
                    }}
                  >
                    {newPin}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleCopyPin(newPin)}
                    title="Copy PIN"
                  >
                    <CopyIcon />
                  </IconButton>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Share this PIN with the parent. They'll need it to access the report at the link
                you previously shared.
              </Typography>
            </>
          ) : (
            <DialogContentText>
              This will generate a new 6-digit PIN for this report. The old PIN will no longer
              work. An email with the new PIN will be sent to the parent.
              <br />
              <br />
              Do you want to continue?
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {newPin ? 'Done' : 'Cancel'}
          </Button>
          {!newPin && (
            <Button
              onClick={handleResendConfirm}
              variant="contained"
              disabled={resending}
            >
              {resending ? 'Resending...' : 'Resend with New PIN'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};
