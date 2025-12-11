import { RouteObject } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Home } from '../pages/Home';
import { ProtectedRoute } from '../components/ProtectedRoute';
import Login from '../pages/Login';
import Register from '../pages/Register';
import { AthletesList, AddAthlete } from '../pages/Athletes';
import ConsentForm from '../pages/Consent';

// Route definitions for the application
export const routes: RouteObject[] = [
  // Auth routes (outside Layout - no sidebar/appbar)
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  // Public consent route (no auth required)
  {
    path: '/consent/:token',
    element: <ConsentForm />,
  },
  // App routes (inside Layout)
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      // Protected routes
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <Home /> {/* Placeholder until FE-015 */}
          </ProtectedRoute>
        ),
      },
      {
        path: 'athletes',
        element: (
          <ProtectedRoute>
            <AthletesList />
          </ProtectedRoute>
        ),
      },
      {
        path: 'athletes/new',
        element: (
          <ProtectedRoute>
            <AddAthlete />
          </ProtectedRoute>
        ),
      },
      {
        path: 'assessments',
        element: (
          <ProtectedRoute>
            <Home /> {/* Placeholder until FE-011 */}
          </ProtectedRoute>
        ),
      },
    ],
  },
];
