import { RouteObject } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Home } from '../pages/Home';
import { ProtectedRoute } from '../components/ProtectedRoute';
import Login from '../pages/Login';
import Register from '../pages/Register';

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
            <Home /> {/* Placeholder until FE-004 */}
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
