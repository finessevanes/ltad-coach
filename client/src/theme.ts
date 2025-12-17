import { createTheme } from '@mui/material/styles';

// Coach Lens Modern Athletic Minimalism Design System
// Based on design.json v2.0.0

export const theme = createTheme({
  palette: {
    primary: {
      main: '#2563EB', // Athletic Blue - trust, technology, professional
      light: '#60A5FA',
      dark: '#1E40AF',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#60A5FA', // Lighter Blue - complements primary, less jarring than orange
      light: '#93C5FD',
      dark: '#3B82F6',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#10B981',
      light: '#34D399',
      dark: '#059669',
    },
    warning: {
      main: '#F97316', // Energy Orange - matches the vibrant orange from design
      light: '#FB923C',
      dark: '#EA580C',
    },
    error: {
      main: '#EF4444',
      light: '#F87171',
      dark: '#DC2626',
    },
    info: {
      main: '#3B82F6',
      light: '#60A5FA',
      dark: '#2563EB',
    },
    background: {
      default: '#F5F5F5',
      paper: '#FFFFFF',
    },
    text: {
      primary: 'rgba(45, 45, 45, 0.87)', // Charcoal
      secondary: 'rgba(107, 107, 107, 0.87)', // Gray
      disabled: 'rgba(0, 0, 0, 0.38)',
    },
    divider: '#E5E5E5',
    grey: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#EEEEEE',
      300: '#E0E0E0',
      400: '#BDBDBD',
      500: '#9E9E9E',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
  },
  typography: {
    fontFamily: "'Jost', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: {
      fontSize: '3rem', // 48px
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
    },
    h2: {
      fontSize: '2rem', // 32px
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.75rem', // 28px
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontSize: '1.5rem', // 24px
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '0',
    },
    h5: {
      fontSize: '1.25rem', // 20px
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: '0',
    },
    h6: {
      fontSize: '1.125rem', // 18px
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: '0',
    },
    body1: {
      fontSize: '1.125rem', // 18px - readable body text
      fontWeight: 400,
      lineHeight: 1.6,
      letterSpacing: '0',
    },
    body2: {
      fontSize: '1rem', // 16px
      fontWeight: 400,
      lineHeight: 1.6,
      letterSpacing: '0',
    },
    caption: {
      fontSize: '0.9375rem', // 15px (bumped from 14px)
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0',
    },
    button: {
      fontSize: '1rem', // 16px
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: '0',
      textTransform: 'none', // Sentence case for friendly feel
    },
  },
  spacing: 8, // 8px base unit
  shape: {
    borderRadius: 12, // Default border radius for buttons/inputs
  },
  shadows: [
    'none',
    '0 2px 8px rgba(0, 0, 0, 0.08)', // Card shadow (elevation 1)
    '0 4px 16px rgba(0, 0, 0, 0.12)', // Card hover (elevation 2)
    '0 8px 24px rgba(0, 0, 0, 0.15)', // Modal shadow (elevation 3)
    '0 1px 2px rgba(0, 0, 0, 0.05)', // Subtle shadow
    '0 2px 8px rgba(0, 0, 0, 0.08)',
    '0 2px 8px rgba(0, 0, 0, 0.08)',
    '0 2px 8px rgba(0, 0, 0, 0.08)',
    '0 4px 16px rgba(0, 0, 0, 0.12)',
    '0 4px 16px rgba(0, 0, 0, 0.12)',
    '0 4px 16px rgba(0, 0, 0, 0.12)',
    '0 4px 16px rgba(0, 0, 0, 0.12)',
    '0 4px 16px rgba(0, 0, 0, 0.12)',
    '0 4px 16px rgba(0, 0, 0, 0.12)',
    '0 4px 16px rgba(0, 0, 0, 0.12)',
    '0 4px 16px rgba(0, 0, 0, 0.12)',
    '0 8px 24px rgba(0, 0, 0, 0.15)',
    '0 8px 24px rgba(0, 0, 0, 0.15)',
    '0 8px 24px rgba(0, 0, 0, 0.15)',
    '0 8px 24px rgba(0, 0, 0, 0.15)',
    '0 8px 24px rgba(0, 0, 0, 0.15)',
    '0 8px 24px rgba(0, 0, 0, 0.15)',
    '0 8px 24px rgba(0, 0, 0, 0.15)',
    '0 8px 24px rgba(0, 0, 0, 0.15)',
    '0 8px 24px rgba(0, 0, 0, 0.15)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: 600,
          textTransform: 'none',
          transition: 'all 0.2s ease',
        },
        sizeSmall: {
          padding: '8px 16px',
          fontSize: '14px',
        },
        sizeLarge: {
          padding: '16px 32px',
          fontSize: '18px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '24px', // Large cards get 24px radius
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid #F5F5F5',
          transition: 'all 0.2s ease',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '32px', // Generous card padding
          '&:last-child': {
            paddingBottom: '32px',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '999px', // Full pill shape
          fontWeight: 600,
          fontSize: '14px',
          padding: '6px 16px',
          height: 'auto',
        },
        sizeSmall: {
          fontSize: '13px',
          height: '24px',
          padding: '4px 12px',
        },
        colorSuccess: {
          backgroundColor: '#ECFDF5', // Light green background
          color: '#059669', // Dark green text
          border: 'none',
        },
        colorWarning: {
          backgroundColor: '#FFF7ED', // Light orange background
          color: '#EA580C', // Dark orange text
          border: 'none',
        },
        colorError: {
          backgroundColor: '#FEE2E2', // Light red background
          color: '#DC2626', // Dark red text
          border: 'none',
        },
        colorPrimary: {
          backgroundColor: '#EFF6FF', // Light blue background
          color: '#1E40AF', // Dark blue text
          border: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            '& fieldset': {
              borderWidth: '2px',
              borderColor: '#E5E5E5',
            },
            '&:hover fieldset': {
              borderColor: '#E5E5E5',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#2563EB',
              borderWidth: '2px',
            },
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '14px',
          fontWeight: 600,
          color: '#2D2D2D',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          padding: '16px 24px',
          fontSize: '16px',
        },
        standardSuccess: {
          backgroundColor: '#ECFDF5',
          color: '#10B981',
          borderLeft: '4px solid #10B981',
        },
        standardWarning: {
          backgroundColor: '#FFF7ED',
          color: '#EA580C',
          borderLeft: '4px solid #F97316',
        },
        standardError: {
          backgroundColor: '#FEE2E2',
          color: '#EF4444',
          borderLeft: '4px solid #EF4444',
        },
        standardInfo: {
          backgroundColor: '#DBEAFE',
          color: '#3B82F6',
          borderLeft: '4px solid #3B82F6',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: '#2D2D2D',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E5E5E5',
          width: '280px',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          margin: '4px 8px',
          padding: '12px 20px',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: '#F5F5F5',
          },
          '&.Mui-selected': {
            backgroundColor: '#EFF6FF',
            color: '#2563EB',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: '#EFF6FF',
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '24px',
          padding: '32px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#2D2D2D',
          color: '#FFFFFF',
          fontSize: '14px',
          padding: '8px 12px',
          borderRadius: '8px',
          maxWidth: '300px',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: '8px',
          borderRadius: '999px',
          backgroundColor: '#F5F5F5',
        },
        bar: {
          borderRadius: '999px',
          backgroundColor: '#2563EB',
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: '#F5F5F5',
          borderRadius: '8px',
        },
      },
    },
  },
});
