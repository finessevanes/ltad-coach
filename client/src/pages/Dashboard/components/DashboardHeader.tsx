import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Skeleton,
} from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import { useNavigate } from 'react-router-dom';
import { Athlete } from '../../../types/athlete';
import { getGreeting } from '../../../utils/dateUtils';
import { ChatInput } from '../../AICoach/components/ChatInput';

interface DashboardHeaderProps {
  athletes: Athlete[];
  selectedAthlete: Athlete | null;
  onAthleteSelect: (athlete: Athlete | null) => void;
  loading?: boolean;
}

const aiTabs = [
  {
    icon: <FitnessCenterIcon sx={{ fontSize: 16 }} />,
    label: 'Balance Exercises',
    prompt: 'What balance exercises do you recommend',
  },
  {
    icon: <TrendingUpIcon sx={{ fontSize: 16 }} />,
    label: 'Coaching Cues',
    prompt: 'What are some coaching cues for',
  },
  {
    icon: <PersonSearchIcon sx={{ fontSize: 16 }} />,
    label: 'Athlete Analysis',
    prompt: 'Analyze the progress of',
  },
];

export function DashboardHeader({
  athletes,
  selectedAthlete,
  onAthleteSelect,
  loading = false,
}: DashboardHeaderProps) {
  const navigate = useNavigate();
  const [aiQuery, setAiQuery] = useState('');

  const handleAISubmit = (message: string, athleteId?: string) => {
    if (message.trim()) {
      // Navigate to AI Coach with initial query
      navigate('/ai-coach', {
        state: {
          initialQuery: message,
          athleteId: athleteId || selectedAthlete?.id,
        },
      });
    }
  };

  const handleTabClick = (prompt: string) => {
    setAiQuery(prompt);
  };

  if (loading) {
    return (
      <Box sx={{ mb: 4 }}>
        {/* Greeting Skeleton */}
        <Skeleton variant="text" width={250} height={48} sx={{ mb: 3 }} />

        {/* ChatInput Skeleton */}
        <Skeleton variant="rectangular" height={56} sx={{ mb: 2, borderRadius: 3 }} />

        {/* Action Buttons Skeleton */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant="rectangular" width={160} height={40} sx={{ borderRadius: 3 }} />
          <Skeleton variant="rectangular" width={140} height={40} sx={{ borderRadius: 3 }} />
          <Skeleton variant="rectangular" width={150} height={40} sx={{ borderRadius: 3 }} />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      {/* Greeting */}
      <Typography
        variant="h4"
        component="h1"
        sx={{ fontWeight: 600, mb: 3 }}
      >
        {getGreeting()} coach
      </Typography>

      {/* Chat Input */}
      <Box sx={{ mb: 2 }}>
        <ChatInput
          onSend={handleAISubmit}
          disabled={false}
          athletes={athletes}
          selectedAthlete={selectedAthlete}
          onAthleteSelect={onAthleteSelect}
          suggestedPrompt={aiQuery}
          onSuggestedPromptConsumed={() => setAiQuery('')}
        />
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        {aiTabs.map((tab) => (
          <Button
            key={tab.label}
            variant="outlined"
            startIcon={tab.icon}
            onClick={() => handleTabClick(tab.prompt)}
            sx={{
              borderRadius: 3,
              px: 2.5,
              py: 1,
              textTransform: 'none',
              borderColor: 'divider',
              color: 'text.primary',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
              },
            }}
          >
            {tab.label}
          </Button>
        ))}
      </Box>
    </Box>
  );
}
