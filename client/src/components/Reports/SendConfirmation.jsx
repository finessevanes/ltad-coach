import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { useState } from 'react';
import { Email, Send, CheckCircle } from '@mui/icons-material';

const SendConfirmation = ({ open, onClose, onSend, parentEmail, athleteName }) => {
  const [email, setEmail] = useState(parentEmail || '');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [pin, setPin] = useState(null);
  const [error, setError] = useState(null);

  const handleSend = async () => {
    try {
      setSending(true);
      setError(null);

      const result = await onSend(email);

      setSent(true);
      setPin(result.pin);
    } catch (err) {
      console.error('Error sending report:', err);
      setError(err.response?.data?.detail || 'Failed to send report');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setEmail(parentEmail || '');
    setSending(false);
    setSent(false);
    setPin(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        {sent ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle color="success" />
            <Typography variant="h6" component="span">
              Report Sent Successfully!
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Email color="primary" />
            <Typography variant="h6" component="span">
              Send Report to Parent
            </Typography>
          </Box>
        )}
      </DialogTitle>

      <DialogContent>
        {sent ? (
          <Box>
            <Alert severity="success" sx={{ mb: 3 }}>
              The report has been sent to <strong>{email}</strong>
            </Alert>

            <Box
              sx={{
                p: 3,
                backgroundColor: 'primary.light',
                color: 'primary.contrastText',
                borderRadius: 2,
                textAlign: 'center',
              }}
            >
              <Typography variant="body2" gutterBottom>
                Access PIN
              </Typography>
              <Typography variant="h3" fontWeight={700} sx={{ letterSpacing: 4, my: 2 }}>
                {pin}
              </Typography>
              <Divider sx={{ my: 2, borderColor: 'primary.contrastText', opacity: 0.3 }} />
              <Typography variant="caption">
                The parent will need this 4-digit PIN to view the report.
                This PIN has been included in the email.
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mt: 2 }}>
              Please save this PIN for your records. Parents can access the report
              using the link in the email and entering this PIN.
            </Alert>
          </Box>
        ) : (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Confirm the parent's email address to send the balance assessment report for{' '}
              <strong>{athleteName}</strong>.
            </Typography>

            <TextField
              fullWidth
              label="Parent Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              variant="outlined"
              required
              placeholder="parent@example.com"
              sx={{ mb: 2 }}
              disabled={sending}
            />

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Alert severity="info">
              The parent will receive an email with a secure link and PIN to view the report.
            </Alert>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {sent ? (
          <Button onClick={handleClose} variant="contained" fullWidth>
            Close
          </Button>
        ) : (
          <>
            <Button onClick={handleClose} disabled={sending}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              variant="contained"
              disabled={!email || !/\S+@\S+\.\S+/.test(email) || sending}
              startIcon={sending ? <CircularProgress size={16} /> : <Send />}
            >
              {sending ? 'Sending...' : 'Send Report'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default SendConfirmation;
