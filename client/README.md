# AI Coach - Frontend

> React + TypeScript + Material-UI coach dashboard

This is the frontend application for the AI Coach platform. It provides a responsive web interface for youth sports coaches to conduct athletic assessments, manage athlete rosters, and communicate results with parents.

[← Back to Project Overview](../README.md)

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18 | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tool & dev server |
| Material-UI | v5 | Component library |
| MediaPipe.js | 0.10.x | Pose detection (SOURCE OF TRUTH for metrics) |
| Firebase SDK | v10 | Auth, Firestore, Storage |
| React Router | v6 | Client-side routing |
| camelcase-keys | Latest | Case conversion |
| snakecase-keys | Latest | Case conversion |

> **Note**: The client is the SOURCE OF TRUTH for all CV metrics. MediaPipe.js runs in the browser and calculates all 11 metrics before sending to the backend.

---

## Prerequisites

- **Node.js** 18+ and **npm** 9+
- **Firebase** project configured (see [Getting Started](#getting-started))
- **Backend** running (see [../backend/README.md](../backend/README.md))

---

## Getting Started

### 1. Install Dependencies

```bash
cd client
npm install
```

### 2. Firebase Configuration

You'll need Firebase credentials from the Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create one)
3. Navigate to **Project Settings** > **General**
4. Scroll to **Your apps** section
5. Click **Web app** and copy the config values

### 3. Environment Configuration

Create `client/.env` file:

```bash
# Backend API
VITE_API_URL=http://localhost:8000

# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=ltad-coach.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ltad-coach
VITE_FIREBASE_STORAGE_BUCKET=ltad-coach.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

**Important**: All Vite environment variables must be prefixed with `VITE_` to be exposed to the client.

See [Environment Variables](#environment-variables) section for detailed descriptions.

### 4. Run Development Server

```bash
npm run dev
```

Application will be available at:
- **URL**: http://localhost:5173
- **Hot reload**: Enabled (changes appear instantly)

### 5. Verify Setup

1. Open http://localhost:5173
2. You should see the landing page
3. Try logging in (requires backend + Firebase Auth enabled)

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 5173 |
| `npm run build` | Production build to `dist/` directory |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint for code quality |
| `npm run format` | Run Prettier to format code |
| `npm run type-check` | Run TypeScript type checking |

---

## Project Structure

```
client/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── BalanceTestOverlay.tsx  # Skeleton overlay for video
│   │   ├── ConsentAlert.tsx        # Consent status alerts
│   │   ├── EmptyState.tsx          # Empty list placeholder
│   │   ├── LoadingState.tsx        # Loading spinner
│   │   ├── ProtectedRoute.tsx      # Auth route guard
│   │   ├── StatusBadge.tsx         # Consent status badges
│   │   ├── Layout/                 # App layout components
│   │   └── AuthForm/               # Auth form components
│   │
│   ├── pages/               # Route components
│   │   ├── Home.tsx              # Coach dashboard (home)
│   │   ├── Login.tsx             # Authentication
│   │   ├── Register.tsx          # Account creation
│   │   ├── Assessment/           # Assessment flow
│   │   │   ├── AssessmentFlow.tsx    # Main orchestrator
│   │   │   ├── AssessmentResults.tsx # Display metrics
│   │   │   ├── BackupUpload.tsx      # Video upload flow
│   │   │   ├── steps/
│   │   │   │   ├── TestSetup.tsx     # Test configuration
│   │   │   │   ├── RecordingStep.tsx # Camera + recording
│   │   │   │   ├── ReviewStep.tsx    # Review before submit
│   │   │   │   └── UploadStep.tsx    # Upload progress
│   │   │   └── components/
│   │   │       ├── CameraSelector.tsx
│   │   │       ├── CountdownOverlay.tsx
│   │   │       ├── DropZone.tsx
│   │   │       ├── RecordingTimer.tsx
│   │   │       └── VideoPreview.tsx
│   │   ├── Athletes/             # Athlete management
│   │   │   ├── AthletesList.tsx  # Roster list view
│   │   │   ├── AthletesTable.tsx # Table component
│   │   │   └── AddAthlete.tsx    # Add/edit forms
│   │   └── Consent/              # Public consent flow
│   │       └── index.tsx         # Consent form (no auth)
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useBalanceTest.ts     # Full test state machine (SOURCE OF TRUTH)
│   │   ├── useMediaPipe.ts       # Pose detection loop
│   │   ├── useCamera.ts          # Camera access
│   │   ├── useVideoRecorder.ts   # MediaRecorder wrapper
│   │   ├── useFirebaseUpload.ts  # Storage upload
│   │   └── useAssessmentPolling.ts # Poll for completion
│   │
│   ├── services/            # API & external services
│   │   ├── api.ts           # Backend API client (with case conversion)
│   │   ├── assessments.ts   # POST metrics to backend
│   │   ├── athletes.ts      # Athlete CRUD
│   │   └── ...
│   │
│   ├── firebase/            # Firebase configuration
│   │   └── config.ts        # Firebase initialization
│   │
│   ├── types/               # TypeScript interfaces
│   │   ├── athlete.ts
│   │   ├── assessment.ts
│   │   ├── mediapipe.ts     # Landmark types
│   │   └── ...
│   │
│   ├── utils/               # Metrics calculation (SOURCE OF TRUTH)
│   │   ├── metricsCalculation.ts  # All 11 CV metrics
│   │   ├── positionDetection.ts   # Pose state machine + failure detection
│   │   ├── metricsComparison.ts   # Compare test results
│   │   ├── validation.ts
│   │   └── firebaseErrors.ts
│   │
│   ├── contexts/            # React Context providers
│   │   ├── AuthContext.tsx       # Firebase auth state
│   │   └── SnackbarContext.tsx   # Toast notifications
│   │
│   ├── App.tsx              # Root component with routing
│   ├── main.tsx             # Application entry point
│   └── vite-env.d.ts        # Vite type declarations
│
├── public/                  # Static assets
│   ├── favicon.ico
│   └── ...
│
├── prds/                    # Frontend PRD specifications
│   ├── FE-001-project-setup.md
│   ├── FE-002-firebase-auth-client.md
│   ├── ...
│   └── FE-016-landing-page.md
│
├── index.html               # HTML entry point
├── package.json             # Dependencies & scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite configuration
├── .eslintrc.cjs            # ESLint configuration
├── .prettierrc              # Prettier configuration
└── README.md                # This file
```

---

## Key Features

### Balance Test Recording (FE-008, FE-009) - SOURCE OF TRUTH

**Location**: `src/components/BalanceTest.tsx`, `src/hooks/useBalanceTest.tsx`, `src/utils/metricsCalculation.ts`

The client calculates ALL 11 CV metrics using MediaPipe.js:

- Uses `getUserMedia()` for camera access (webcam or iPhone Continuity Camera)
- MediaPipe.js streams landmarks at ≥15 FPS via `useMediaPipe` hook
- `useBalanceTest` accumulates positions and manages test state machine
- `metricsCalculation.ts` calculates all 11 metrics when test completes
- `positionDetection.ts` detects failures (foot down, hands off hips, etc.)
- 3-second countdown before test begins
- 30-second max timer during test
- Video recorded and uploaded to Firebase Storage

**Metrics Calculated Client-Side** (`utils/metricsCalculation.ts`):
```typescript
{
  holdTime: number;           // Seconds in valid position
  stabilityScore: number;     // 0-100 composite score
  swayStdX: number;          // Hip horizontal variance
  swayStdY: number;          // Hip vertical variance
  swayPathLength: number;    // Total hip trajectory
  swayVelocity: number;      // Average hip speed
  armDeviationLeft: number;  // Left arm movement
  armDeviationRight: number; // Right arm movement
  armAsymmetryRatio: number; // L/R compensation ratio
  correctionsCount: number;  // Balance adjustments
  failureReason: string | null; // Failure type or null
}
```

**Important**: Client-side MediaPipe.js is the **SOURCE OF TRUTH** for all metrics. The backend only validates auth/consent and adds duration scoring.

### Video Upload (FE-010)

**Location**: `src/components/VideoUpload.tsx`

Backup workflow for pre-recorded videos:
- Drag-and-drop or file picker
- Supported formats: `.mp4`, `.mov`, `.avi`, `.m4v`, `.webm`, HEVC
- Max file size: 100MB
- Preview before submitting

### Assessment Display (FE-011)

**Location**: `src/components/AssessmentResults.tsx`, `src/components/ScoreBadge.tsx`

Displays results with:
- **Duration Score Badge** (1-5 with label)
- **Age Comparison** (meets/above/below expected level)
- **Team Quality Rank** (e.g., "3rd most stable on your roster")
- **Quality Metrics Breakdown** (expandable detail view)
- **AI Feedback** (coach-friendly suggestions)
- **Add Notes** (coach annotations)

### Athlete Management (FE-004, FE-005, FE-012)

**Roster List** (`src/pages/Athletes/AthletesList.tsx`):
- View all athletes with consent status badges
- Search and filter
- Add new athlete button

**Add/Edit Forms** (`src/pages/Athletes/AddAthlete.tsx`):
- Name, age, gender, parent email
- Validation with clear error messages

**Athlete Profile**:
- Assessment history list
- Progress chart
- Generate report button
- New assessment button

### Consent Status UI (FE-007)

**Location**: `src/components/StatusBadge.tsx`, `src/components/ConsentAlert.tsx`

Visual indicators for consent status:
- **Pending** (yellow): Awaiting parent consent
- **Active** (green): Consent granted, can assess
- **Declined** (red): Consent declined
- Resend consent email button for pending status

### Dashboard (FE-015)

**Location**: `src/pages/Home.tsx`

Coach home screen showing:
- Quick stats (total athletes, assessments this month, pending consent)
- Recent assessments feed
- Pending consent alerts
- Quick actions (add athlete, view roster)

---

## Code Patterns

### Component Structure

Functional components with hooks:

```typescript
import React, { useState } from 'react';
import { Card, Button } from '@mui/material';
import type { Assessment } from '@/types/assessment';

interface Props {
  athleteId: string;
  onComplete: (result: Assessment) => void;
}

export const AssessmentCard: React.FC<Props> = ({ athleteId, onComplete }) => {
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      // ... logic
      onComplete(result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ p: 2 }}>
      <Button onClick={handleAnalyze} disabled={loading}>
        Analyze
      </Button>
    </Card>
  );
};
```

### API Calls with Case Conversion

Backend uses `snake_case`, frontend uses `camelCase`. Automatically convert:

```typescript
import camelcaseKeys from 'camelcase-keys';
import snakecaseKeys from 'snakecase-keys';
import { api } from '@/services/api';

