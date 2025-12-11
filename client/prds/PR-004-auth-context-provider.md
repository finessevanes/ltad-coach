---
id: FE-004
depends_on: [FE-002]
blocks: [FE-006, FE-007, FE-008]
---

# FE-004: Auth Context Provider

## Scope

**In Scope:**
- Create Auth context
- Firebase Auth state listener
- Login, logout, register functions
- Current user state management

**Out of Scope:**
- Login/register UI (FE-007, FE-008)
- Protected routes (FE-006)

## Technical Decisions

- **Pattern**: React Context + hooks
- **State**: currentUser, loading, error
- **Auth Methods**: Email/password + Google OAuth
- **Persistence**: Firebase handles automatically

## Acceptance Criteria

- [ ] AuthContext provides user state
- [ ] useAuth hook for easy access
- [ ] Login/logout functions work
- [ ] Auth state persists across refreshes
- [ ] Loading state during auth check

## Files to Create/Modify

- `src/contexts/AuthContext.jsx` (create)
- `src/hooks/useAuth.js` (create)
- `src/App.jsx` (modify - wrap with provider)

## Implementation Notes

**src/contexts/AuthContext.jsx**:
```jsx
import { createContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../services/firebase';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (email, password) => {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    loginWithGoogle,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
```

**src/hooks/useAuth.js**:
```javascript
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

**src/App.jsx** (modify):
```jsx
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          {/* Routes */}
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
```

## Testing

In any component:
```jsx
import { useAuth } from '../hooks/useAuth';

const { currentUser, login, logout } = useAuth();
console.log('Current user:', currentUser);
```

## Estimated Complexity

**Size**: M (Medium - ~2 hours)
