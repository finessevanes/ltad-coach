# Feature Flags Guide

This document explains how to use feature flags in the LTAD Coach application to control feature availability.

## Overview

Feature flags allow you to enable or disable specific features without code changes. This is useful for:
- Rolling out features gradually
- A/B testing
- Emergency feature disabling
- Environment-specific features

## Available Feature Flags

| Flag Name | Environment Variable | Default | Description |
|-----------|---------------------|---------|-------------|
| `assessmentsEnabled` | `FEATURE_ASSESSMENTS_ENABLED` | `true` | Controls all assessment-related routes and functionality |
| `athleteProfileEnabled` | `FEATURE_ATHLETE_PROFILE_ENABLED` | `true` | Controls athlete profile page access |

## Backend Configuration

### 1. Environment Variables

Add feature flags to your `backend/.env` file:

```bash
# Feature Flags (defaults to true if not set)
FEATURE_ASSESSMENTS_ENABLED=true
FEATURE_ATHLETE_PROFILE_ENABLED=true
```

### 2. Configuration File

Feature flags are defined in [backend/app/config.py](backend/app/config.py):

```python
class Settings(BaseSettings):
    # Feature Flags
    feature_assessments_enabled: bool = True
    feature_athlete_profile_enabled: bool = True

    @property
    def feature_flags(self) -> dict[str, bool]:
        """Get all feature flags as a dictionary."""
        return {
            "assessments_enabled": self.feature_assessments_enabled,
            "athlete_profile_enabled": self.feature_athlete_profile_enabled,
        }
```

### 3. API Endpoint

The backend exposes feature flags via the `/feature-flags` endpoint:

```bash
curl http://localhost:8000/feature-flags
```

Response:
```json
{
  "assessments_enabled": true,
  "athlete_profile_enabled": true
}
```

## Frontend Usage

### 1. Provider Setup

The `FeatureFlagProvider` is already configured in [client/src/App.tsx](client/src/App.tsx):

```tsx
<FeatureFlagProvider>
  <AuthProvider>
    <YourApp />
  </AuthProvider>
</FeatureFlagProvider>
```

### 2. Using the Hook

Access feature flags in any component:

```tsx
import { useFeatureFlags } from '../contexts/FeatureFlagContext';

function MyComponent() {
  const { flags, isEnabled, loading } = useFeatureFlags();

  if (loading) {
    return <CircularProgress />;
  }

  if (!isEnabled('assessmentsEnabled')) {
    return <div>Assessments are currently disabled</div>;
  }

  return <AssessmentsList />;
}
```

### 3. Route Protection

Routes are automatically protected using `FeatureFlagRoute` wrapper in [client/src/routes/index.tsx](client/src/routes/index.tsx):

```tsx
{
  path: "/assessments",
  element: (
    <Layout>
      <ProtectedRoute>
        <FeatureFlagRoute flag="assessmentsEnabled">
          <AssessmentsList />
        </FeatureFlagRoute>
      </ProtectedRoute>
    </Layout>
  ),
}
```

### 4. Conditional UI Elements

Hide/show UI elements based on flags:

```tsx
import { useFeatureFlags } from '../contexts/FeatureFlagContext';

function Navigation() {
  const { isEnabled } = useFeatureFlags();

  return (
    <nav>
      <Link to="/dashboard">Dashboard</Link>
      {isEnabled('assessmentsEnabled') && (
        <Link to="/assessments">Assessments</Link>
      )}
      {isEnabled('athleteProfileEnabled') && (
        <Link to="/athletes">Athletes</Link>
      )}
    </nav>
  );
}
```

## Protected Routes

The following routes are protected by feature flags:

### Assessments (`assessmentsEnabled`)
- `/assess/:athleteId` - Assessment flow
- `/assess/:athleteId/upload` - Backup upload
- `/assessments/:assessmentId` - Assessment results
- `/assessments` - Assessments list

### Athlete Profile (`athleteProfileEnabled`)
- `/athletes/:athleteId` - Athlete profile page

## Fallback Behavior

