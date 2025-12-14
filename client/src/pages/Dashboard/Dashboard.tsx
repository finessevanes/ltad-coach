import { useState, useEffect } from 'react';
import { Container, Box, Typography, Grid } from '@mui/material';
import { QuickStatsCards } from './components/QuickStatsCards';
import { RecentAssessments } from './components/RecentAssessments';
import { PendingConsentAlerts } from './components/PendingConsentAlerts';
import { AthleteQuickSelector } from './components/AthleteQuickSelector';
import { AIInsightsCard } from './components/AIInsightsCard';
import athletesService from '../../services/athletes';
import { dashboardApi } from '../../services/dashboardApi';
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

  // Dashboard data state
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Fetch dashboard data on mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // TODO: Once BE-015 is implemented, use dashboardApi.getData()
        // For now, fall back to fetching athletes directly
        try {
          const data = await dashboardApi.getData();
          setDashboardData(data.data);
          setAthletes(data.data.athletes || []);
        } catch (apiErr: any) {
          // Fallback: Backend endpoint not ready, use current approach
          // Suppress 404 error since it's expected until BE-015 is implemented
          if (apiErr.response?.status !== 404) {
            console.warn('Dashboard API error:', apiErr);
          }
          const athletesData = await athletesService.getAll();
          setAthletes(athletesData);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        showSnackbar('Failed to load dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Calculate quick stats (fallback if API not available)
  const totalAthletes = dashboardData?.stats?.totalAthletes || athletes.length;
  const pendingConsents = dashboardData?.stats?.pendingConsent ||
    athletes.filter((a) => a.consentStatus === 'pending').length;
  const declinedConsents = athletes.filter((a) => a.consentStatus === 'declined').length;
  const recentTests = dashboardData?.stats?.assessmentsThisWeek || 0;
  const avgBalanceScore = dashboardData?.stats?.averageScore || 0;

  // Use API data if available, otherwise fallback to empty array
  const recentAssessments = dashboardData?.recentAssessments || [];

  // AI insights from API or fallback message
  const aiInsights = dashboardData?.aiInsights
    ? [{ type: 'alert' as const, message: dashboardData.aiInsights }]
    : athletes.length > 0
      ? [{
          type: 'alert' as const,
          message: `You have ${totalAthletes} athletes in your roster. Start conducting assessments to get personalized AI insights!`,
        }]
      : [];

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
