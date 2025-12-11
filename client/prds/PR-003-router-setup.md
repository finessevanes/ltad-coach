---
id: FE-003
depends_on: [FE-001]
blocks: [FE-006, FE-007, FE-008, FE-009]
---

# FE-003: React Router Setup

## Scope

**In Scope:**
- Install React Router
- Configure routes structure
- Set up route constants

**Out of Scope:**
- Protected routes (FE-006)
- Individual page components

## Technical Decisions

- **Library**: React Router v6
- **Route Config**: Centralized in App.jsx initially
- **Paths**: Constant exports for type safety

## Acceptance Criteria

- [ ] React Router installed
- [ ] BrowserRouter configured
- [ ] Route structure defined
- [ ] Navigation works between pages

## Files to Create/Modify

- `src/App.jsx` (modify - add router)
- `src/utils/routes.js` (create - route constants)

## Implementation Notes

**Install Router**:
```bash
npm install react-router-dom
```

**src/utils/routes.js**:
```javascript
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  ATHLETES: '/athletes',
  ATHLETE_PROFILE: '/athletes/:id',
  NEW_ASSESSMENT: '/athletes/:id/assess',
  ASSESSMENT_RESULTS: '/assessments/:id',
  CONSENT: '/consent/:token',
  PARENT_REPORT: '/report/:id',
  SETTINGS: '/settings',
};
```

**src/App.jsx** (modify):
```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { ROUTES } from './utils/routes';

// Placeholder components
const HomePage = () => <div>Home Page</div>;
const LoginPage = () => <div>Login Page</div>;
const DashboardPage = () => <div>Dashboard</div>;

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path={ROUTES.HOME} element={<HomePage />} />
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          {/* More routes added in subsequent PRs */}
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
```

## Testing

Navigate to:
- `http://localhost:5173/` → Home
- `http://localhost:5173/login` → Login
- `http://localhost:5173/dashboard` → Dashboard

## Estimated Complexity

**Size**: S (Small - ~1 hour)
