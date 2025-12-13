import {
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
} from '@mui/material';
import { Warning as WarningIcon, Email as EmailIcon, Cancel as CancelIcon } from '@mui/icons-material';

interface Athlete {
  id: string;
  name: string;
  consentStatus: 'pending' | 'declined' | 'active';
  parentEmail: string;
}

interface PendingConsentAlertsProps {
  athletes: Athlete[];
  onResendConsent: (athleteId: string) => void;
  loading?: boolean;
}

export const PendingConsentAlerts: React.FC<PendingConsentAlertsProps> = ({
  athletes,
  onResendConsent,
}) => {
  const pendingAthletes = athletes.filter((a) => a.consentStatus === 'pending');
  const declinedAthletes = athletes.filter((a) => a.consentStatus === 'declined');

  if (pendingAthletes.length === 0 && declinedAthletes.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <WarningIcon sx={{ color: 'warning.main' }} />
          <Typography variant="h6" component="h2">
            Consent Actions Required
          </Typography>
        </Box>

        {/* Pending Consents */}
        {pendingAthletes.length > 0 && (
          <Box sx={{ mb: declinedAthletes.length > 0 ? 3 : 0 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight={600}>
                {pendingAthletes.length} athlete{pendingAthletes.length > 1 ? 's' : ''} waiting for
                parental consent
              </Typography>
            </Alert>

            <List sx={{ p: 0 }}>
              {pendingAthletes.map((athlete) => (
                <ListItem
                  key={athlete.id}
                  sx={{
                    px: 0,
                    py: 1.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 'none' },
                  }}
                  secondaryAction={
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EmailIcon />}
                      onClick={() => onResendConsent(athlete.id)}
                    >
                      Resend Email
                    </Button>
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'warning.light' }}>
                      {athlete.name.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight={600}>
                          {athlete.name}
                        </Typography>
                        <Chip label="Pending" size="small" color="warning" />
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        Parent: {athlete.parentEmail}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Declined Consents */}
        {declinedAthletes.length > 0 && (
          <Box>
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight={600}>
                {declinedAthletes.length} athlete{declinedAthletes.length > 1 ? 's' : ''} with
                declined consent
              </Typography>
            </Alert>

            <List sx={{ p: 0 }}>
              {declinedAthletes.map((athlete) => (
                <ListItem
                  key={athlete.id}
                  sx={{
                    px: 0,
                    py: 1.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 'none' },
                  }}
                  secondaryAction={
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={() => onResendConsent(athlete.id)}
                    >
                      Contact Parent
                    </Button>
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'error.light' }}>
                      {athlete.name.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight={600}>
                          {athlete.name}
                        </Typography>
                        <Chip label="Declined" size="small" color="error" />
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        Parent: {athlete.parentEmail}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
