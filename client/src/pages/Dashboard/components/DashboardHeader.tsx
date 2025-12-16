import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Autocomplete,
  Paper,
  IconButton,
  Chip,
  Skeleton,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useNavigate } from 'react-router-dom';
import { Athlete } from '../../../types/athlete';
import { getGreeting } from '../../../utils/dateUtils';

interface DashboardHeaderProps {
  athletes: Athlete[];
  selectedAthlete: Athlete | null;
  onAthleteSelect: (athlete: Athlete | null) => void;
  loading?: boolean;
}

const aiTabs = ['Balance Exercises', 'Coaching Cues', 'Athlete Analysis'];

export function DashboardHeader({
  athletes,
  selectedAthlete,
  onAthleteSelect,
  loading = false,
}: DashboardHeaderProps) {
  const navigate = useNavigate();
  const [aiQuery, setAiQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const handleAISubmit = () => {
    if (aiQuery.trim()) {
      // Navigate to AI Coach with initial query
      navigate('/ai-coach', {
        state: {
          initialQuery: aiQuery,
          athleteId: selectedAthlete?.id,
        },
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAISubmit();
    }
  };

  const handleTabClick = (tab: string) => {
    setActiveTab(activeTab === tab ? null : tab);
    // Optionally pre-fill query based on tab
    if (activeTab !== tab) {
      const tabPrompts: Record<string, string> = {
        'Balance Exercises': 'What balance exercises do you recommend',
        'Coaching Cues': 'What are some coaching cues for',
        'Athlete Analysis': 'Analyze the progress of',
      };
      setAiQuery(tabPrompts[tab] || '');
    }
  };

  if (loading) {
    return (
      <Box sx={{ mb: 4 }}>
        {/* Greeting Skeleton */}
        <Skeleton variant="text" width={250} height={48} sx={{ mb: 3 }} />

        {/* Athlete Selector Skeleton */}
        <Skeleton variant="rectangular" height={40} sx={{ mb: 2, borderRadius: 2 }} />

        {/* AI Input Field Skeleton */}
        <Skeleton variant="rectangular" height={56} sx={{ mb: 2, borderRadius: 3 }} />

        {/* Filter Tabs Skeleton */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant="rectangular" width={140} height={32} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rectangular" width={130} height={32} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rectangular" width={150} height={32} sx={{ borderRadius: 2 }} />
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

      {/* Athlete Context Dropdown */}
      <Autocomplete
        options={athletes}
        value={selectedAthlete}
        onChange={(_, value) => onAthleteSelect(value)}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        popupIcon={<KeyboardArrowDownIcon />}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Select athlete for context (optional)"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: 'background.paper',
              },
            }}
          />
        )}
        renderOption={(props, option) => (
          <li {...props} key={option.id}>
            <Box>
              <Typography variant="body2">{option.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                Age {option.age} {option.gender}
              </Typography>
            </Box>
          </li>
        )}
        sx={{ mb: 2 }}
      />

      {/* AI Input Field */}
      <Paper
        elevation={0}
        sx={{
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 0.5,
          pl: 2,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'grey.200',
        }}
      >
        <TextField
          fullWidth
          value={aiQuery}
          onChange={(e) => setAiQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask for recommendations or insights"
          variant="standard"
          InputProps={{
            disableUnderline: true,
          }}
          sx={{
            '& .MuiInputBase-input': {
              py: 1,
            },
          }}
        />
        <IconButton
          color="primary"
          onClick={handleAISubmit}
          disabled={!aiQuery.trim()}
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
            '&.Mui-disabled': {
              bgcolor: 'grey.300',
              color: 'grey.500',
            },
          }}
        >
          <SendIcon fontSize="small" />
        </IconButton>
      </Paper>

      {/* Filter Tabs */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {aiTabs.map((tab) => (
          <Chip
            key={tab}
            label={tab}
            onClick={() => handleTabClick(tab)}
            color={activeTab === tab ? 'primary' : 'default'}
            variant={activeTab === tab ? 'filled' : 'outlined'}
            sx={{
              borderRadius: 2,
              fontWeight: 500,
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
