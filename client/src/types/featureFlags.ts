/**
 * Feature flag types for conditional feature rendering
 */

export interface FeatureFlags {
  assessmentsEnabled: boolean;
  athleteProfileEnabled: boolean;
}

export type FeatureFlagKey = keyof FeatureFlags;
