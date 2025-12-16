import { useState, useCallback, useRef, useEffect } from 'react';

type LoadingStateStatus = 'idle' | 'loading' | 'error' | 'success';

interface UseLoadingStateReturn {
  state: LoadingStateStatus;
  error: string | null;
  isLoading: boolean;
  start: () => void;
  success: () => void;
  fail: (error: string) => void;
  reset: () => void;
  withLoading: <T,>(asyncFn: () => Promise<T>) => Promise<T>;
}

/**
 * Simple loading state machine for basic async operations.
 *
 * **When to use:**
 * - Form submissions
 * - Simple API calls without progress tracking
 * - Operations that don't need to show in GlobalLoadingBar
 * - When you need success/error states
 *
 * **When NOT to use:**
 * - File uploads with progress (use `useLoading` instead)
 * - Operations that should show in GlobalLoadingBar
 * - Multi-step workflows
 *
 * **Features:**
 * - State machine: idle → loading → success/error
 * - Automatic error capture with `withLoading` helper
 * - Memory leak prevention (safe on unmount)
 * - No global state pollution
 *
 * **States:**
 * - **idle**: Initial state, ready for action
 * - **loading**: Operation in progress
 * - **success**: Operation completed successfully
 * - **error**: Operation failed (error message available)
 *
 * @returns State management object with state, error, and control methods
 *
 * @example
 * // Form submission with error handling
 * function LoginForm() {
 *   const { isLoading, error, withLoading } = useLoadingState();
 *
 *   const handleLogin = async (email: string, password: string) => {
 *     await withLoading(() => auth.signIn(email, password));
 *     // Automatically transitions to 'success' or 'error'
 *     // No need for try/catch - withLoading handles it
 *   };
 *
 *   return (
 *     <form onSubmit={(e) => { e.preventDefault(); handleLogin(email, password); }}>
 *       {error && <Alert severity="error">{error}</Alert>}
 *       <LoadingButton loading={isLoading} type="submit">Login</LoadingButton>
 *     </form>
 *   );
 * }
 *
 * @example
 * // Manual state control
 * const { state, isLoading, start, success, fail, reset } = useLoadingState();
 *
 * const handleSubmit = async () => {
 *   start();
 *   try {
 *     await api.createAthlete(data);
 *     success();
 *     navigate('/athletes');
 *   } catch (err) {
 *     fail(err.message);
 *   }
 * };
 *
 * // Show success message
 * if (state === 'success') return <Alert>Athlete created!</Alert>;
 *
 * @example
 * // Using state transitions for UI
 * const { state, error, withLoading, reset } = useLoadingState();
 *
 * const handleDelete = () => withLoading(() => api.deleteAthlete(id));
 *
 * if (state === 'success') {
 *   return <Alert severity="success">Deleted! <Button onClick={reset}>OK</Button></Alert>;
 * }
 *
 * if (state === 'error') {
 *   return <Alert severity="error">{error} <Button onClick={reset}>Retry</Button></Alert>;
 * }
 */
export function useLoadingState(): UseLoadingStateReturn {
  const [state, setState] = useState<LoadingStateStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const start = useCallback(() => {
    if (isMountedRef.current) {
      setState('loading');
      setError(null);
    }
  }, []);

  const success = useCallback(() => {
    if (isMountedRef.current) {
      setState('success');
      setError(null);
    }
  }, []);

  const fail = useCallback((errorMsg: string) => {
    if (isMountedRef.current) {
      setState('error');
      setError(errorMsg);
    }
  }, []);

  const reset = useCallback(() => {
    if (isMountedRef.current) {
      setState('idle');
      setError(null);
    }
  }, []);

  const withLoading = useCallback(
    async <T,>(asyncFn: () => Promise<T>): Promise<T> => {
      start();
      try {
        const result = await asyncFn();
        success();
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'An error occurred';
        fail(errorMsg);
        throw err;
      }
    },
    [start, success, fail]
  );

  return {
    state,
    error,
    isLoading: state === 'loading',
    start,
    success,
    fail,
    reset,
    withLoading,
  };
}
