---
id: FE-001
status: ✅ COMPLETE
depends_on: []
blocks: [FE-002, FE-003, FE-004, FE-005, FE-006, FE-007, FE-008]
---

# FE-001: Frontend Project Setup & Vercel Deployment

## Title
Initialize React frontend with Material-UI and Vercel deployment

## Scope

### In Scope
- Create React App with TypeScript (or Vite)
- Material-UI (MUI) installation and theme setup
- Basic routing structure with React Router
- Environment variable configuration
- Vercel deployment configuration
- Basic layout component (AppBar, navigation shell)

### Out of Scope
- Firebase Auth integration (FE-002)
- Any page implementations
- API client setup

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Build Tool | Vite | Faster dev server, modern defaults, better DX |
| UI Framework | MUI v5 | PRD specifies Material-UI, robust component library |
| Routing | React Router v6 | Standard, supports nested routes |
| State Management | React Context + hooks | Sufficient for MVP, avoid Redux complexity |
| HTTP Client | Axios | Better error handling than fetch, interceptors |

## Acceptance Criteria

- [ ] `npm install` succeeds without errors
- [ ] `npm run dev` starts dev server on port 3000 (or 5173 for Vite)
- [ ] Home page renders with MUI AppBar showing "AI Coach" title
- [ ] MUI theme is configured with primary/secondary colors
- [ ] Environment variables load correctly (`VITE_API_URL`, `VITE_FIREBASE_*`)
- [ ] `npm run build` produces production bundle without errors
- [ ] Vercel deployment succeeds and home page loads
- [ ] Responsive layout works on desktop and tablet viewports

## Files to Create/Modify

```
client/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── vercel.json                    # Vercel config
├── index.html
├── .env.example                   # Template for env vars
├── src/
│   ├── main.tsx                   # Entry point
│   ├── App.tsx                    # Router setup
│   ├── theme.ts                   # MUI theme config
│   ├── vite-env.d.ts              # Vite type declarations
│   ├── components/
│   │   └── Layout/
│   │       ├── index.tsx          # Main layout wrapper
│   │       ├── AppBar.tsx         # Top navigation bar
│   │       └── Sidebar.tsx        # Side navigation (placeholder)
│   ├── pages/
│   │   └── Home.tsx               # Landing/placeholder page
│   └── routes/
│       └── index.tsx              # Route definitions
└── README.md
```

## Implementation Details

### package.json Key Dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "@mui/material": "^5.15.0",
    "@mui/icons-material": "^5.15.0",
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "axios": "^1.6.0",
    "camelcase-keys": "^9.1.0",
    "snakecase-keys": "^6.0.0",
    "react-markdown": "^9.0.0",
    "recharts": "^2.10.0",
    "react-hook-form": "^7.48.0",
    "@hookform/resolvers": "^3.3.0",
    "yup": "^1.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

### API Response Transformation

The backend uses snake_case (Python convention) while the frontend uses camelCase (JavaScript convention). Use `camelcase-keys` to automatically transform API responses:

```typescript
// src/services/api.ts
import axios from 'axios';
import camelcaseKeys from 'camelcase-keys';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Transform all API responses from snake_case to camelCase
api.interceptors.response.use(
  (response) => {
    if (response.data) {
      response.data = camelcaseKeys(response.data, { deep: true });
    }
    return response;
  },
  async (error) => {
    // Also transform error responses
    if (error.response?.data) {
      error.response.data = camelcaseKeys(error.response.data, { deep: true });
    }

    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      try {
        // Import auth dynamically to avoid circular dependency
        const { auth } = await import('../firebase/config');
        const user = auth.currentUser;
        if (user) {
          // Force refresh the Firebase token
          const newToken = await user.getIdToken(true);
          // Update the Authorization header and retry
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return api.request(error.config);
        }
      } catch (refreshError) {
        // Token refresh failed, redirect to login
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export { api };
```

**VERIFIED**: The `camelcase-keys` library with `{ deep: true }` handles all nested objects automatically, including:
- Top-level fields: `athlete_id` → `athleteId`
- Nested objects: `metrics.duration_seconds` → `metrics.durationSeconds`
- Arrays of objects: transforms each item's keys

No manual mapping functions are needed for field name conversion.

