import { useState, useEffect } from 'react';
import { Container, Box, Typography, Grid } from '@mui/material';
import { QuickStatsCards } from './components/QuickStatsCards';
import { RecentAssessments } from './components/RecentAssessments';
import { PendingConsentAlerts } from './components/PendingConsentAlerts';
import { AthleteQuickSelector } from './components/AthleteQuickSelector';
import { AIInsightsCard } from './components/AIInsightsCard';
import athletesService from '../../services/athletes';
import dashboardService from '../../services/dashboard';
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
interface AssessmentListItem {
  id: string;
  athleteId: string;
  athleteName: string;
  testType: string;
  legTested: string;
  createdAt: string;
  status: string;
  durationSeconds?: number;
  stabilityScore?: number;
}

export function Dashboard() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [recentAssessments, setRecentAssessments] = useState<AssessmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { showSnackbar } = useSnackbar();

  // Fetch dashboard data using optimized endpoint + athletes list
  // Key optimization: /dashboard eliminates N+1 queries for assessment athlete names
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch dashboard data and athletes in parallel
        // Dashboard endpoint returns stats + recent assessments (with athlete names pre-loaded)
        // Athletes call needed for AthleteQuickSelector component
        const [dashboardData, allAthletes] = await Promise.all([
          dashboardService.getDashboard(),
          athletesService.getAll(),
        ]);

        setAthletes(allAthletes);
        setRecentAssessments(dashboardData.recentAssessments);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        showSnackbar('Failed to load dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [showSnackbar]);

  // Calculate quick stats
  const totalAthletes = athletes.length;
  const pendingConsents = athletes.filter((a) => a.consentStatus === 'pending').length;
  const declinedConsents = athletes.filter((a) => a.consentStatus === 'declined').length;

  // Calculate from actual assessments
  const recentTests = recentAssessments.length;
  const avgBalanceScore = recentAssessments.length > 0
    ? recentAssessments.reduce((sum, a) => sum + (a.durationSeconds || 0), 0) / recentAssessments.length
    : 0;

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