// POST request - convert to snake_case
const data = { athleteName: 'John Doe', parentEmail: 'parent@example.com' };
const response = await api.post('/athletes', snakecaseKeys(data));

// Response - convert to camelCase
const athlete = camelcaseKeys(response.data);
// athlete.athleteName (not athlete.athlete_name)
```

### State Management

**No Redux**. Use:
- **React Context** for global state (auth, theme)
- **Local component state** for UI state
- **React Query** (optional) for server state caching

**Example: AuthContext**

```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/services/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

### Material-UI Styling

Use `sx` prop for inline styles (preferred):

```typescript
<Box
  sx={{
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    p: 3,
    backgroundColor: 'background.paper',
    borderRadius: 1,
  }}
>
  {/* content */}
</Box>
```

For complex styles, use `styled`:

```typescript
import { styled } from '@mui/material/styles';
import { Card } from '@mui/material';

const StyledCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
}));
```

---

## Environment Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8000` | Yes |
| `VITE_FIREBASE_API_KEY` | Firebase Web API key | `AIzaSy...` | Yes |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | `ltad-coach.firebaseapp.com` | Yes |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project identifier | `ltad-coach` | Yes |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket | `ltad-coach.appspot.com` | Yes |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Cloud Messaging sender ID | `123456789` | Yes |
| `VITE_FIREBASE_APP_ID` | Firebase app identifier | `1:123:web:abc` | Yes |