### Error Code Mapping

Map backend error codes to user-friendly messages:

```typescript
// src/utils/errorMessages.ts
export const ERROR_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your input.',
  401: 'Please log in to continue.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Something went wrong. Please try again later.',
};

export function getErrorMessage(error: any): string {
  // Check for specific backend error detail
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  // Fall back to status code message
  const status = error.response?.status;
  if (status && ERROR_MESSAGES[status]) {
    return ERROR_MESSAGES[status];
  }
  // Network error or unknown
  if (!error.response) {
    return 'Network error. Please check your connection and try again.';
  }
  return 'An unexpected error occurred. Please try again.';
}
```

### Loading Pattern (Standardized)

Use `CircularProgress` centered in a container for all loading states:

```typescript
// src/components/LoadingState.tsx
import { Box, CircularProgress } from '@mui/material';

interface LoadingStateProps {
  minHeight?: number | string;
}

export function LoadingState({ minHeight = 400 }: LoadingStateProps) {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight={minHeight}>
      <CircularProgress />
    </Box>
  );
}
```

### Mobile Breakpoints

Use MUI's responsive breakpoints consistently:

| Breakpoint | Value | Usage |
|------------|-------|-------|
| xs | 0px | Mobile phones |
| sm | 600px | Tablets portrait |
| md | 900px | Tablets landscape |
| lg | 1200px | Desktops |
| xl | 1536px | Large desktops |

Standard patterns:
- `Container maxWidth="lg"` for main content
- `Grid item xs={12} md={6}` for two-column layouts on desktop
- `sx={{ display: { xs: 'none', md: 'block' } }}` to hide on mobile

### theme.ts
```typescript
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',  // Blue - trust, professionalism
    },
    secondary: {
      main: '#4caf50',  // Green - growth, health
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});
```

### Complete Route Structure

| Path | PRD | Auth | Description |
|------|-----|------|-------------|
| `/` | FE-001 | No | Landing/home page |
| `/login` | FE-003 | No | Login page |
| `/register` | FE-003 | No | Registration page |
| `/consent/:token` | FE-006 | No | Public consent form for parents |
| `/report/:reportId` | FE-014 | No | Public PIN-protected report view |
| `/dashboard` | FE-015 | Yes | Coach dashboard (default after login) |
| `/athletes` | FE-004 | Yes | Athletes list |
| `/athletes/new` | FE-005 | Yes | Add new athlete form |
| `/athletes/:id` | FE-012 | Yes | Athlete profile with history |
| `/athletes/:id/edit` | FE-005 | Yes | Edit athlete (modal on profile) |
| `/athletes/:id/report` | FE-013 | Yes | Report preview and send |
| `/assess/:athleteId/setup` | FE-008 | Yes | Test type and leg selection |
| `/assess/:athleteId/camera` | FE-008 | Yes | Camera setup with MediaPipe preview |
| `/assess/:athleteId/recording` | FE-009 | Yes | Recording countdown and capture |
| `/assess/:athleteId/upload` | FE-010 | Yes | Backup video file upload |
| `/assess/:athleteId/processing` | FE-010 | Yes | Upload progress and analysis |
| `/assessments` | FE-011 | Yes | All assessments list (activity feed) |
| `/assessments/:id` | FE-011 | Yes | Single assessment results |

```typescript
// src/routes/index.tsx
const routes = [
  // Public routes (no authentication required)
  { path: '/', element: <Home /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/consent/:token', element: <ConsentPage /> },
  { path: '/report/:reportId', element: <PublicReport /> },

  // Protected routes (wrapped in ProtectedRoute)
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/athletes', element: <AthletesList /> },
  { path: '/athletes/new', element: <AddAthlete /> },
  { path: '/athletes/:id', element: <AthleteProfile /> },
  { path: '/athletes/:id/report', element: <ReportPreview /> },
  { path: '/assess/:athleteId/setup', element: <TestSetup /> },
  { path: '/assess/:athleteId/camera', element: <CameraSetup /> },
  { path: '/assess/:athleteId/recording', element: <Recording /> },
  { path: '/assess/:athleteId/upload', element: <BackupUpload /> },
  { path: '/assess/:athleteId/processing', element: <Processing /> },
  { path: '/assessments', element: <AssessmentsList /> },
  { path: '/assessments/:id', element: <AssessmentResults /> },
];
```

