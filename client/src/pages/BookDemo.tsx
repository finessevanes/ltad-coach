import { Box, Container, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export function BookDemo() {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F5F5F5', py: 3 }}>
      {/* Back Button */}
      <Container maxWidth="lg">
        <Button
          onClick={() => navigate('/')}
          startIcon={<ArrowBackIcon />}
          sx={{
            color: '#2D2D2D',
            fontFamily: 'Jost, sans-serif',
            fontWeight: 600,
            fontSize: '15px',
            textTransform: 'none',
            mb: 2,
            '&:hover': {
              bgcolor: '#FFFFFF',
            },
          }}
        >
          Back to Home
        </Button>
      </Container>

      {/* QR Code Section */}
      <Container maxWidth="xs">
        <Box
          sx={{
            bgcolor: '#FFFFFF',
            borderRadius: '24px',
            p: { xs: 3, md: 4 },
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '28px', md: '36px' },
              fontWeight: 600,
              lineHeight: 1.2,
              color: '#2D2D2D',
              fontFamily: 'Jost, sans-serif',
              mb: 2,
            }}
          >
            Book a Demo
          </Typography>

          <Typography
            sx={{
              fontSize: '16px',
              color: '#6B6B6B',
              fontFamily: 'Jost, sans-serif',
              mb: 3,
            }}
          >
            Scan the QR code to schedule your demo
          </Typography>

          <Box
            component="img"
            src="/Calendly QR Code.png"
            alt="Scan to book a demo"
            sx={{
              width: '100%',
              maxWidth: 280,
              height: 'auto',
              objectFit: 'contain',
              mx: 'auto',
            }}
          />

          <Typography
            sx={{
              fontSize: '14px',
              color: '#9E9E9E',
              fontFamily: 'Jost, sans-serif',
              mt: 3,
            }}
          >
            Or visit calendly.com/naniskinner
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
