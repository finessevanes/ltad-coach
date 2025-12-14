import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Chip,
  Card,
  CardContent,
  Grid,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
  Description as DescriptionIcon,
  MoreVert as MoreVertIcon,
  Balance as BalanceIcon,
  Timer as TimerIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export const AssessmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState([]);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    // TODO: Call GET /assessments to fetch all completed assessments
    // Mock data for now
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  const templates = [
    { id: 1, name: 'Balance Test', description: 'Single-leg stability assessment', icon: BalanceIcon },
    // Future templates: Coordination, Agility, Flexibility
  ];

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 4 }}
      >
        <Box>
          <Typography variant="h2" sx={{ mb: 1 }}>
            Assessments
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Conduct and review LTAD foundation tests
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={() => navigate('/athletes')}
        >
          New Assessment
        </Button>
      </Stack>

      {/* Completed Assessments */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Completed Assessments
        </Typography>

        <Stack spacing={3}>
          {/* Example completed card */}
          <Card>
            <CardContent>
              <Stack direction="row" spacing={3} alignItems="flex-start">
                {/* Success Icon */}
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '16px',
                    bgcolor: '#ECFDF5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <CheckCircleIcon sx={{ fontSize: 32, color: '#10B981' }} />
                </Box>

                {/* Content */}
                <Box flex={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h5" sx={{ mb: 0.5 }}>
                        Balance Test - Sample Athlete
                      </Typography>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Dec 10, 2024 • 3:45 PM
                        </Typography>
                        <Chip label="Score: 4/5" color="success" size="small" />
                      </Stack>

                      {/* Quick Metrics */}
                      <Stack direction="row" spacing={3}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <TimerIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="caption">Duration: 12.4s</Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <TrendingUpIcon sx={{ fontSize: 16, color: '#10B981' }} />
                          <Typography variant="caption" sx={{ color: '#10B981' }}>
                            Meets expectations
                          </Typography>
                        </Stack>
                      </Stack>
                    </Box>

                    {/* Actions */}
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        onClick={() => navigate('/assessments/sample123')}
                      >
                        View Results
                      </Button>
                      <Button variant="text" startIcon={<DescriptionIcon />}>
                        Generate Report
                      </Button>
                      <IconButton>
                        <MoreVertIcon />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Empty state card */}
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 10 }}>
              <CheckCircleIcon sx={{ fontSize: 64, color: '#BDBDBD', mb: 2 }} />
              <Typography variant="h5" sx={{ mb: 1 }}>
                No completed assessments yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Complete assessments to track athlete progress
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      </Box>

      {/* Assessment Templates */}
      <Box>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Assessment Templates
        </Typography>

        <Grid container spacing={3}>
          {templates.map((template) => (
            <Grid item xs={12} sm={6} md={3} key={template.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  textAlign: 'center',
                  '&:hover': {
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s ease'
                  }
                }}
                onClick={() => navigate('/athletes')}
              >
                <CardContent>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      bgcolor: '#EFF6FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto',
                      mb: 2
                    }}
                  >
                    <template.icon sx={{ fontSize: 40, color: '#2563EB' }} />
                  </Box>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {template.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {template.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};
