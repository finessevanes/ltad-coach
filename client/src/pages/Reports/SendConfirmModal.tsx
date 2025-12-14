import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import { Email as EmailIcon } from '@mui/icons-material';

interface SendConfirmModalProps {
  open: boolean;
  parentEmail: string;
  athleteName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function SendConfirmModal({
  open,
  parentEmail,
  athleteName,
  onClose,
  onConfirm,
}: SendConfirmModalProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Send Report to Parent?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          This will send a progress report for <strong>{athleteName}</strong> to:
        </DialogContentText>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mt: 2,
            p: 2,
            bgcolor: 'grey.100',
            borderRadius: 1,
          }}
        >
          <EmailIcon color="action" />
          <Typography fontWeight="medium">{parentEmail}</Typography>
        </Box>

        <DialogContentText sx={{ mt: 2 }}>
          The parent will receive an email with a link and a unique PIN to view the report.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained">
          Send Report
        </Button>
      </DialogActions>
    </Dialog>
  );
}
