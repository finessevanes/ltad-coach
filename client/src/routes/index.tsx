import { RouteObject } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Landing } from '../pages/Landing';
import { Home } from '../pages/Home';
import { Dashboard } from '../pages/Dashboard';
import { ProtectedRoute } from '../components/ProtectedRoute';
import Login from '../pages/Login';
import Register from '../pages/Register';
import { AthletesList, AddAthlete, AthleteProfile } from '../pages/Athletes';
import ConsentForm from '../pages/Consent';
import AssessmentFlow from '../pages/Assessment/AssessmentFlow';
import AssessmentResults from '../pages/Assessment/AssessmentResults';
import BackupUpload from '../pages/Assessment/BackupUpload';
import AICoach from '../pages/AICoach';

// Route definitions for the application
export const routes: RouteObject[] = [
  // Public landing page (no layout)
  {
    path: '/',
    element: <Landing />,
  },
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
    path: '/dashboard',
    element: (
      <Layout>
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: '/athletes',
    element: (
      <Layout>
        <ProtectedRoute>
          <AthletesList />
        </ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: '/athletes/new',
    element: (
      <Layout>
        <ProtectedRoute>
          <AddAthlete />
        </ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: '/athletes/:athleteId',
    element: (
      <Layout>
        <ProtectedRoute>
          <AthleteProfile />
        </ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: '/assess/:athleteId',
    element: (
      <Layout>
        <ProtectedRoute>
          <AssessmentFlow />
        </ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: '/assess/:athleteId/upload',
    element: (
      <Layout>
        <ProtectedRoute>
          <BackupUpload />
        </ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: '/assessments/:assessmentId',
    element: (
      <Layout>
        <ProtectedRoute>
          <AssessmentResults />
        </ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: '/assessments',
    element: (
      <Layout>
        <ProtectedRoute>
          <Home /> {/* Placeholder until FE-011 */}
        </ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: '/ai-coach',
    element: (
      <Layout>
        <ProtectedRoute>
          <AICoach />
        </ProtectedRoute>
      </Layout>
    ),
  },
];
