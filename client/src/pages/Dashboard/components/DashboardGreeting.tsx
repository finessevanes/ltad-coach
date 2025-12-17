import { Typography } from '@mui/material';

interface DashboardGreetingProps {
  loading?: boolean;
}

export const DashboardGreeting: React.FC<DashboardGreetingProps> = ({ loading }) => {
  if (loading) {
    return null;
  }

  return (
    <Typography
      variant="h2"
      component="h1"
      sx={{
        fontWeight: 900,
        fontSize: { xs: '2rem', md: '2.5rem' },
        letterSpacing: '-0.02em',
      }}
    >
      Good Afternoon, Coach.
    </Typography>
  );
};
