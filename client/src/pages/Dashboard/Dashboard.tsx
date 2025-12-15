import { useState, useEffect } from 'react';
import { Box, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { DashboardHeader } from './components/DashboardHeader';
import { QuickActionCards } from './components/QuickActionCards';
import { AthletesPanel } from './components/AthletesPanel';
import { RecentAssessmentsPanel } from './components/RecentAssessmentsPanel';
import { AthletePickerModal } from './components/AthletePickerModal';
import athletesService from '../../services/athletes';
import { dashboardApi } from '../../services/dashboardApi';
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
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [showAthletePickerModal, setShowAthletePickerModal] = useState(false);
  const { showSnackbar } = useSnackbar();

  // Dashboard data state
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Fetch dashboard data on mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch dashboard data from API and athletes list
        try {
          const [dashboardResponse, athletesData] = await Promise.all([
            dashboardApi.getData(),
            athletesService.getAll(),
          ]);
          setDashboardData(dashboardResponse);
          setAthletes(athletesData);
        } catch (apiErr: any) {
          // Fallback: If dashboard API fails, still try to fetch athletes
          console.warn('Dashboard API error:', apiErr);
          try {
            const athletesData = await athletesService.getAll();
            setAthletes(athletesData);
          } catch {
            // Both failed, show error
            throw apiErr;
          }
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

  // Use API data if available, otherwise fallback to empty array
  const recentAssessments = dashboardData?.recentAssessments || [];

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
      />

      {/* Quick Action Cards */}
      <QuickActionCards
        pendingAthletes={athletesNeedingConsent}
        onResendConsent={handleResendConsent}
        onStartAssessment={handleStartAssessment}
      />

      {/* Two Column Layout */}
      <Grid container spacing={3}>
        {/* Left Column - Athletes Panel */}
        <Grid item xs={12} md={4}>
          <AthletesPanel athletes={athletes} />
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