**Finding these values**:
1. Firebase Console → Your Project
2. Project Settings (gear icon)
3. General tab → Your apps → Web app
4. Copy config values

---

## Building for Production

### Build Command

```bash
npm run build
```

Output: `dist/` directory containing:
- Minified JavaScript bundles
- Optimized CSS
- Static assets
- `index.html`

### Build Optimization

Vite automatically:
- Code splits by route
- Tree-shakes unused code
- Minifies JavaScript and CSS
- Optimizes images
- Generates source maps (in dev mode)

### Build Size

Expected build sizes:
- JavaScript: ~500-700 KB (gzipped)
- CSS: ~50-100 KB (gzipped)

Large dependencies:
- Material-UI (~300 KB)
- Firebase SDK (~200 KB)
- MediaPipe.js (~150 KB)

---

## Deployment

### Vercel (Recommended)

1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Import Project"
   - Select GitHub repository
   - Choose `client/` as root directory

2. **Configure Build Settings**
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Set Environment Variables**
   - Add all `VITE_*` variables in Vercel dashboard
   - **Do not commit `.env` to git**

4. **Deploy**
   - Deploys automatically on push to `main` branch
   - Preview deployments for PRs

### Other Platforms

Can also deploy to:
- **Netlify**: Similar workflow to Vercel
- **Firebase Hosting**: Native integration
- **AWS S3 + CloudFront**: Static hosting
- **GitHub Pages**: Free for public repos

