import { Box, Typography, Grid, Card, CardContent } from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import PsychologyIcon from '@mui/icons-material/Psychology';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';

const suggestions = [
  {
    icon: <FitnessCenterIcon />,
    title: 'Balance Exercises',
    prompt: 'What are the best balance exercises for 8-year-olds?',
  },
  {
    icon: <PsychologyIcon />,
    title: 'Coaching Cues',
    prompt:
      'Give me coaching cues for an athlete with high sway during balance tests.',
  },
  {
    icon: <TipsAndUpdatesIcon />,
    title: 'Progression Ideas',
    prompt:
      'How can I progress balance training for athletes who can hold 20+ seconds?',
  },
  {
    icon: <PersonSearchIcon />,
    title: 'Athlete Analysis',
    prompt: 'Select an athlete above and ask: "How is this athlete progressing?"',
  },
];

interface Props {
  onSuggestionClick: (prompt: string) => void;
}

export function WelcomeMessage({ onSuggestionClick }: Props) {
  return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography variant="h5" gutterBottom>
        AI Coach Assistant
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}
      >
        I&apos;m here to help with balance training, exercise recommendations,
        and athlete development guidance based on LTAD principles.
      </Typography>

      <Grid container spacing={2} sx={{ maxWidth: 800, mx: 'auto' }}>
        {suggestions.map((suggestion, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3,
                },
              }}
              onClick={() => onSuggestionClick(suggestion.prompt)}
            >
              <CardContent
                sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}
              >
                <Box sx={{ color: 'primary.main' }}>{suggestion.icon}</Box>
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="subtitle2">{suggestion.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {suggestion.prompt}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
