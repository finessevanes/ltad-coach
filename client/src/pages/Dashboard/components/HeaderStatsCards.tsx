import { Box, Card, CardContent, Typography } from '@mui/material';
import { Athlete } from '../../../types/athlete';

interface HeaderStatsCardsProps {
  athletes: Athlete[];
  loading?: boolean;
}

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subtitle }) => {
  return (
    <Card
      sx={{
        minWidth: 140,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'grey.200',
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem' }}
        >
          {label}
        </Typography>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            fontSize: '2rem',
            my: 0.5,
          }}
        >
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );
};

export const HeaderStatsCards: React.FC<HeaderStatsCardsProps> = ({ athletes, loading }) => {
  const activeAthletes = athletes.filter((a) => a.consentStatus === 'active').length;
  const pendingAthletes = athletes.filter(
    (a) => a.consentStatus === 'pending' || a.consentStatus === 'declined'
  ).length;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Card sx={{ minWidth: 140, height: 100 }}>
          <CardContent>
            <Typography variant="caption">Loading...</Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 140, height: 100 }}>
          <CardContent>
            <Typography variant="caption">Loading...</Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 2 }}>
      <StatCard label="ACTIVE ROSTER" value={activeAthletes} subtitle={`/ ${athletes.length}`} />
      <StatCard label="PENDING" value={`${pendingAthletes}/${athletes.length}`} subtitle="" />
    </Box>
  );
};
