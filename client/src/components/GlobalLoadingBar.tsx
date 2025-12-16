import { LinearProgress, Fade } from '@mui/material';
import { useLoadingContext } from '../contexts/LoadingContext';

/**
 * Global loading bar displayed at the top of the page.
 * Automatically shows when ANY operation tracked with `useLoading` is in progress.
 *
 * **Important:** Render this component once at your app root (usually in App.tsx).
 * It will automatically detect and show when any loading operation starts.
 *
 * **Note:** Operations tracked with `useLoadingState` will NOT show in this bar
 * (by design - use `useLoading` if you need global visibility).
 *
 * @example
 * // In App.tsx
 * import { LoadingProvider } from './contexts/LoadingContext';
 * import { GlobalLoadingBar } from './components/GlobalLoadingBar';
 *
 * function App() {
 *   return (
 *     <LoadingProvider>
 *       <GlobalLoadingBar />
 *       <RouterProvider router={router} />
 *     </LoadingProvider>
 *   );
 * }
 */
export function GlobalLoadingBar() {
  const { isLoading } = useLoadingContext();
  const loading = isLoading();

  return (
    <Fade in={loading} unmountOnExit>
      <LinearProgress
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1300, // Above everything except modals
          height: 2,
        }}
        variant="indeterminate"
      />
    </Fade>
  );
}
