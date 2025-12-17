import { useState, useEffect } from 'react';
import { Box, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { DashboardGreeting } from './components/DashboardGreeting';
import { StartAssessmentButton } from './components/StartAssessmentButton';
import { ChatInput } from '../AICoach/components/ChatInput';
import { AthletesPanel } from './components/AthletesPanel';
import { TodaySchedule } from './components/TodaySchedule';
import { ActionsPanel } from './components/ActionsPanel';
import { AthletePickerModal } from './components/AthletePickerModal';
import { useDashboard } from '../../hooks/useDashboard';
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

  // Show error if fetch failed
  useEffect(() => {
    if (error) {
      showSnackbar('Failed to load dashboard data', 'error');
    }
  }, [error, showSnackbar]);

  // Extract data from dashboard response
  const athletes = dashboardData?.athletes || [];

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

  // Handle AI message submission
  const handleAISubmit = (message: string, athleteId?: string) => {
    if (message.trim()) {
      navigate('/ai-coach', {
        state: {
          initialQuery: message,
          athleteId: athleteId || selectedAthlete?.id,
        },
      });
    }
  };

  return (
    <Box sx={{ py: 5, px: { xs: 2, sm: 4 } }}>
      {/* Header Row: Greeting + Start Assessment Button */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 5,
          gap: 2,
        }}
      >
        <DashboardGreeting loading={loading} />
        <StartAssessmentButton onClick={handleStartAssessment} loading={loading} />
      </Box>

      {/* AI Chat Input - Full Width */}
      <Box sx={{ mb: 5 }}>
        <ChatInput
          onSend={handleAISubmit}
          disabled={false}
          athletes={athletes}
          selectedAthlete={selectedAthlete}
          onAthleteSelect={setSelectedAthlete}
        />
      </Box>

      {/* Divider */}
      <Box
        sx={{
          borderBottom: '1px solid',
          borderColor: 'grey.200',
          mb: 5,
        }}
      />

      {/* Three Column Layout */}
      <Grid container spacing={4}>
        {/* Left Column - Priority Roster */}
        <Grid item xs={12} md={3}>
          <AthletesPanel athletes={athletes} loading={loading} />
        </Grid>

        {/* Center Column - Today Schedule */}
        <Grid item xs={12} md={5}>
          <TodaySchedule loading={loading} />
        </Grid>

        {/* Right Column - Actions Panel */}
        <Grid item xs={12} md={4}>
          <ActionsPanel loading={loading} />
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
