import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  Skeleton,
} from '@mui/material';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import EmailIcon from '@mui/icons-material/Email';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { Athlete } from '../../../types/athlete';

interface QuickActionCardsProps {
  pendingAthletes: Athlete[];
  onResendConsent: (athleteId: string) => void;
  onStartAssessment: () => void;
  loading?: boolean;
}

export function QuickActionCards({
  pendingAthletes,
  onResendConsent,
  onStartAssessment,
  loading = false,
}: QuickActionCardsProps) {
  const firstPendingAthlete = pendingAthletes.find(
    (a) => a.consentStatus === 'pending'
  );

  // Extract parent name from email if available
  const getParentName = (athlete: Athlete) => {
    if (athlete.parentEmail) {
      const name = athlete.parentEmail.split('@')[0];
      // Capitalize first letter
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return 'Parent';
  };

  if (loading) {
    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Skeleton for 3 cards */}
        {[1, 2, 3].map((i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Card
              sx={{
                height: '100%',
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'grey.100',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Skeleton variant="rectangular" width={120} height={24} sx={{ mb: 1.5, borderRadius: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="80%" height={32} sx={{ mb: 2 }} />
                    <Skeleton variant="rectangular" width={130} height={36} sx={{ borderRadius: 2 }} />
                  </Box>
                  <Skeleton variant="circular" width={56} height={56} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {/* Card 1 - New Assessment */}
      <Grid item xs={12} sm={6} md={4}>
        <Card
          sx={{
            height: '100%',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'grey.100',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Chip
              label="New Assessment"
              size="small"
              variant="outlined"
              sx={{
                mb: 1.5,
                borderColor: 'success.main',
                color: 'success.main',
                bgcolor: 'white',
                fontWeight: 500,
                fontSize: '0.75rem',
              }}
            />
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Balance and stability test
                </Typography>
                <Button
                  variant="contained"
                  color="success"
                  onClick={onStartAssessment}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  Start session
                </Button>
              </Box>
              <DirectionsRunIcon
                sx={{ fontSize: 56, color: 'primary.light', opacity: 0.7 }}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Card 2 - Pending Consents (conditional) */}
      {firstPendingAthlete && (
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              height: '100%',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'grey.100',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Chip
                label="Action Required"
                size="small"
                variant="outlined"
                sx={{
                  mb: 1.5,
                  borderColor: 'warning.main',
                  color: 'warning.main',
                  bgcolor: 'white',
                  fontWeight: 500,
                  fontSize: '0.75rem',
                }}
              />
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Pending consents
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {firstPendingAthlete.name}
                    <br />
                    Parent: {getParentName(firstPendingAthlete)}
                  </Typography>
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<EmailIcon />}
                    onClick={() => onResendConsent(firstPendingAthlete.id)}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 500,
                    }}
                  >
                    Resend Email
                  </Button>
                </Box>
                <EmailIcon
                  sx={{ fontSize: 48, color: 'warning.light', opacity: 0.7 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Card 3 - Upcoming Event */}
      <Grid item xs={12} sm={6} md={4}>
        <Card
          sx={{
            height: '100%',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'grey.100',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                height: '100%',
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Thursday, December 18th
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Upcoming basketball game
                </Typography>
              </Box>
              <CalendarTodayIcon
                sx={{ fontSize: 48, color: 'grey.300' }}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
