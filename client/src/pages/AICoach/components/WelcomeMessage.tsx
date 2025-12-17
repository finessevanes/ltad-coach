import { Box, Typography, Button, Chip } from '@mui/material';
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
          fontSize: 40,
          color: 'text.secondary',
          mb: 2,
          opacity: 0.7,
        }}
      />

      {/* Main Title */}
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontWeight: 600,
          maxWidth: 600,
          mx: 'auto',
          mb: 1.5,
          lineHeight: 1.3,
        }}
      >
        Elevate Your Athletes with AI-Powered Coaching Intelligence
      </Typography>

      {/* Subtitle */}
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{
          mb: 3,
          maxWidth: 550,
          mx: 'auto',
          lineHeight: 1.6,
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
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outlined"
            startIcon={suggestion.icon}
            onClick={() => onSuggestionClick(suggestion.prompt)}
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
            {suggestion.title}
          </Button>
        ))}
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
