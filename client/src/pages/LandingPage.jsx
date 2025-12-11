import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Stack,
} from '@mui/material';
import SportsIcon from '@mui/icons-material/Sports';
import AssessmentIcon from '@mui/icons-material/Assessment';
import VideocamIcon from '@mui/icons-material/Videocam';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { ROUTES } from '../utils/routes';
import { useAuth } from '../hooks/useAuth';
import { useEffect } from 'react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate(ROUTES.DASHBOARD);
    }
  }, [currentUser, navigate]);

  const features = [
    {
      icon: <VideocamIcon sx={{ fontSize: 48, color: 'white' }} />,
      title: 'AI-Powered Video Analysis',
      description: 'Advanced motion tracking and posture analysis using cutting-edge AI technology',
    },
    {
      icon: <AssessmentIcon sx={{ fontSize: 48, color: 'white' }} />,
      title: 'LTAD Framework',
      description: 'Assessments based on Long-Term Athlete Development principles',
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 48, color: 'white' }} />,
      title: 'Progress Tracking',
      description: 'Monitor athlete development over time with detailed reports',
    },
    {
      icon: <SportsIcon sx={{ fontSize: 48, color: 'white' }} />,
      title: 'Youth Sports Focused',
      description: 'Designed specifically for athletes aged 5-18',
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: { xs: 10, md: 15 },
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            animation: 'pulse 4s ease-in-out infinite',
          },
          '@keyframes pulse': {
            '0%, 100%': { opacity: 0.5 },
            '50%': { opacity: 0.8 },
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h1"
            component="h1"
            gutterBottom
            fontWeight="bold"
            sx={{
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
              animation: 'fadeInUp 0.8s ease-out',
              '@keyframes fadeInUp': {
                from: { opacity: 0, transform: 'translateY(30px)' },
                to: { opacity: 1, transform: 'translateY(0)' },
              },
            }}
          >
            LTAD Coach
          </Typography>
          <Typography
            variant="h5"
            sx={{
              mb: 4,
              opacity: 0.95,
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
              animation: 'fadeInUp 0.8s ease-out 0.2s backwards',
            }}
          >
            AI-Powered Athletic Assessment Platform for Youth Sports
          </Typography>
          <Typography
            variant="body1"
            sx={{
              mb: 6,
              maxWidth: 650,
              mx: 'auto',
              opacity: 0.9,
              fontSize: { xs: '1rem', sm: '1.125rem' },
              lineHeight: 1.7,
              animation: 'fadeInUp 0.8s ease-out 0.4s backwards',
            }}
          >
            Leverage artificial intelligence to assess and track athletic development
            in young athletes using video analysis and LTAD principles.
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
            sx={{
              animation: 'fadeInUp 0.8s ease-out 0.6s backwards',
            }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate(ROUTES.REGISTER)}
              sx={{
                bgcolor: 'white',
                color: '#667eea',
                '&:hover': {
                  bgcolor: 'grey.50',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                },
                px: 5,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 700,
                borderRadius: 3,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              Get Started Free
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate(ROUTES.LOGIN)}
              sx={{
                borderColor: 'white',
                borderWidth: 2,
                color: 'white',
                '&:hover': {
                  borderColor: 'white',
                  borderWidth: 2,
                  bgcolor: 'rgba(255,255,255,0.15)',
                  transform: 'translateY(-2px)',
                },
                px: 5,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 700,
                borderRadius: 3,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              Sign In
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Typography
          variant="h2"
          component="h2"
          textAlign="center"
          gutterBottom
          fontWeight="bold"
          sx={{
            mb: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Features
        </Typography>
        <Typography
          variant="h6"
          textAlign="center"
          color="text.secondary"
          sx={{ mb: 8, maxWidth: 700, mx: 'auto', fontWeight: 400 }}
        >
          Everything you need to assess, track, and develop young athletes
        </Typography>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  textAlign: 'center',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 40px rgba(102, 126, 234, 0.15)',
                    borderColor: 'primary.main',
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 4 }}>
                  <Box
                    sx={{
                      mb: 3,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      margin: '0 auto',
                      transition: 'transform 0.3s ease',
                      '&:hover': {
                        transform: 'rotate(10deg) scale(1.1)',
                      },
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom fontWeight="700" sx={{ mb: 2 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          py: { xs: 8, md: 12 },
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-50%',
            right: '-10%',
            width: '40%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
            animation: 'float 6s ease-in-out infinite',
          },
          '@keyframes float': {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-20px)' },
          },
        }}
      >
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h3"
            gutterBottom
            fontWeight="bold"
            color="white"
            sx={{ mb: 3, fontSize: { xs: '2rem', md: '2.5rem' } }}
          >
            Ready to Get Started?
          </Typography>
          <Typography
            variant="h6"
            color="white"
            sx={{ mb: 5, opacity: 0.95, maxWidth: 600, mx: 'auto', fontWeight: 400 }}
          >
            Join coaches who are using AI to enhance athletic development and transform youth sports training
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate(ROUTES.REGISTER)}
            sx={{
              bgcolor: 'white',
              color: '#667eea',
              px: 6,
              py: 2,
              fontSize: '1.125rem',
              fontWeight: 700,
              borderRadius: 3,
              '&:hover': {
                bgcolor: 'grey.50',
                transform: 'translateY(-3px)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            Create Free Account
          </Button>
        </Container>
      </Box>
    </Box>
  );
}
