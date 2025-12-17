import { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import FlagIcon from '@mui/icons-material/Flag';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';

const suggestions = [
  {
    icon: <FitnessCenterIcon sx={{ fontSize: 16 }} />,
    title: 'Exercise',
    prompt: 'What are the best balance exercises for 8-year-olds?',
  },
  {
    icon: <PersonSearchIcon sx={{ fontSize: 16 }} />,
    title: 'Analyze',
    prompt: 'Select an athlete above and ask: "How is this athlete progressing?"',
  },
  {
    icon: <TrendingUpIcon sx={{ fontSize: 16 }} />,
    title: 'Progress',
    prompt: 'How can I progress balance training for athletes who can hold 20+ seconds?',
  },
];

interface Props {
  onSuggestionClick: (prompt: string) => void;
}

export function WelcomeMessage({ onSuggestionClick }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  return (
    <Box
      sx={{
        textAlign: 'center',
        py: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Flag Icon */}
      <FlagIcon
        sx={{
          fontSize: 64,
          color: '#BDBDBD',
          mb: 3,
        }}
      />

      {/* Main Title */}
      <Typography
        variant="h3"
        gutterBottom
        sx={{
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          maxWidth: 700,
          mx: 'auto',
          mb: 2,
          lineHeight: 1.2,
          fontSize: { xs: '1.75rem', md: '2.25rem' },
        }}
      >
        AI-Powered Coaching Intelligence
      </Typography>

      {/* Subtitle */}
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{
          mb: 4,
          maxWidth: 600,
          mx: 'auto',
          lineHeight: 1.6,
          fontSize: '1rem',
        }}
      >
        Ask questions about your athletes&apos; assessments, identify performance gaps,
        and get personalized recommendations to help every player reach their full potential
      </Typography>

      {/* Suggestion Buttons */}
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {suggestions.map((suggestion, index) => {
          const isActive = activeIndex === index;
          return (
            <Button
              key={index}
              variant="outlined"
              startIcon={suggestion.icon}
              onClick={() => {
                setActiveIndex(index);
                onSuggestionClick(suggestion.prompt);
              }}
              sx={{
                borderRadius: 1.5,
                px: 3,
                py: 1.25,
                textTransform: 'none',
                fontWeight: 600,
                borderColor: isActive ? 'primary.main' : 'grey.300',
                color: isActive ? 'black' : 'text.primary',
                bgcolor: isActive ? 'white' : 'transparent',
                '&:hover': {
                  borderColor: 'primary.main',
                  color: 'black',
                  bgcolor: 'white',
                },
              }}
            >
              {suggestion.title}
            </Button>
          );
        })}
      </Box>

      {/* Disclaimer */}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          mt: 2,
          opacity: 0.6,
        }}
      >
        AI-generated insights may be inaccurate. Verify important training data.
      </Typography>
    </Box>
  );
}
