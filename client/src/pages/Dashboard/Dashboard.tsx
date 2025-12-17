import { useState } from 'react';
import { Box, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { DashboardHeader } from './components/DashboardHeader';
import { QuickActionCards } from './components/QuickActionCards';
import { AthletesPanel } from './components/AthletesPanel';
import { RecentAssessmentsPanel } from './components/RecentAssessmentsPanel';
import { AthletePickerModal } from './components/AthletePickerModal';
import { useDashboard } from '../../hooks/useDashboard';
import { useResendConsent } from '../../hooks/useAthletes';
import { Athlete } from '../../types/athlete';
import { useSnackbar } from '../../contexts/SnackbarContext';

/**
 * Dashboard component - Redesigned layout
 * Features:
 * - Header with greeting, athlete selector, and AI quick-access
 * - Quick action cards (New Assessment, Pending Consents, Upcoming Event)
 * - Two-column layout with Athletes panel and Recent Assessments
 */

export function Dashboard() {
  const navigate = useNavigate();
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [showAthletePickerModal, setShowAthletePickerModal] = useState(false);
  const { showSnackbar } = useSnackbar();

  // Fetch dashboard data with React Query (automatic caching & deduplication)
  const { data: dashboardData, isLoading: loading, error } = useDashboard();

  // Mutation for resending consent
  const resendConsentMutation = useResendConsent();

  // Show error if fetch failed
  if (error) {
    showSnackbar('Failed to load dashboard data', 'error');
  }

  // Extract data from dashboard response
  const athletes = dashboardData?.athletes || [];
  const recentAssessments = dashboardData?.recentAssessments || [];

  // Handle resend consent with React Query mutation
  const handleResendConsent = async (athleteId: string) => {
    const athlete = athletes.find((a) => a.id === athleteId);

    resendConsentMutation.mutate(athleteId, {
      onSuccess: () => {
        showSnackbar(
          `Consent email resent to ${athlete?.name}'s parent`,
          'success'
        );
      },
      onError: (err: any) => {
        const errorMessage =
          err.response?.data?.message || 'Failed to resend consent email';
        showSnackbar(errorMessage, 'error');
      },
    });
  };

  // Athletes needing consent action
  const athletesNeedingConsent = athletes.filter(
    (a) => a.consentStatus === 'pending' || a.consentStatus === 'declined'
  );

  // Handle starting assessment
  const handleStartAssessment = () => {
    if (selectedAthlete) {
      // Navigate directly to assessment if athlete is selected
      navigate(`/assess/${selectedAthlete.id}`);
    } else {
      // Show athlete picker modal
      setShowAthletePickerModal(true);
    }
  };

  // Handle athlete selection from modal
  const handleAthleteSelected = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    navigate(`/assess/${athlete.id}`);
  };

  return (
    <Box sx={{ py: 3, px: { xs: 2, sm: 4 } }}>
      {/* Dashboard Header */}
      <DashboardHeader
        athletes={athletes}
        selectedAthlete={selectedAthlete}
        onAthleteSelect={setSelectedAthlete}
        loading={loading}
      />

      {/* Quick Action Cards */}
      <QuickActionCards
        pendingAthletes={athletesNeedingConsent}
        onResendConsent={handleResendConsent}
        onStartAssessment={handleStartAssessment}
        loading={loading}
      />

      {/* Two Column Layout */}
      <Grid container spacing={3}>
        {/* Left Column - Athletes Panel */}
        <Grid item xs={12} md={4}>
          <AthletesPanel athletes={athletes} loading={loading} />
        </Grid>

        {/* Right Column - Recent Assessments */}
        <Grid item xs={12} md={8}>
          <RecentAssessmentsPanel
            assessments={recentAssessments}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Athlete Picker Modal */}
      <AthletePickerModal
        open={showAthletePickerModal}
        onClose={() => setShowAthletePickerModal(false)}
        athletes={athletes}
        onSelect={handleAthleteSelected}
      />
    </Box>
  );
}
