import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { AuthUser, AuthContextType } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapFirebaseUser = (user: User | null): AuthUser | null => {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(mapFirebaseUser(firebaseUser));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });
    // Update local state with the name
    setUser(mapFirebaseUser(credential.user));
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const getIdToken = async (): Promise<string | null> => {
    return auth.currentUser?.getIdToken() ?? null;
  };

  const value: AuthContextType = {
    user,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    getIdToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
