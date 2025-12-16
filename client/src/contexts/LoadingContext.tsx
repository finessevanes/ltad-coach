import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

/**
 * Represents a single loading operation tracked globally.
 */
export interface LoadingOperation {
  /** Whether the operation is currently active */
  active: boolean;
  /** Progress percentage (0-100), or -1 for indeterminate */
  progress: number;
  /** User-facing message describing the operation */
  message: string;
  /** Type of operation for categorization */
  type: 'api' | 'upload' | 'stream' | 'sync';
  /** Timestamp when operation started */
  startedAt: number;
}

/**
 * Context API for managing global loading state.
 * Use `useLoading` or `useLoadingState` hooks instead of accessing this directly.
 */
export interface LoadingContextType {
  /** Map of all active loading operations by key */
  loadingMap: Record<string, LoadingOperation>;
  /** Start a loading operation */
  startLoading: (key: string, options?: Partial<Omit<LoadingOperation, 'active' | 'startedAt'>>) => void;
  /** Stop a loading operation */
  stopLoading: (key: string) => void;
  /** Update progress for an operation (0-100) */
  setProgress: (key: string, progress: number) => void;
  /** Update message for an operation */
  updateMessage: (key: string, message: string) => void;
  /** Check if any operation (or specific operation) is loading */
  isLoading: (key?: string) => boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

interface LoadingProviderProps {
  children: ReactNode;
}

/**
 * Global loading state provider.
 * Wrap your app root with this to enable loading state management.
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
 *       <YourApp />
 *     </LoadingProvider>
 *   );
 * }
 */
export function LoadingProvider({ children }: LoadingProviderProps) {
  const [loadingMap, setLoadingMap] = useState<Record<string, LoadingOperation>>({});

  const startLoading = useCallback(
    (key: string, options?: Partial<Omit<LoadingOperation, 'active' | 'startedAt'>>) => {
      setLoadingMap((prev) => ({
        ...prev,
        [key]: {
          active: true,
          progress: options?.progress ?? -1,
          message: options?.message ?? '',
          type: options?.type ?? 'api',
          startedAt: Date.now(),
        },
      }));
    },
    []
  );

  const stopLoading = useCallback((key: string) => {
    setLoadingMap((prev) => {
      const newMap = { ...prev };
      delete newMap[key];
      return newMap;
    });
  }, []);

  const setProgress = useCallback((key: string, progress: number) => {
    setLoadingMap((prev) => {
      if (!prev[key]) return prev;
      return {
        ...prev,
        [key]: {
          ...prev[key],
          progress: Math.min(100, Math.max(0, progress)),
        },
      };
    });
  }, []);

  const updateMessage = useCallback((key: string, message: string) => {
    setLoadingMap((prev) => {
      if (!prev[key]) return prev;
      return {
        ...prev,
        [key]: {
          ...prev[key],
          message,
        },
      };
    });
  }, []);

  const isLoading = useCallback(
    (key?: string) => {
      if (key === undefined) {
        // Check if any operation is loading
        return Object.values(loadingMap).some((op) => op.active);
      }
      return loadingMap[key]?.active ?? false;
    },
    [loadingMap]
  );

  const value: LoadingContextType = {
    loadingMap,
    startLoading,
    stopLoading,
    setProgress,
    updateMessage,
    isLoading,
  };

  return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
}

/**
 * Access the loading context directly.
 *
 * **Note:** Most components should use `useLoading` or `useLoadingState` instead.
 * Only use this if you need direct access to the context API.
 *
 * @throws {Error} If used outside of LoadingProvider
 * @returns The loading context
 */
export function useLoadingContext(): LoadingContextType {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoadingContext must be used within a LoadingProvider');
  }
  return context;
}