---

## Performance Notes

### Non-Functional Requirements

- **NFR-1**: Skeleton overlay must render at ≥15 FPS
- **NFR-4**: Page load times must be <3 seconds

### Optimization Strategies

1. **Lazy Loading**
   ```typescript
   const AssessmentResults = lazy(() => import('@/pages/AssessmentResults'));
   ```

2. **Memoization**
   ```typescript
   const MemoizedChart = React.memo(ProgressChart);
   ```

3. **Firebase Query Optimization**
   - Use `limit()` for large collections
   - Index frequently queried fields
   - Cache results with React Query

4. **Image Optimization**
   - Use WebP format
   - Lazy load images below fold
   - Use `srcset` for responsive images

---

## Important: MediaPipe.js Usage

### Client is Source of Truth (Current Implementation)

Client-side MediaPipe.js is the **SOURCE OF TRUTH** for all metrics:
- Streams pose landmarks at ≥15 FPS during recording
- Renders skeleton overlay for visual feedback
- `useBalanceTest` accumulates landmark positions
- `metricsCalculation.ts` calculates all 11 metrics
- `positionDetection.ts` detects test failures
- Pre-calculated metrics sent to backend via POST

### Backend Role

Backend acts as a validated write proxy:
- Validates Firebase auth token
- Validates athlete ownership and consent status
- Calculates duration_score (1-5 LTAD scale)
- Calculates age_expectation (above/meets/below)
- Stores assessment as "completed" immediately

### Assessment Flow

```
1. useMediaPipe streams landmarks → useBalanceTest accumulates
2. On test complete → metricsCalculation.ts calculates 11 metrics
3. Video uploaded to Firebase Storage
4. POST /assessments/analyze with client_metrics
5. Backend validates, adds duration_score, stores assessment
6. Frontend displays results
```

**Why this architecture?**
- Immediate results (no polling, no background processing)
- Reduced server-side compute requirements
- Simpler backend (no MediaPipe Python, no OpenCV)
- All processing happens during recording, not after

> **Note**: This differs from the original PRD which planned for server-side MediaPipe. The implementation was changed to improve user experience and reduce infrastructure complexity.

---

## Troubleshooting

### Camera Not Working

**Issue**: "Permission denied" or camera not accessible

