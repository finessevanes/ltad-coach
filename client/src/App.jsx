import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ErrorBoundary from './components/ErrorBoundary';
import { ROUTES } from './utils/routes';
import theme from './theme';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AthletesListPage from './pages/AthletesListPage';
import AddAthletePage from './pages/AddAthletePage';
import EditAthletePage from './pages/EditAthletePage';
import AthleteProfilePage from './pages/AthleteProfilePage';
import ConsentFormPage from './pages/ConsentFormPage';
import CameraSetupPage from './pages/CameraSetupPage';
import RecordingPage from './pages/RecordingPage';
import RecordingPreviewPage from './pages/RecordingPreviewPage';
import UploadVideoPage from './pages/UploadVideoPage';
import AssessmentResultsPage from './pages/AssessmentResultsPage';
import ReportPreviewPage from './pages/ReportPreviewPage';
import ParentReportPage from './pages/ParentReportPage';
import SettingsPage from './pages/SettingsPage';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <NotificationProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path={ROUTES.HOME} element={<LandingPage />} />
                <Route path={ROUTES.LOGIN} element={<LoginPage />} />
                <Route path={ROUTES.REGISTER} element={<RegisterPage />} />

                {/* Public routes */}
                <Route path={ROUTES.CONSENT} element={<ConsentFormPage />} />
                <Route path={ROUTES.PARENT_REPORT} element={<ParentReportPage />} />

                {/* Protected routes */}
                <Route
                  path={ROUTES.DASHBOARD}
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={ROUTES.ATHLETES}
                  element={
                    <ProtectedRoute>
                      <AthletesListPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={ROUTES.ADD_ATHLETE}
                  element={
                    <ProtectedRoute>
                      <AddAthletePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={ROUTES.EDIT_ATHLETE}
                  element={
                    <ProtectedRoute>
                      <EditAthletePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={ROUTES.ATHLETE_PROFILE}
                  element={
                    <ProtectedRoute>
                      <AthleteProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={ROUTES.CAMERA_SETUP}
                  element={
                    <ProtectedRoute>
                      <CameraSetupPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={ROUTES.RECORDING}
                  element={
                    <ProtectedRoute>
                      <RecordingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={ROUTES.RECORDING_PREVIEW}
                  element={
                    <ProtectedRoute>
                      <RecordingPreviewPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={ROUTES.UPLOAD_VIDEO}
                  element={
                    <ProtectedRoute>
                      <UploadVideoPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={ROUTES.ASSESSMENT_RESULTS}
                  element={
                    <ProtectedRoute>
                      <AssessmentResultsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/athletes/:athleteId/report"
                  element={
                    <ProtectedRoute>
                      <ReportPreviewPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={ROUTES.SETTINGS}
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
