import { Typography } from '@mui/material';
import { getGreeting } from '../../../utils/dateUtils';

interface DashboardGreetingProps {
  loading?: boolean;
}

export const DashboardGreeting: React.FC<DashboardGreetingProps> = ({ loading }) => {
  if (loading) {
    return null;
  }

  const greeting = getGreeting().toUpperCase();

  return (
    <Typography
      variant="h2"
      component="h1"
      sx={{
        fontWeight: 900,
        fontSize: { xs: '2rem', md: '2.5rem' },
        textTransform: 'uppercase',
        letterSpacing: '-0.02em',
      }}
    >
      {greeting}, COACH.
    </Typography>
  );
};
