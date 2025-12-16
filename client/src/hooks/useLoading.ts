import { useEffect, useCallback, useRef } from 'react';
import { useLoadingContext, LoadingOperation } from '../contexts/LoadingContext';

interface UseLoadingOptions extends Partial<Omit<LoadingOperation, 'active' | 'startedAt'>> {}

interface UseLoadingReturn {
  isLoading: boolean;
  progress: number;
  message: string;
  start: (options?: UseLoadingOptions) => void;
  stop: () => void;
  setProgress: (value: number) => void;
  updateMessage: (msg: string) => void;
  withLoading: <T>(asyncFn: () => Promise<T>, options?: UseLoadingOptions) => Promise<T>;
}

/**
 * Hook for managing a loading operation with global awareness and progress tracking.
 *
 * **When to use:**
 * - File uploads with progress tracking
 * - Multi-step workflows
 * - Operations that need to show in GlobalLoadingBar
 * - When you need progress percentage (0-100)
 *
 * **When NOT to use:**
 * - Simple form submissions (use `useLoadingState` instead)
 * - Operations that don't need global visibility
 *
 * **Features:**
 * - Automatically shows in GlobalLoadingBar
 * - Progress tracking (0-100% or indeterminate)
 * - Dynamic message updates
 * - Memory leak prevention (safe on unmount)
 * - `withLoading` helper for automatic cleanup
 *
 * @param operationKey - Unique identifier for this operation (e.g., 'upload-video', 'fetch-dashboard')
 * @param defaultOptions - Default options (type, message, progress) applied on every start()
 * @returns Object with loading state, progress, and control methods
 *
 * @example
 * // Simple API fetch
 * const { isLoading, start, stop } = useLoading('fetch-athletes');
 *
 * useEffect(() => {
 *   const loadData = async () => {
 *     start({ type: 'api', message: 'Loading athletes...' });
 *     try {
 *       const data = await api.getAthletes();
 *       setAthletes(data);
 *     } finally {
 *       stop(); // Always runs, even on error
 *     }
 *   };
 *   loadData();
 * }, [start, stop]);
 *
 * @example
 * // File upload with progress
 * const { isLoading, progress, start, stop, setProgress } = useLoading('upload-video', {
 *   type: 'upload',
 * });
 *
 * const handleUpload = async (file: File) => {
 *   start({ message: 'Uploading video...' });
 *   try {
 *     const uploadTask = storage.ref(`videos/${file.name}`).put(file);
 *     uploadTask.on('state_changed', (snapshot) => {
 *       const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
 *       setProgress(pct);
 *     });
 *     await uploadTask;
 *   } finally {
 *     stop();
 *   }
 * };
 *
 * @example
 * // Using withLoading helper for auto cleanup
 * const { withLoading } = useLoading('submit-form');
 *
 * const handleSubmit = async (data: FormData) => {
 *   await withLoading(
 *     () => api.submitForm(data),
 *     { type: 'api', message: 'Submitting...' }
 *   );
 * };
 *
 * @example
 * // Multi-step workflow
 * const uploadLeft = useLoading('upload-left');
 * const uploadRight = useLoading('upload-right');
 * const analyze = useLoading('analyze-results');
 *
 * const processAssessment = async () => {
 *   await uploadLeft.withLoading(() => uploadFile(leftVideo));
 *   await uploadRight.withLoading(() => uploadFile(rightVideo));
 *   await analyze.withLoading(() => analyzeVideos());
 * };
 */
export function useLoading(operationKey: string, defaultOptions?: UseLoadingOptions): UseLoadingReturn {
  const { loadingMap, startLoading, stopLoading, setProgress: setContextProgress, updateMessage: updateContextMessage } = useLoadingContext();
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const operation = loadingMap[operationKey];

  const start = useCallback(
    (options?: UseLoadingOptions) => {
      if (isMountedRef.current) {
        startLoading(operationKey, {
          ...defaultOptions,
          ...options,
        });
      }
    },
    [operationKey, startLoading, defaultOptions]
  );

  const stop = useCallback(() => {
    if (isMountedRef.current) {
      stopLoading(operationKey);
    }
  }, [operationKey, stopLoading]);

  const setProgress = useCallback(
    (value: number) => {
      if (isMountedRef.current) {
        setContextProgress(operationKey, value);
      }
    },
    [operationKey, setContextProgress]
  );

  const updateMessage = useCallback(
    (msg: string) => {
      if (isMountedRef.current) {
        updateContextMessage(operationKey, msg);
      }
    },
    [operationKey, updateContextMessage]
  );

  const withLoading = useCallback(
    async <T,>(asyncFn: () => Promise<T>, options?: UseLoadingOptions): Promise<T> => {
      start(options);
      try {
        const result = await asyncFn();
        return result;
      } finally {
        stop();
      }
    },
    [start, stop]
  );

  return {
    isLoading: operation?.active ?? false,
    progress: operation?.progress ?? -1,
    message: operation?.message ?? '',
    start,
    stop,
    setProgress,
    updateMessage,
    withLoading,
  };
}