### vercel.json
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" }
      ]
    }
  ]
}
```

## Environment Variables Required

| Variable | Example | Required |
|----------|---------|----------|
| VITE_API_URL | https://ltad-coach-api.onrender.com | Yes |
| VITE_FIREBASE_API_KEY | AIza... | Yes |
| VITE_FIREBASE_AUTH_DOMAIN | ltad-coach.firebaseapp.com | Yes |
| VITE_FIREBASE_PROJECT_ID | ltad-coach | Yes |
| VITE_FIREBASE_STORAGE_BUCKET | ltad-coach.appspot.com | Yes |
| VITE_FIREBASE_MESSAGING_SENDER_ID | 123456789 | Yes |
| VITE_FIREBASE_APP_ID | 1:123:web:abc | Yes |

## Estimated Complexity
**S** (Small) - 2-3 hours

## Testing Instructions

1. Local testing:
```bash
cd client
npm install
cp .env.example .env  # Fill in values
npm run dev
# Open http://localhost:5173
```

2. Vercel deployment:
- Connect GitHub repo to Vercel
- Set root directory to `client`
- Add environment variables in Vercel dashboard
- Deploy and verify home page loads

## Navigation Layout Components

### components/Layout/index.tsx
```typescript
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import { AppBarNav } from './AppBar';
import { Sidebar } from './Sidebar';

const DRAWER_WIDTH = 240;

interface LayoutProps {
  children?: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <Box sx={{ display: 'flex' }}>
      <AppBarNav drawerWidth={DRAWER_WIDTH} />
      <Sidebar width={DRAWER_WIDTH} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8, // Account for AppBar height
          minHeight: '100vh',
          bgcolor: 'grey.50',
        }}
      >
        {children || <Outlet />}
      </Box>
    </Box>
  );
}
```

### components/Layout/AppBar.tsx
```typescript
import { AppBar, Toolbar, Typography, IconButton, Button, Box } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface AppBarNavProps {
  drawerWidth: number;
}

export function AppBarNav({ drawerWidth }: AppBarNavProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <AppBar
      position="fixed"
      sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px` }}
    >
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          AI Coach
        </Typography>
        {user && (
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body2">{user.email}</Typography>
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
```

### components/Layout/Sidebar.tsx
```typescript
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Toolbar,
  Typography,
  Box,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as AthleteIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  width: number;
}

const NAV_ITEMS = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { label: 'Athletes', icon: <AthleteIcon />, path: '/athletes' },
  { label: 'Assessments', icon: <AssessmentIcon />, path: '/assessments' },
];

export function Sidebar({ width }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width,
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h6" fontWeight="bold" color="primary">
            AI Coach
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {NAV_ITEMS.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}
```

### Usage in App.tsx

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes - no layout */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/consent/:token" element={<ConsentPage />} />
        <Route path="/report/:reportId" element={<PublicReportPage />} />

        {/* Protected routes - with layout */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/athletes" element={<AthletesList />} />
          <Route path="/athletes/new" element={<AddAthlete />} />
          <Route path="/athletes/:id" element={<AthleteProfile />} />
          <Route path="/athletes/:id/report" element={<ReportPreview />} />
          <Route path="/assess/:athleteId/*" element={<AssessmentFlow />} />
          <Route path="/assessments" element={<AssessmentsList />} />
          <Route path="/assessments/:id" element={<AssessmentResults />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

### Trade-offs: Navigation Layout Location

**Option A: FE-001 (Chosen)**
- Pros: Foundation component, used by all authenticated pages
- Cons: May need stub `useAuth` until FE-002/FE-003

**Option B: FE-003 (Login/Register)**
- Pros: Auth-aware from the start
- Cons: Creates dependency on auth PRD for layout

**Recommendation**: Keep in FE-001 as a foundation component. The `useAuth` hook can return null/undefined until FE-002 implements it, and the Layout gracefully handles this.

## Notes
- The AppBar should show "AI Coach" branding
- Navigation links will be non-functional until auth is implemented
- Use MUI's `Container` component for consistent max-width content
- Sidebar is permanent on desktop, could be made responsive (drawer) for tablet in future
