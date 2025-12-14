import { RouteObject } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Landing } from '../pages/Landing';
import { Dashboard } from '../pages/Dashboard';
import { ProtectedRoute } from '../components/ProtectedRoute';
import Login from '../pages/Login';
import Register from '../pages/Register';
import { AthletesList, AddAthlete, AthleteProfile } from '../pages/Athletes';
import ConsentForm from '../pages/Consent';
import { AssessmentFlow, AssessmentResults, AssessmentsList } from '../pages/Assessment';
import BackupUpload from '../pages/Assessment/BackupUpload';
import ReportPreview from '../pages/Reports/ReportPreview';
import PublicReport from '../pages/Reports/PublicReport';

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
  // Public report view (no auth required)
  {
    path: '/report/:reportId',
    element: <PublicReport />,
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
    path: '/athletes/:athleteId/report',
    element: (
      <Layout>
        <ProtectedRoute>
          <ReportPreview />
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
          <AssessmentsList />
        </ProtectedRoute>
      </Layout>
    ),
  },
];
