---
id: FE-016
depends_on: [FE-001]
blocks: []
---

# FE-016: Landing Page

## Title
Implement public landing page with product information and login/register CTAs

## Scope

### In Scope
- Public landing page at `/`
- Hero section with product value proposition
- Feature highlights (CV analysis, AI feedback, parent reports)
- Call-to-action buttons (Login, Register)
- Responsive design (desktop, tablet, mobile)

### Out of Scope
- Pricing page (post-MVP)
- Blog/content pages
- Full marketing site

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Layout | Single-page scroll | MVP simplicity, quick development |
| Styling | Material-UI | Consistent with app |
| Auth redirect | Redirect to /dashboard if logged in | Don't show landing to authenticated users |

## Acceptance Criteria

- [ ] Landing page accessible at `/` (root route)
- [ ] Hero section with headline and value proposition
- [ ] Feature cards highlighting key benefits
- [ ] "Login" button navigates to `/login`
- [ ] "Get Started" / "Register" button navigates to `/register`
- [ ] Authenticated users redirected to `/dashboard`
- [ ] Responsive layout for mobile, tablet, desktop
- [ ] Page loads quickly (< 2s on broadband)

## Files to Create/Modify

```
client/src/
├── pages/
│   └── Landing/
│       ├── index.tsx              # Main landing page
│       ├── Hero.tsx               # Hero section
│       ├── Features.tsx           # Feature cards
│       └── Footer.tsx             # Simple footer
└── routes/
    └── index.tsx                  # Add landing route (modify)
```

## Implementation Details

### pages/Landing/index.tsx
```typescript
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { Hero } from './Hero';
import { Features } from './Features';
import { Footer } from './Footer';

export default function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  // Don't flash landing page while checking auth
  if (loading) {
    return null;
  }

  return (
    <Box>
      <Hero />
      <Features />
      <Footer />
    </Box>
  );
}
```

### pages/Landing/Hero.tsx
```typescript
import { Box, Container, Typography, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export function Hero() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        bgcolor: 'primary.main',
        color: 'white',
        py: { xs: 8, md: 12 },
        textAlign: 'center',
      }}
    >
      <Container maxWidth="md">
        <Typography
          variant="h2"
          component="h1"
          fontWeight="bold"
          sx={{ mb: 2, fontSize: { xs: '2rem', md: '3rem' } }}
        >
          AI-Powered Athletic Assessment for Youth Coaches
        </Typography>
        <Typography
          variant="h5"
          sx={{ mb: 4, opacity: 0.9, fontSize: { xs: '1rem', md: '1.25rem' } }}
        >
          Use computer vision to objectively measure athletic development.
          Track progress. Generate professional parent reports.
        </Typography>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="center"
        >
          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={() => navigate('/register')}
            sx={{ px: 4, py: 1.5 }}
          >
            Get Started Free
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/login')}
            sx={{
              px: 4,
              py: 1.5,
              color: 'white',
              borderColor: 'white',
              '&:hover': {
                borderColor: 'white',
                bgcolor: 'rgba(255,255,255,0.1)',
              },
            }}
          >
            Login
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
```

