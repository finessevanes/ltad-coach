---
id: FE-002
depends_on: [FE-001]
blocks: [FE-003, FE-004, FE-005, FE-007, FE-008, FE-011, FE-012, FE-013, FE-015]
---

# FE-002: Firebase Auth Client Setup

## Title
Configure Firebase Auth SDK with auth context and API client

## Scope

### In Scope
- Firebase SDK initialization
- Auth context provider with user state
- Auth state persistence across refreshes
- API client with automatic token injection
- Protected route wrapper component
- Auth loading state handling

### Out of Scope
- Login/Register UI (FE-003)
- Specific page implementations

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| State Management | React Context | Simple, built-in, sufficient for auth |
| Token Handling | Axios interceptors | Automatic token refresh and injection |
| Persistence | Firebase default (IndexedDB) | Survives browser refresh |

## Acceptance Criteria

- [x] Firebase SDK initializes without errors
- [x] `useAuth()` hook provides `user`, `loading`, `signIn`, `signOut`
- [x] Auth state persists across page refreshes
- [x] API client automatically adds Bearer token to requests
- [x] API client handles 401 by signing out user
- [x] `<ProtectedRoute>` component redirects unauthenticated users to /login
- [x] Loading spinner shows while auth state is being determined

## Files to Create/Modify

```
client/src/
├── firebase/
│   └── config.ts              # Firebase initialization
├── contexts/
│   └── AuthContext.tsx        # Auth provider and hook
├── services/
│   └── api.ts                 # Axios instance with auth
├── components/
│   └── ProtectedRoute.tsx     # Route guard component
├── App.tsx                    # Wrap with AuthProvider (modify)
└── types/
    └── auth.ts                # Auth-related types
```

## Implementation Details

### firebase/config.ts
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;
```

### types/auth.ts
```typescript
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  athleteCount: number;
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}
```

### contexts/AuthContext.tsx
```typescript
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { api } from '../services/api';
import { AuthUser, AuthContextType } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Validate token with backend and get user data
          const response = await api.post('/auth/token');
          setUser(response.data);
        } catch (error) {
          console.error('Token validation failed:', error);
          await firebaseSignOut(auth);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });
  };

  const signOut = async () => {
    await api.post('/auth/logout');
    await firebaseSignOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### services/api.ts
```typescript
import axios from 'axios';
import { auth } from '../firebase/config';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to all requests
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token invalid/expired - sign out
      await auth.signOut();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### components/ProtectedRoute.tsx
```typescript
import { Navigate, useLocation } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
```

### App.tsx Update
```typescript
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import { theme } from './theme';
import Routes from './routes';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <AuthProvider>
          <Routes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
```

## Dependencies to Add

```json
{
  "dependencies": {
    "firebase": "^10.7.0"
  }
}
```

## Estimated Complexity
**S** (Small) - 2-3 hours

## Testing Instructions

1. Verify Firebase initialization:
   - Check browser console for Firebase errors on load

2. Test auth state:
   - Sign in (you'll need FE-003 UI or use console)
   - Refresh page - user should persist
   - Sign out - user should be null

3. Test protected routes:
   - Navigate to a protected route while logged out
   - Should redirect to /login

4. Test API client:
   - Make API call while logged in
   - Check Network tab - should have Bearer token

## Session & Logout Convention

### Session Management
Firebase handles session persistence automatically via IndexedDB. Sessions persist until:
1. User explicitly logs out
2. Token becomes invalid (backend rejects)
3. User clears browser data

### Logout Flow
```
User clicks logout → signOut() called →
  1. POST /auth/logout (backend cleanup)
  2. Firebase signOut (client cleanup)
  3. Redirect to /login
  4. Clear user state
```

### Trade-offs

| Approach | Pros | Cons |
|----------|------|------|
| Firebase default (chosen) | Simple, handles refresh tokens | Sessions can be very long-lived |
| Custom JWT with short expiry | More control, forced re-auth | More complex, worse UX |
| Server-side session store | Revocable sessions | Requires Redis/DB, more infra |

**VERIFIED**: Firebase Auth config uses same project as backend (user confirmed).

## Out of Scope for MVP
- Settings/Profile page - coaches cannot update their profile information
- Password reset flow - use Firebase default emails
- These features can be added post-MVP.

## Notes
- The `getIdToken()` call automatically refreshes expired tokens
- Auth state listener fires on every page load to verify token
- Consider adding error boundaries for auth failures
