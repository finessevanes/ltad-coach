import { useEffect } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';
import { routes } from './routes';
import { AuthProvider } from './contexts/AuthContext';
import { SnackbarProvider } from './contexts/SnackbarContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { GlobalLoadingBar } from './components/GlobalLoadingBar';
import { videoCache } from './utils/videoCache';

// Create router instance
const router = createBrowserRouter(routes);

function App() {
  // Cleanup expired video cache on app init
  useEffect(() => {
    videoCache
      .cleanupExpired()
      .then((deletedCount) => {
        if (deletedCount > 0) {
          console.log(`[Cache] Cleaned up ${deletedCount} expired videos`);
        }
      })
      .catch((err) => {
        console.warn('[Cache] Cleanup failed:', err);
      });
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LoadingProvider>
        <AuthProvider>
          <SnackbarProvider>
            <GlobalLoadingBar />
            <RouterProvider router={router} />
          </SnackbarProvider>
        </AuthProvider>
      </LoadingProvider>
    </ThemeProvider>
  );
}

export default App;
