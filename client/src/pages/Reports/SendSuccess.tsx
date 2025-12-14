import { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';

interface SendSuccessProps {
  pin: string;
  athleteName: string;
  parentEmail: string;
  onDone: () => void;
}

export function SendSuccess({
  pin,
  athleteName,
  parentEmail,
  onDone,
}: SendSuccessProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyPin = () => {
    navigator.clipboard.writeText(pin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <SuccessIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />

        <Typography variant="h5" gutterBottom>
          Report Sent!
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 3 }}>
          A progress report for <strong>{athleteName}</strong> has been sent to{' '}
          <strong>{parentEmail}</strong>.
        </Typography>

        <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
          The parent will need this PIN to view the report:
        </Alert>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            py: 3,
            px: 4,
            bgcolor: 'grey.100',
            borderRadius: 2,
            mb: 3,
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontFamily: 'monospace',
              letterSpacing: 8,
              fontWeight: 'bold',
            }}
          >
            {pin}
          </Typography>
          <Tooltip title={copied ? 'Copied!' : 'Copy PIN'}>
            <IconButton onClick={handleCopyPin} color={copied ? 'success' : 'default'}>
              <CopyIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Save this PIN in case the parent needs it. The email also contains the PIN.
        </Typography>

        <Button variant="contained" onClick={onDone} size="large">
          Done
        </Button>
      </Paper>
    </Container>
  );
}
