import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Athlete } from '../../../types/athlete';

interface AthletePickerModalProps {
  open: boolean;
  onClose: () => void;
  athletes: Athlete[];
  onSelect: (athlete: Athlete) => void;
}

export function AthletePickerModal({
  open,
  onClose,
  athletes,
  onSelect,
}: AthletePickerModalProps) {
  // Only show athletes with active consent
  const activeAthletes = athletes.filter(
    (a) => a.consentStatus === 'active'
  );

  const handleSelect = (athlete: Athlete) => {
    onSelect(athlete);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Select an Athlete
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        {activeAthletes.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 4,
            }}
          >
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              No athletes with active consent
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add athletes or wait for consent approval before starting an
              assessment.
            </Typography>
          </Box>
        ) : (
          <List sx={{ pt: 0 }}>
            {activeAthletes.map((athlete) => (
              <ListItem key={athlete.id} disablePadding>
                <ListItemButton
                  onClick={() => handleSelect(athlete)}
                  sx={{
                    borderRadius: 2,
                    py: 1.5,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: 'success.main',
                        width: 44,
                        height: 44,
                        fontSize: '1.1rem',
                      }}
                    >
                      {athlete.name.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {athlete.name}
                      </Typography>
                    }
                    secondary={`Age ${athlete.age} • ${athlete.gender}`}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
}
