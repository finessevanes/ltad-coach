import { Paper, Typography, Box, Button, ToggleButton, ToggleButtonGroup, Alert } from '@mui/material';
import { LegTested } from '../../../types/assessment';

interface TestSetupProps {
  athleteId: string;
  legTested: LegTested;
  onLegSelect: (leg: LegTested) => void;
  onContinue: () => void;
  onBack: () => void;
}

export const TestSetup: React.FC<TestSetupProps> = ({
  legTested,
  onLegSelect,
  onContinue,
  onBack,
}) => {
  return (
    <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        One-Leg Balance Test
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Test Protocol:</strong>
          </Typography>
          <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
            <li>Athlete stands on one leg for up to 30 seconds</li>
            <li>Arms extended out wide (T-pose), raised knee up</li>
            <li>Eyes open, focused on point ahead</li>
            <li>Test ends if foot touches down or support foot moves</li>
          </ul>
        </Box>
      </Alert>

      <Typography variant="subtitle1" gutterBottom>
        Select Standing Leg
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Which leg will the athlete stand on?
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block', fontStyle: 'italic' }}>
        Left leg = Stand on left, raise right knee | Right leg = Stand on right, raise left knee
      </Typography>

      <ToggleButtonGroup
        value={legTested}
        exclusive
        onChange={(_, value) => value && onLegSelect(value)}
        fullWidth
        sx={{ mb: 4 }}
      >
        <ToggleButton value="left">Left Leg</ToggleButton>
        <ToggleButton value="right">Right Leg</ToggleButton>
      </ToggleButtonGroup>

      <Box display="flex" gap={2} justifyContent="space-between">
        <Button variant="outlined" onClick={onBack}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onContinue}>
          Start Test
        </Button>
      </Box>
    </Paper>
  );
};
