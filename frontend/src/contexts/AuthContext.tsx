"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { useFirebase } from './FirebaseContext';
import { useRouter } from 'next/navigation';
import { toast } from "@/components/ui/use-toast"
import { Loader } from "@/components/Loader";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<User>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { auth } = useFirebase();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Inactivity timer (30 minutes)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        toast({ title: "Logged out due to inactivity", description: "You have been logged out after 30 minutes of inactivity.", variant: "destructive" });
        signOutUser();
      }, 30 * 60 * 1000); // 30 minutes
    };
    const events = ["mousemove", "keydown", "mousedown", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();
    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    // No debug log
  }, [user, loading]);

  // Token/session expiry check
  useEffect(() => {
    if (!user) return;
    const checkToken = async () => {
      try {
        const token = await user.getIdToken();
        const { exp } = JSON.parse(atob(token.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        if (exp < now) {
          toast({ title: "Session expired", description: "Your session has expired. Please log in again.", variant: "destructive" });
          signOutUser();
        }
      } catch {
        toast({ title: "Session error", description: "Authentication error. Please log in again.", variant: "destructive" });
        signOutUser();
      }
    };
    checkToken();
    // Optionally, check every 5 minutes
    const interval = setInterval(checkToken, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const signUp = async (email: string, password: string): Promise<User> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (!userCredential.user) {
        throw new Error("User creation failed, no user returned from Firebase.");
    }
    return userCredential.user;
  };

  const signIn = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const res = await fetch(`/api/v1/users/${userCredential.user.uid}`);
    if (!res.ok) {
      await signOut(auth);
      throw new Error("Account not found or backend issue. Please register or contact support.");
    }
  };

  const signOutUser = async () => {
    await signOut(auth);
    localStorage.removeItem("adhub_token");
    localStorage.removeItem("adhub_current_org");
    router.push('/login');
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut: signOutUser,
    resetPassword,
    signInWithGoogle,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader />
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 