When a feature is disabled, the `FeatureFlagRoute` component shows:

**Default (message mode):**
```
┌──────────────────────────────────┐
│    🚫                            │
│    Feature Temporarily           │
│    Unavailable                   │
│                                  │
│    This feature is currently     │
│    disabled. Please check back   │
│    later or contact support.     │
└──────────────────────────────────┘
```

**Redirect mode:**
```tsx
<FeatureFlagRoute
  flag="assessmentsEnabled"
  fallback="redirect"
  redirectTo="/dashboard"
>
  <AssessmentsList />
</FeatureFlagRoute>
```

## Adding New Feature Flags

### 1. Backend

Add to [backend/app/config.py](backend/app/config.py):

```python
class Settings(BaseSettings):
    # Feature Flags
    feature_new_feature_enabled: bool = True

    @property
    def feature_flags(self) -> dict[str, bool]:
        return {
            "new_feature_enabled": self.feature_new_feature_enabled,
            # ... other flags
        }
```

Add to `backend/.env`:
```bash
FEATURE_NEW_FEATURE_ENABLED=true
```

### 2. Frontend

Add to [client/src/types/featureFlags.ts](client/src/types/featureFlags.ts):

```typescript
export interface FeatureFlags {
  newFeatureEnabled: boolean;
  // ... other flags
}
```

Update [client/src/contexts/FeatureFlagContext.tsx](client/src/contexts/FeatureFlagContext.tsx):

```typescript
setFlags({
  newFeatureEnabled: response.new_feature_enabled ?? true,
  // ... other flags
});
```

### 3. Use in Routes

Wrap your route with `FeatureFlagRoute`:

```tsx
{
  path: "/new-feature",
  element: (
    <Layout>
      <ProtectedRoute>
        <FeatureFlagRoute flag="newFeatureEnabled">
          <NewFeature />
        </FeatureFlagRoute>
      </ProtectedRoute>
    </Layout>
  ),
}
```

## Deployment Scenarios

### Disable Feature in Production

```bash
# In production .env
FEATURE_ASSESSMENTS_ENABLED=false
```

### Enable Feature Only in Staging

```bash
# staging.env
FEATURE_NEW_FEATURE_ENABLED=true

# production.env
FEATURE_NEW_FEATURE_ENABLED=false
```

## Best Practices

1. **Default to Enabled**: Set `default=true` for production features to avoid breakage
2. **Use Descriptive Names**: Name flags by feature, not implementation (`assessmentsEnabled` not `showAssessments`)
3. **Clean Up**: Remove flags once features are stable and fully rolled out
4. **Document Changes**: Update this file when adding new flags
5. **Test Both States**: Always test with flags both enabled and disabled
6. **Cache Wisely**: Flags are cached on initial load; use `refresh()` if dynamic updates are needed

## Troubleshooting

### Flags Not Loading

Check the browser console for errors:
```javascript
// Should see successful fetch
GET http://localhost:8000/feature-flags
```

### Flag Changes Not Reflecting

The frontend caches flags on app load. To force refresh:

```tsx
const { refresh } = useFeatureFlags();

// Call when needed
await refresh();
```

Or reload the page to fetch fresh flags.

### TypeScript Errors

Ensure flag names match exactly between:
- Backend: `config.py` (snake_case)
- Frontend types: `featureFlags.ts` (camelCase)
- Frontend context: Conversion in `FeatureFlagContext.tsx`

## Related Files

- Backend Config: [backend/app/config.py](backend/app/config.py)
- Backend Router: [backend/app/routers/feature_flags.py](backend/app/routers/feature_flags.py)
- Frontend Types: [client/src/types/featureFlags.ts](client/src/types/featureFlags.ts)
- Frontend Context: [client/src/contexts/FeatureFlagContext.tsx](client/src/contexts/FeatureFlagContext.tsx)
- Frontend Component: [client/src/components/FeatureFlagRoute.tsx](client/src/components/FeatureFlagRoute.tsx)
- Routes Configuration: [client/src/routes/index.tsx](client/src/routes/index.tsx)
