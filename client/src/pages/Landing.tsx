import { Box, Button, Container, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import TimelineIcon from '@mui/icons-material/Timeline';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { useState, useEffect } from 'react';

export function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'white' }}>
      {/* Full Width Nav Bar */}
      <Box
        component="nav"
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1001,
          py: 3,
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          opacity: 0,
          animation: 'fadeInDown 0.6s ease-out forwards',
          '@keyframes fadeInDown': {
            '0%': {
              opacity: 0,
              transform: 'translateY(-10px)',
            },
            '100%': {
              opacity: 1,
              transform: 'translateY(0)',
            },
          },
        }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: { xs: 3, md: 8 },
            }}
          >
            {/* Logo */}
            <Typography
              variant="h5"
              sx={{
                fontWeight: 500,
                color: '#000000',
                fontFamily: 'Jost, sans-serif',
                fontSize: '20px',
              }}
            >
              CoachLens
            </Typography>

            {/* Right Side: Sign In + CTA */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                onClick={() => navigate('/login')}
                sx={{
                  color: '#2D2D2D',
                  fontFamily: 'Jost, sans-serif',
                  fontWeight: 600,
                  fontSize: '15px',
                  textTransform: 'none',
                  px: 3,
                  py: 1,
                  borderRadius: '100px',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    bgcolor: 'rgba(37, 99, 235, 0.08)',
                    color: '#2563EB',
                  },
                }}
              >
                Sign In
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/register')}
                sx={{
                  bgcolor: '#2563EB',
                  color: 'white',
                  fontFamily: 'Jost, sans-serif',
                  fontWeight: 600,
                  fontSize: '14px',
                  textTransform: 'none',
                  px: 3,
                  py: 1.25,
                  borderRadius: '100px',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    bgcolor: '#1d4ed8',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                  },
                }}
              >
                Start Free Trial →
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Hero Section */}
      <Container maxWidth="xl" sx={{ mt: 12, px: { xs: 3, md: 8 } }}>
        <Box
          sx={{
            textAlign: 'center',
            mb: 6,
          }}
        >
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '72px', md: '140px', lg: '160px' },
              fontWeight: 500,
              lineHeight: 1.05,
              color: '#000000',
              fontFamily: 'Jost, sans-serif',
              mb: 10,
              letterSpacing: '-0.02em',
              opacity: 0,
              animation: 'fadeInUp 0.8s ease-out 0.2s forwards',
              '@keyframes fadeInUp': {
                '0%': {
                  opacity: 0,
                  transform: 'translateY(30px)',
                },
                '100%': {
                  opacity: 1,
                  transform: 'translateY(0)',
                },
              },
            }}
          >
            Keep Athletes in the Game
          </Typography>

          {/* Dashboard Screenshot */}
          <Box
            sx={{
              position: 'relative',
              maxWidth: '1100px',
              mx: 'auto',
              mt: 2,
              opacity: 0,
              animation: 'fadeInUp 0.8s ease-out 0.4s forwards',
              '@keyframes fadeInUp': {
                '0%': {
                  opacity: 0,
                  transform: 'translateY(30px)',
                },
                '100%': {
                  opacity: 1,
                  transform: 'translateY(0)',
                },
              },
            }}
          >
            {/* Decorative background blob */}
            <Box
              sx={{
                position: 'absolute',
                width: '120%',
                height: '280px',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                bgcolor: '#9CA3C4',
                borderRadius: '300px',
                zIndex: 0,
              }}
            />

            {/* Dashboard Screenshot Container */}
            <Box
              sx={{
                position: 'relative',
                zIndex: 1,
                bgcolor: '#E8EEF3',
                borderRadius: '20px',
                border: '16px solid #1A1A1A',
                overflow: 'hidden',
                boxShadow: '0 30px 80px rgba(0,0,0,0.2)',
                backgroundImage: 'linear-gradient(180deg, rgba(200, 220, 235, 0.3) 0%, rgba(232, 238, 243, 0.8) 100%)',
              }}
            >
              {/* Dashboard Content - with placeholder for background image */}
              <Box
                sx={{
                  p: 5,
                  position: 'relative',
                  minHeight: '400px',
                  // Add your outdoor/cloud background image here:
                  // backgroundImage: 'url(/path/to/outdoor-clouds-image.jpg)',
                  // backgroundSize: 'cover',
                  // backgroundPosition: 'center',
                }}
              >
                {/* Breadcrumb */}
                <Typography
                  sx={{
                    fontSize: '13px',
                    color: 'rgba(0, 0, 0, 0.5)',
                    mb: 4,
                    fontFamily: 'Jost, sans-serif',
                  }}
                >
                  Reports › Overview
                </Typography>

                {/* Main Stat */}
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mb: 2 }}>
                  <Typography
                    sx={{
                      fontSize: '72px',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      fontFamily: 'Jost, sans-serif',
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    78%
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '20px',
                      fontWeight: 400,
                      color: '#FFFFFF',
                      fontFamily: 'Jost, sans-serif',
                    }}
                  >
                    Efficiency Improvements
                  </Typography>
                </Box>

                {/* Chart Area */}
                <Box
                  sx={{
                    mt: 5,
                    height: '220px',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    gap: 6,
                    position: 'relative',
                  }}
                >
                  {/* Year Labels */}
                  <Box sx={{ position: 'absolute', bottom: -35, left: 0, right: 0, display: 'flex', justifyContent: 'space-between' }}>
                    {['2021', '2022', '2023', '2024'].map((year) => (
                      <Typography key={year} sx={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)', fontFamily: 'Jost, sans-serif' }}>
                        {year}
                      </Typography>
                    ))}
                  </Box>

                  {/* Bar Chart Visualization with line chart overlay */}
                  {[100, 140, 170, 210].map((height, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        width: '100%',
                        height: `${height}px`,
                        bgcolor: 'rgba(255, 255, 255, 0.4)',
                        borderRadius: '6px',
                        position: 'relative',
                        backdropFilter: 'blur(10px)',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: '-10px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '10px',
                          height: '10px',
                          bgcolor: 'white',
                          borderRadius: '50%',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        },
                      }}
                    />
                  ))}

                  {/* Dropdown in top right */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -50,
                      right: 0,
                      bgcolor: 'rgba(255, 255, 255, 0.3)',
                      backdropFilter: 'blur(10px)',
                      px: 3,
                      py: 1.5,
                      borderRadius: '24px',
                      fontSize: '13px',
                      color: 'rgba(0, 0, 0, 0.7)',
                      fontFamily: 'Jost, sans-serif',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                    }}
                  >
                    All Regions (33) ▼
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>

      {/* Benefits Section */}
      <Container maxWidth="lg" sx={{ mb: 24, mt: 20 }}>
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#2563EB',
            fontFamily: 'Jost, sans-serif',
            mb: 4,
          }}
        >
          Benefits
        </Typography>
        <Typography
          variant="h2"
          sx={{
            fontSize: { xs: '36px', md: '56px' },
            fontWeight: 400,
            lineHeight: 1.2,
            color: '#2D2D2D',
            fontFamily: 'Jost, sans-serif',
            mb: 3,
          }}
        >
          We've cracked the code.
        </Typography>
        <Typography
          sx={{
            fontSize: '16px',
            color: '#6B6B6B',
            fontFamily: 'Jost, sans-serif',
            mb: 8,
            maxWidth: '900px',
          }}
        >
          Showing progress builds confidence and retains athletes. Computer vision meets expert coaching to give every middle schooler the objective feedback they need to stay motivated.
        </Typography>

        {/* Feature Cards Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 4,
            mt: 6,
          }}
        >
          {/* Card 1 */}
          <Box>
            <Box
              sx={{
                width: '48px',
                height: '48px',
                bgcolor: '#EFF6FF',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
              }}
            >
              <GpsFixedIcon sx={{ fontSize: 24, color: '#2563EB' }} />
            </Box>
            <Typography
              sx={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#2D2D2D',
                fontFamily: 'Jost, sans-serif',
                mb: 2,
              }}
            >
              Real-Time Movement Analysis
            </Typography>
            <Typography
              sx={{
                fontSize: '16px',
                color: '#6B6B6B',
                fontFamily: 'Jost, sans-serif',
                lineHeight: 1.6,
              }}
            >
              Intelligent pose detection tracks balance, stability, and form with precision that rivals lab equipment, right on your practice field.
            </Typography>
          </Box>

          {/* Card 2 */}
          <Box>
            <Box
              sx={{
                width: '48px',
                height: '48px',
                bgcolor: '#EFF6FF',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
              }}
            >
              <TimelineIcon sx={{ fontSize: 24, color: '#2563EB' }} />
            </Box>
            <Typography
              sx={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#2D2D2D',
                fontFamily: 'Jost, sans-serif',
                mb: 2,
              }}
            >
              Track Every Athlete's Journey
            </Typography>
            <Typography
              sx={{
                fontSize: '16px',
                color: '#6B6B6B',
                fontFamily: 'Jost, sans-serif',
                lineHeight: 1.6,
              }}
            >
              Automated progress reports show parents and athletes exactly how they're improving, building motivation through measurable results.
            </Typography>
          </Box>

          {/* Card 3 */}
          <Box>
            <Box
              sx={{
                width: '48px',
                height: '48px',
                bgcolor: '#EFF6FF',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
              }}
            >
              <ChatBubbleOutlineIcon sx={{ fontSize: 24, color: '#2563EB' }} />
            </Box>
            <Typography
              sx={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#2D2D2D',
                fontFamily: 'Jost, sans-serif',
                mb: 2,
              }}
            >
              Instant Coach Feedback
            </Typography>
            <Typography
              sx={{
                fontSize: '16px',
                color: '#6B6B6B',
                fontFamily: 'Jost, sans-serif',
                lineHeight: 1.6,
              }}
            >
              Skip the guesswork. See live metrics during sessions and add your expert insights to AI-generated reports in minutes, not hours.
            </Typography>
          </Box>

          {/* Card 4 */}
          <Box>
            <Box
              sx={{
                width: '48px',
                height: '48px',
                bgcolor: '#EFF6FF',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
              }}
            >
              <TrendingUpIcon sx={{ fontSize: 24, color: '#2563EB' }} />
            </Box>
            <Typography
              sx={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#2D2D2D',
                fontFamily: 'Jost, sans-serif',
                mb: 2,
              }}
            >
              Built on LTAD Principles
            </Typography>
            <Typography
              sx={{
                fontSize: '16px',
                color: '#6B6B6B',
                fontFamily: 'Jost, sans-serif',
                lineHeight: 1.6,
              }}
            >
              Assessments aligned with Long-Term Athlete Development frameworks ensure age-appropriate evaluation that builds foundation first.
            </Typography>
          </Box>
        </Box>
      </Container>

      {/* Divider */}
      <Box sx={{ borderTop: '1px solid #E5E5E5', my: 20 }} />

      {/* First Image - Full Width */}
      <Container maxWidth="lg" sx={{ mb: 24 }}>
        <Box
          sx={{
            width: '100%',
            height: { xs: '350px', md: '550px' },
            bgcolor: '#F5F5F5',
            borderRadius: '24px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <Box
            component="img"
            src="/running-athletes.png"
            alt="Young athletes running"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </Box>
      </Container>

      {/* Testimonial Section with Image */}
      <Container maxWidth="lg" sx={{ mb: 24 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: { xs: 6, md: 8 },
            alignItems: 'center',
          }}
        >
          {/* Left - Testimonial Quote */}
          <Box>
            <Typography
              sx={{
                fontSize: { xs: '28px', md: '36px' },
                fontWeight: 400,
                color: '#2D2D2D',
                fontFamily: 'Jost, sans-serif',
                fontStyle: 'italic',
                lineHeight: 1.5,
                mb: 4,
              }}
            >
              "My athletes finally see their progress in real numbers. Parents love the reports, and I'm spending less time on paperwork."
            </Typography>
            <Typography
              sx={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#6B6B6B',
                fontFamily: 'Jost, sans-serif',
              }}
            >
              — Coach Sarah M.
            </Typography>
            <Typography
              sx={{
                fontSize: '16px',
                color: '#9E9E9E',
                fontFamily: 'Jost, sans-serif',
              }}
            >
              Middle School Soccer
            </Typography>
          </Box>

          {/* Right - Basketball Image */}
          <Box
            sx={{
              width: '100%',
              height: { xs: '350px', md: '500px' },
              bgcolor: '#F5F5F5',
              borderRadius: '24px',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <Box
              component="img"
              src="/basketball-player.png"
              alt="Young athlete playing basketball"
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </Box>
        </Box>
      </Container>

      {/* Final CTA Section */}
      <Container maxWidth="lg" sx={{ mb: 20, mt: 24 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '36px', md: '48px' },
              fontWeight: 400,
              lineHeight: 1.2,
              color: '#2D2D2D',
              fontFamily: 'Jost, sans-serif',
              mb: 3,
            }}
          >
            Ready to keep your athletes motivated?
          </Typography>
          <Typography
            sx={{
              fontSize: '18px',
              color: '#6B6B6B',
              fontFamily: 'Jost, sans-serif',
              mb: 5,
              maxWidth: '700px',
              mx: 'auto',
            }}
          >
            Join coaches who are using objective data to prove progress and build confidence.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/register')}
            sx={{
              bgcolor: '#2563EB',
              color: 'white',
              fontFamily: 'Jost, sans-serif',
              fontWeight: 600,
              fontSize: '18px',
              textTransform: 'none',
              px: 8,
              py: 2.5,
              borderRadius: '100px',
              '&:hover': {
                bgcolor: '#1d4ed8',
              },
            }}
          >
            Start Free Trial →
          </Button>
        </Box>
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          borderTop: '1px solid #E5E5E5',
          py: 6,
          mt: 16,
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 4,
            }}
          >
            {/* Left side - Logo and copyright */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box
                sx={{
                  width: '40px',
                  height: '40px',
                  bgcolor: '#2D2D2D',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FiberManualRecordIcon sx={{ fontSize: 20, color: '#FFFFFF' }} />
              </Box>
              <Typography
                sx={{
                  fontSize: '14px',
                  color: '#6B6B6B',
                  fontFamily: 'Jost, sans-serif',
                }}
              >
                © CoachLens. 2025
              </Typography>
            </Box>

            {/* Center - Links */}
            <Box sx={{ display: 'flex', gap: 4 }}>
              <Button
                sx={{
                  color: '#2D2D2D',
                  fontFamily: 'Jost, sans-serif',
                  fontWeight: 600,
                  fontSize: '14px',
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: 'transparent',
                    color: '#2563EB',
                  },
                }}
              >
                Product
              </Button>
              <Button
                sx={{
                  color: '#2D2D2D',
                  fontFamily: 'Jost, sans-serif',
                  fontWeight: 600,
                  fontSize: '14px',
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: 'transparent',
                    color: '#2563EB',
                  },
                }}
              >
                About
              </Button>
              <Button
                onClick={() => navigate('/login')}
                sx={{
                  color: '#2D2D2D',
                  fontFamily: 'Jost, sans-serif',
                  fontWeight: 600,
                  fontSize: '14px',
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: 'transparent',
                    color: '#2563EB',
                  },
                }}
              >
                Sign In
              </Button>
            </Box>

            {/* Right side - All Rights Reserved */}
            <Typography
              sx={{
                fontSize: '14px',
                color: '#6B6B6B',
                fontFamily: 'Jost, sans-serif',
              }}
            >
              All Rights Reserved
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
