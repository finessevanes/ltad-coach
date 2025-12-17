import { createTheme } from '@mui/material/styles';

// Coach Lens Design System
// White/Black/Gray + Lime Green Accent
// Based on design.json v3.0.0

export const theme = createTheme({
  palette: {
    primary: {
      main: '#D4FF00', // Lime Green - energetic, modern, athletic
      light: '#E3FF4D',
      dark: '#A3CC00',
      contrastText: '#000000',
    },
    secondary: {
      main: '#000000', // Black - strong, professional, high contrast
      light: '#2D2D2D',
      dark: '#000000',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#84CC16', // Softer Lime Green for success states
      light: '#A3E635',
      dark: '#65A30D',
    },
    warning: {
      main: '#F59E0B', // Amber for warnings
      light: '#FBBF24',
      dark: '#D97706',
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
      primary: '#000000', // Pure Black for maximum contrast
      secondary: '#6B6B6B', // Gray for secondary text
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
          backgroundColor: '#F7FEE7', // Light lime background
          color: '#65A30D', // Dark lime text
          border: 'none',
        },
        colorWarning: {
          backgroundColor: '#FEF3C7', // Light amber background
          color: '#D97706', // Dark amber text
          border: 'none',
        },
        colorError: {
          backgroundColor: '#FEE2E2', // Light red background
          color: '#DC2626', // Dark red text
          border: 'none',
        },
        colorPrimary: {
          backgroundColor: '#F7FEE7', // Light lime background
          color: '#000000', // Black text
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
              borderColor: '#D4FF00',
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
          backgroundColor: '#F7FEE7',
          color: '#65A30D',
          borderLeft: '4px solid #84CC16',
        },
        standardWarning: {
          backgroundColor: '#FEF3C7',
          color: '#D97706',
          borderLeft: '4px solid #F59E0B',
        },
        standardError: {
          backgroundColor: '#FEE2E2',
          color: '#DC2626',
          borderLeft: '4px solid #EF4444',
        },
        standardInfo: {
          backgroundColor: '#F5F5F5',
          color: '#000000',
          borderLeft: '4px solid #6B6B6B',
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
            backgroundColor: '#F7FEE7',
            color: '#000000',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: '#F7FEE7',
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
          backgroundColor: '#D4FF00',
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
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: '#000000', // Black loading circle
        },
      },
    },
  },
});
