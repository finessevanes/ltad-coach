import { Box, Typography, Paper, Button, Grid } from '@mui/material';
import SportsIcon from '@mui/icons-material/Sports';
import AssessmentIcon from '@mui/icons-material/Assessment';
import GroupsIcon from '@mui/icons-material/Groups';

export function Home() {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome to AI Coach
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Computer vision athletic assessment platform for youth sports coaches
        (ages 5-13). Track athlete progress, analyze balance tests, and provide
        data-driven coaching feedback.
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <GroupsIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Manage Athletes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add and track your athletes with parental consent management.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <SportsIcon sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Conduct Assessments
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Record One-Leg Balance Tests with real-time pose detection.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <AssessmentIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              AI-Powered Insights
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Get personalized coaching feedback powered by Claude AI.
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button variant="contained" size="large" disabled>
          Get Started (Login Required)
        </Button>
        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
          Authentication will be available after Phase 2
        </Typography>
      </Box>
    </Box>
  );
}
