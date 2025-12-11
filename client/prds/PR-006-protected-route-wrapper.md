COMPLETED

---
id: FE-006
depends_on: [FE-003, FE-004]
blocks: [FE-010, FE-011]
---

# FE-006: Protected Route Wrapper

## Scope

**In Scope:**
- ProtectedRoute component
- Redirect to login if not authenticated
- Loading state during auth check

**Out of Scope:**
- Individual protected pages

## Technical Decisions

- **Pattern**: Route wrapper component
- **Redirect**: To /login with return URL
- **Loading**: Show spinner during auth check

## Acceptance Criteria

- [ ] Authenticated users can access protected routes
- [ ] Unauthenticated users redirected to login
- [ ] Loading spinner shown during auth check
- [ ] Return URL preserved after login

## Files to Create/Modify

- `src/components/ProtectedRoute.jsx` (create)
- `src/App.jsx` (modify - use for protected routes)

## Implementation Notes

**src/components/ProtectedRoute.jsx**:
```jsx
import { Navigate, useLocation } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../utils/routes';

export const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!currentUser) {
    // Redirect to login, save return URL
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return children;
};
```

**src/App.jsx** (modify):
```jsx
import { ProtectedRoute } from './components/ProtectedRoute';

<Routes>
  <Route path={ROUTES.HOME} element={<HomePage />} />
  <Route path={ROUTES.LOGIN} element={<LoginPage />} />

  {/* Protected routes */}
  <Route
    path={ROUTES.DASHBOARD}
    element={
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    }
  />

  {/* More protected routes */}
</Routes>
```

## Testing

1. Log out (if logged in)
2. Navigate to /dashboard
3. Should redirect to /login
4. Log in
5. Should navigate back to /dashboard

## Estimated Complexity

**Size**: S (Small - ~1 hour)
