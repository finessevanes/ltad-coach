import { Box, Button, Container, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import TimelineIcon from '@mui/icons-material/Timeline';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

export function Landing() {
  const navigate = useNavigate();

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
              Coach Lens
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
                onClick={() => window.open('https://calendly.com/naniskinner', '_blank')}
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
                Book a Demo →
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
              fontSize: { xs: '64px', md: '120px', lg: '140px' },
              fontWeight: 500,
              lineHeight: 0.98,
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
            The Foundation Before the Scoreboard
          </Typography>

          {/* Video Demo Section */}
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
            {/* Screen Frame Container */}
            <Box
              sx={{
                position: 'relative',
                zIndex: 1,
                bgcolor: '#000000',
                borderRadius: '20px',
                border: '16px solid #1A1A1A',
                overflow: 'hidden',
                boxShadow: '0 30px 80px rgba(0,0,0,0.2)',
              }}
            >
              {/* Video Element */}
              <Box
                component="video"
                autoPlay
                loop
                muted
                playsInline
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              >
                <source src="/landingpagevideocoachlens.mov" type="video/quicktime" />
                <source src="/landingpagevideocoachlens.mov" type="video/mp4" />
                Your browser does not support the video tag.
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
            onClick={() => window.open('https://calendly.com/naniskinner', '_blank')}
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
            Book a Demo →
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
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            {/* Top row - Copyright and rights */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Typography
                sx={{
                  fontSize: '14px',
                  color: '#6B6B6B',
                  fontFamily: 'Jost, sans-serif',
                }}
              >
                © Coach Lens 2025
              </Typography>
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

            {/* Bottom row - Built by (centered) */}
            <Typography
              sx={{
                fontSize: '14px',
                color: '#6B6B6B',
                fontFamily: 'Jost, sans-serif',
                textAlign: 'center',
              }}
            >
              Built by laschicas.ai
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
