import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import {
  People as PeopleIcon,
  Warning as WarningIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';

interface QuickStatsCardsProps {
  totalAthletes: number;
  pendingConsents: number;
  recentTests: number;
  avgBalanceScore: number;
  loading?: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle }) => {
  return (
    <Card
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'visible',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3,
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h3" component="div" sx={{ fontWeight: 700, mb: 0.5 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}15`,
              borderRadius: '12px',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export const QuickStatsCards: React.FC<QuickStatsCardsProps> = ({
  totalAthletes,
  pendingConsents,
  recentTests,
  avgBalanceScore,
}) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Athletes"
          value={totalAthletes}
          icon={<PeopleIcon sx={{ fontSize: 32, color: 'primary.main' }} />}
          color="#2563EB"
          subtitle="in roster"
        />
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Pending Consents"
          value={pendingConsents}
          icon={<WarningIcon sx={{ fontSize: 32, color: 'warning.main' }} />}
          color="#F59E0B"
          subtitle="need approval"
        />
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Recent Tests"
          value={recentTests}
          icon={<AssessmentIcon sx={{ fontSize: 32, color: 'secondary.main' }} />}
          color="#F97316"
          subtitle="last 7 days"
        />
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Avg Balance Score"
          value={avgBalanceScore > 0 ? `${avgBalanceScore}/100` : 'N/A'}
          icon={<TrendingUpIcon sx={{ fontSize: 32, color: 'success.main' }} />}
          color="#10B981"
          subtitle="roster average"
        />
      </Grid>
    </Grid>
  );
};
