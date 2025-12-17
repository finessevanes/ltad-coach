import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FeatureFlags } from '../types/featureFlags';
import { api } from '../services/api';

/**
 * Context API for managing feature flags.
 * Use `useFeatureFlags` hook instead of accessing this directly.
 */
export interface FeatureFlagContextType {
  /** Current feature flag values */
  flags: FeatureFlags;
  /** Whether flags are still loading from backend */
  loading: boolean;
  /** Check if a specific feature is enabled */
  isEnabled: (flagKey: keyof FeatureFlags) => boolean;
  /** Refresh flags from backend */
  refresh: () => Promise<void>;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

interface FeatureFlagProviderProps {
  children: ReactNode;
}

/**
 * Global feature flag provider.
 * Wrap your app root with this to enable feature flag management.
 *
 * @example
 * // In App.tsx
 * import { FeatureFlagProvider } from './contexts/FeatureFlagContext';
 *
 * function App() {
 *   return (
 *     <FeatureFlagProvider>
 *       <YourApp />
 *     </FeatureFlagProvider>
 *   );
 * }
 */
export function FeatureFlagProvider({ children }: FeatureFlagProviderProps) {
  const [flags, setFlags] = useState<FeatureFlags>({
    assessmentsEnabled: true, // Default to enabled
    athleteProfileEnabled: true, // Default to enabled
  });
  const [loading, setLoading] = useState(true);

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const response = await api.get<Record<string, boolean>>('/feature-flags');

      // Convert snake_case from backend to camelCase for frontend
      const data = response.data;
      setFlags({
        assessmentsEnabled: data.assessments_enabled ?? true,
        athleteProfileEnabled: data.athlete_profile_enabled ?? true,
      });
    } catch (error) {
      console.error('Failed to fetch feature flags, using defaults:', error);
      // Keep default flags on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();

    // Development console API for toggling flags
    if (process.env.NODE_ENV === 'development') {
      (window as any).__FF__ = {
        setFlag: (flagKey: keyof FeatureFlags, value: boolean) => {
          setFlags((prev) => ({ ...prev, [flagKey]: value }));
          console.log(`Feature flag "${flagKey}" set to ${value}`);
        },
        getFlags: () => flags,
      };
    }
  }, []);

  const isEnabled = (flagKey: keyof FeatureFlags): boolean => {
    return flags[flagKey] ?? false;
  };

  const value: FeatureFlagContextType = {
    flags,
    loading,
    isEnabled,
    refresh: fetchFlags,
  };

  return <FeatureFlagContext.Provider value={value}>{children}</FeatureFlagContext.Provider>;
}

/**
 * Access the feature flag context.
 *
 * @throws {Error} If used outside of FeatureFlagProvider
 * @returns The feature flag context
 *
 * @example
 * function MyComponent() {
 *   const { flags, isEnabled } = useFeatureFlags();
 *
 *   if (!isEnabled('assessmentsEnabled')) {
 *     return <div>Assessments are currently disabled</div>;
 *   }
 *
 *   return <AssessmentsList />;
 * }
 */
export function useFeatureFlags(): FeatureFlagContextType {
  const context = useContext(FeatureFlagContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  return context;
}
