import { useState, useEffect } from 'react';
import { Container, Box, Typography, Grid } from '@mui/material';
import { QuickStatsCards } from './components/QuickStatsCards';
import { RecentAssessments } from './components/RecentAssessments';
import { PendingConsentAlerts } from './components/PendingConsentAlerts';
import { AthleteQuickSelector } from './components/AthleteQuickSelector';
import { AIInsightsCard } from './components/AIInsightsCard';
import athletesService from '../../services/athletes';
import { Athlete } from '../../types/athlete';
import { useSnackbar } from '../../contexts/SnackbarContext';

/**
 * Dashboard component
 * Main overview page showing:
 * - Quick stats (total athletes, pending consents, recent tests, avg score)
 * - Recent assessments feed
 * - Pending consent alerts
 * - Athlete quick selector
 * - AI insights
 */
export function Dashboard() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | undefined>();
  const { showSnackbar } = useSnackbar();

  // Fetch athletes on mount
  useEffect(() => {
    const fetchAthletes = async () => {
      try {
        setLoading(true);
        const data = await athletesService.getAll();
        setAthletes(data);
      } catch (err) {
        console.error('Error fetching athletes:', err);
        showSnackbar('Failed to load dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchAthletes();
  }, []);

  // Calculate quick stats
  const totalAthletes = athletes.length;
  const pendingConsents = athletes.filter((a) => a.consentStatus === 'pending').length;
  const declinedConsents = athletes.filter((a) => a.consentStatus === 'declined').length;

  // Mock data for now - will be replaced with actual API calls
  const recentTests = 0; // TODO: Fetch from assessments API
  const avgBalanceScore = 0; // TODO: Calculate from assessments

  // Mock recent assessments - will be replaced with actual API call
  const recentAssessments: Array<{
    id: string;
    athleteName: string;
    testType: string;
    score?: number;
    status: 'completed' | 'processing' | 'failed';
    createdAt: string;
  }> = [
    // TODO: Fetch from backend API endpoint
  ];

  // Mock AI insights - will be replaced with actual Claude insights
  const aiInsights = athletes.length > 0 ? [
    {
      type: 'alert' as const,
      message: `You have ${totalAthletes} athletes in your roster. Start conducting assessments to get personalized AI insights!`,
    }
  ] : [];

  // Handle resend consent
  const handleResendConsent = async (athleteId: string) => {
    try {
      const athlete = athletes.find((a) => a.id === athleteId);
      await athletesService.resendConsent(athleteId);
      showSnackbar(
        `Consent email resent to ${athlete?.name}'s parent`,
        'success'
      );
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Failed to resend consent email';
      showSnackbar(errorMessage, 'error');
    }
  };

  // Athletes needing consent action
  const athletesNeedingConsent = athletes.filter(
    (a) => a.consentStatus === 'pending' || a.consentStatus === 'declined'
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Overview of your athlete roster and recent activity
        </Typography>
      </Box>

      {/* Quick Stats */}
      <Box sx={{ mb: 4 }}>
        <QuickStatsCards
          totalAthletes={totalAthletes}
          pendingConsents={pendingConsents + declinedConsents}
          recentTests={recentTests}
          avgBalanceScore={avgBalanceScore}
          loading={loading}
        />
      </Box>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Left Column - Athlete Selector */}
        <Grid item xs={12} md={4}>
          <AthleteQuickSelector
            athletes={athletes}
            selectedAthleteId={selectedAthleteId}
            onSelectAthlete={setSelectedAthleteId}
          />
        </Grid>

        {/* Right Column - Activity & Alerts */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            {/* Pending Consent Alerts */}
            {athletesNeedingConsent.length > 0 && (
              <Grid item xs={12}>
                <PendingConsentAlerts
                  athletes={athletesNeedingConsent}
                  onResendConsent={handleResendConsent}
                  loading={loading}
                />
              </Grid>
            )}

            {/* Recent Assessments */}
            <Grid item xs={12}>
              <RecentAssessments
                assessments={recentAssessments}
                loading={loading}
              />
            </Grid>

            {/* AI Insights */}
            <Grid item xs={12}>
              <AIInsightsCard insights={aiInsights} loading={loading} />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
}