**Solutions**:
- Check browser permissions (Settings → Privacy → Camera)
- Ensure HTTPS or localhost (required for `getUserMedia()`)
- Try different browsers (Chrome/Edge work best)
- For iOS: Use Safari (other browsers don't support camera on iOS)
- For iPhone Continuity Camera on Mac: Ensure devices on same Apple ID

### Build Errors

**Issue**: TypeScript errors during build

**Solutions**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version (must be 18+)
node -v

# Verify all environment variables are set
cat .env
```

### Firebase Connection Issues

**Issue**: "Firebase: Error (auth/invalid-api-key)"

**Solutions**:
- Verify all `VITE_FIREBASE_*` variables in `.env`
- Ensure variables are prefixed with `VITE_`
- Restart dev server after changing `.env`
- Check Firebase project is active (not deleted)

### API Calls Failing

**Issue**: CORS errors or 404 responses

**Solutions**:
- Verify backend is running on `http://localhost:8000`
- Check `VITE_API_URL` in `.env` matches backend URL
- Ensure backend allows CORS from frontend origin
- Check network tab in browser DevTools for details

### Slow Development Server

**Issue**: Hot reload takes >5 seconds

**Solutions**:
- Reduce imported modules (check `import` statements)
- Clear Vite cache: `rm -rf node_modules/.vite`
- Disable browser extensions
- Increase Node.js memory: `NODE_OPTIONS=--max-old-space-size=4096 npm run dev`

---

## Testing

### Manual Testing Checklist

Before submitting PR:

- [ ] Login/logout works
- [ ] Can add/edit athlete
- [ ] Consent status displays correctly
- [ ] Camera preview shows skeleton overlay
- [ ] Video recording works (30-second test)
- [ ] Upload video works (backup flow)
- [ ] Assessment results display correctly
- [ ] Generate and send parent report
- [ ] Responsive on tablet (iPad minimum)
- [ ] No console errors

### Browser Compatibility

**Supported**:
- Chrome 90+ ✅
- Edge 90+ ✅
- Safari 14+ ✅
- Firefox 88+ ✅

**Not Supported**:
- IE 11 ❌
- Opera Mini ❌

**Mobile**:
- iOS Safari 14+ ✅
- Chrome Android ⚠️ (camera may not work)

---

## Related Documentation

- [Backend Setup](../backend/README.md) - API and Python setup
- [Developer Guide](../CLAUDE.md) - Comprehensive patterns and standards
- [Product Requirements](../prd.md) - Full technical specifications
- [Frontend PRDs](./prds/) - Detailed feature specs (FE-001 to FE-016)

---

## Code Standards

### General

- **Functional components** with hooks (no class components)
- **Props as interfaces** (not inline types)
- **2-space indentation** (enforced by Prettier)
- **Named exports** (not default exports for components)

### TypeScript

- Prefer `interface` over `type` for object shapes
- Use `type` for unions, intersections, and primitives
- Add explicit return types to exported functions
- Avoid `any` - use `unknown` if type is truly unknown

### Imports

Order imports:
1. React and external libraries
2. Internal absolute imports (`@/...`)
3. Relative imports (`./`, `../`)
4. Type imports (separate)

```typescript
import React, { useState } from 'react';
import { Button, Card } from '@mui/material';
import { api } from '@/services/api';
import { AthleteForm } from './AthleteForm';
import type { Athlete } from '@/types/athlete';
```

### Naming Conventions

- **Components**: PascalCase (`AthleteCard`, `VideoRecorder`)
- **Hooks**: camelCase with `use` prefix (`useAuth`, `useCamera`)
- **Files**: Match component name (`AthleteCard.tsx`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_ATHLETES`)
- **Functions**: camelCase (`handleSubmit`, `fetchAthletes`)

See [CLAUDE.md](../CLAUDE.md) for complete coding standards.

---

## Support

For questions or issues:
- Check [Troubleshooting](#troubleshooting) section above
- Review [CLAUDE.md](../CLAUDE.md) for patterns
- Check PRD files in `prds/` directory
- Create an issue on GitHub
