import { useMemo } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Skeleton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Athlete } from '../../../types/athlete';

interface AthletesPanelProps {
  athletes: Athlete[];
  loading?: boolean;
}

const getAvatarBgColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'success.main';
    case 'pending':
      return 'warning.main';
    case 'declined':
      return 'error.main';
    default:
      return 'grey.400';
  }
};

export function AthletesPanel({ athletes, loading = false }: AthletesPanelProps) {
  const navigate = useNavigate();

  // Display all athletes without filtering
  const filteredAthletes = useMemo(() => {
    return athletes;
  }, [athletes]);

  const handleAthleteClick = (athleteId: string) => {
    navigate(`/athletes/${athleteId}`);
  };

  if (loading) {
    return (
      <Box sx={{ height: '100%' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
            pb: 1.5,
            borderBottom: '1px solid',
            borderColor: 'grey.200',
          }}
        >
          <Skeleton variant="text" width={100} height={24} />
          <Skeleton variant="text" width={120} height={20} />
        </Box>
        <List sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[1, 2, 3].map((i) => (
            <ListItem key={i} disablePadding>
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  width: '100%',
                  p: 2,
                  bgcolor: 'white',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'grey.200',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                }}
              >
                <Skeleton variant="circular" width={48} height={48} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="60%" height={24} />
                </Box>
              </Box>
            </ListItem>
          ))}
        </List>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%' }}>
      {/* Header with Athletes on left and Winter '25 Roster on right */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          pb: 1.5,
          borderBottom: '1px solid',
          borderColor: 'grey.200',
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            fontSize: '1.125rem',
            color: '#2D2D2D',
          }}
        >
          Athletes
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'text.primary',
            fontSize: '0.75rem',
            fontWeight: 700,
          }}
        >
          Winter '25 Roster
        </Typography>
      </Box>

      {/* Athlete List */}
      <List
        sx={{
          maxHeight: 400,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
          {filteredAthletes.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: 'center', py: 3 }}
            >
              No athletes found
            </Typography>
          ) : (
            filteredAthletes.map((athlete) => {
              return (
                <ListItem key={athlete.id} disablePadding>
                  <ListItemButton
                    onClick={() => handleAthleteClick(athlete.id)}
                    sx={{
                      borderRadius: 1,
                      py: 1.5,
                      px: 2,
                      bgcolor: 'white',
                      width: '100%',
                      border: '1px solid',
                      borderColor: 'grey.200',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                      '&:hover': {
                        bgcolor: 'grey.50',
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: getAvatarBgColor(athlete.consentStatus),
                          width: 48,
                          height: 48,
                          fontSize: '1.1rem',
                          fontWeight: 700,
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
                    />
                  </ListItemButton>
                </ListItem>
              );
            })
          )}
        </List>
    </Box>
  );
}