### pages/Landing/Features.tsx
```typescript
import { Container, Typography, Grid, Paper, Box } from '@mui/material';
import {
  Videocam as VideoIcon,
  Psychology as AIIcon,
  Assessment as ReportIcon,
  TrendingUp as ProgressIcon,
} from '@mui/icons-material';

const features = [
  {
    icon: <VideoIcon sx={{ fontSize: 48 }} />,
    title: 'Video-Based Assessment',
    description:
      'Record balance tests using any webcam or phone camera. Our computer vision technology analyzes performance in real-time.',
  },
  {
    icon: <AIIcon sx={{ fontSize: 48 }} />,
    title: 'AI-Powered Feedback',
    description:
      'Get intelligent coaching cues and personalized recommendations powered by advanced language models.',
  },
  {
    icon: <ProgressIcon sx={{ fontSize: 48 }} />,
    title: 'Track Progress Over Time',
    description:
      'Monitor athlete development with historical trends, team rankings, and age-appropriate benchmarks.',
  },
  {
    icon: <ReportIcon sx={{ fontSize: 48 }} />,
    title: 'Professional Parent Reports',
    description:
      'Share progress with parents through secure, PIN-protected reports they can access without an account.',
  },
];

export function Features() {
  return (
    <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: 'grey.50' }}>
      <Container maxWidth="lg">
        <Typography
          variant="h3"
          textAlign="center"
          fontWeight="bold"
          sx={{ mb: 2, fontSize: { xs: '1.75rem', md: '2.5rem' } }}
        >
          Everything You Need to Assess Young Athletes
        </Typography>
        <Typography
          variant="h6"
          textAlign="center"
          color="text.secondary"
          sx={{ mb: 6, maxWidth: 600, mx: 'auto' }}
        >
          Built on the Long Term Athlete Development (LTAD) framework for ages 5-13
        </Typography>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper
                sx={{
                  p: 3,
                  height: '100%',
                  textAlign: 'center',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
                elevation={2}
              >
                <Box sx={{ color: 'primary.main', mb: 2 }}>{feature.icon}</Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
```

### pages/Landing/Footer.tsx
```typescript
import { Box, Container, Typography, Link } from '@mui/material';

export function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 4,
        bgcolor: 'grey.900',
        color: 'grey.400',
        textAlign: 'center',
      }}
    >
      <Container maxWidth="md">
        <Typography variant="body2">
          AI Coach - Athletic Assessment Platform for Youth Sports
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Built for coaches working with athletes ages 5-13
        </Typography>
        <Typography variant="caption" sx={{ mt: 2, display: 'block' }}>
          © {new Date().getFullYear()} AI Coach. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}
```

### routes/index.tsx (modifications)
```typescript
// Add to route definitions:
import Landing from '../pages/Landing';

// Route configuration:
{ path: '/', element: <Landing /> },
// Other routes remain the same...
```

## Estimated Complexity
**S** (Small) - 2-3 hours

## Testing Instructions

1. Navigate to `/` when logged out
2. Verify hero section displays with CTAs
3. Click "Get Started Free" - should navigate to `/register`
4. Click "Login" - should navigate to `/login`
5. Login and navigate to `/` - should redirect to `/dashboard`
6. Test responsive layout on mobile viewport
7. Verify feature cards are readable on all screen sizes

## UI Reference

```
┌─────────────────────────────────────────────────────────────────────┐
│                    [PRIMARY BLUE BACKGROUND]                         │
│                                                                      │
│      AI-Powered Athletic Assessment for Youth Coaches                │
│                                                                      │
│   Use computer vision to objectively measure athletic development.   │
│   Track progress. Generate professional parent reports.              │
│                                                                      │
│        [Get Started Free]    [Login]                                 │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                    [LIGHT GRAY BACKGROUND]                           │
│                                                                      │
│       Everything You Need to Assess Young Athletes                   │
│   Built on the Long Term Athlete Development (LTAD) framework        │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │   📹     │  │   🧠     │  │   📈     │  │   📋     │            │
│  │  Video   │  │    AI    │  │ Progress │  │  Parent  │            │
│  │ Analysis │  │ Feedback │  │ Tracking │  │ Reports  │            │
│  │          │  │          │  │          │  │          │            │
│  │  Record  │  │   Get    │  │ Monitor  │  │  Share   │            │
│  │  tests   │  │  smart   │  │ athlete  │  │ progress │            │
│  │  using   │  │ coaching │  │  trends  │  │   with   │            │
│  │  webcam  │  │   cues   │  │ over time│  │ parents  │            │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                    [DARK GRAY FOOTER]                                │
│                                                                      │
│   AI Coach - Athletic Assessment Platform for Youth Sports           │
│   Built for coaches working with athletes ages 5-13                  │
│   © 2025 AI Coach. All rights reserved.                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Notes
- Keep copy concise and benefit-focused
- Avoid technical jargon in user-facing text
- Consider adding testimonials/social proof post-MVP
- Consider adding demo video post-MVP
