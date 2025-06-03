"use client"

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
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
import { Loader } from "@/components/core/Loader";

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

  // Memoize signOutUser
  const signOutUser = useCallback(async () => {
    if (!auth) {
      console.error("Firebase auth is not initialized. Cannot sign out.");
      // Still attempt to clear local storage and redirect as a fallback
      localStorage.removeItem("adhub_token");
      localStorage.removeItem("adhub_current_org");
      router.push('/login');
      return;
    }
    await signOut(auth);
    localStorage.removeItem("adhub_token");
    localStorage.removeItem("adhub_current_org");
    router.push('/login');
  }, [auth, router]);

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
    resetTimer(); // Initialize timer on mount
    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [signOutUser]); // Added signOutUser to dependency array

  useEffect(() => {
    if (!auth) {
      setLoading(false); // If auth is not available, stop loading
      setUser(null);
      console.error("Firebase auth is not initialized. Cannot set auth state listener.");
      return () => {}; // Return an empty unsubscribe function
    }
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
        // Ensure token is valid before trying to parse
        if (token && token.split('.').length === 3) {
            const { exp } = JSON.parse(atob(token.split('.')[1]));
            const now = Math.floor(Date.now() / 1000);
            if (exp < now) {
              toast({ title: "Session expired", description: "Your session has expired. Please log in again.", variant: "destructive" });
              signOutUser();
            }
        } else {
            // Handle invalid token structure - possibly sign out
            toast({ title: "Invalid session", description: "Your session token is invalid. Please log in again.", variant: "destructive" });
            signOutUser();
        }
      } catch (error) { // Explicitly catch error
        console.error("Error checking token:", error); // Log the error
        toast({ title: "Session error", description: "Authentication error. Please log in again.", variant: "destructive" });
        signOutUser();
      }
    };
    checkToken();
    const interval = setInterval(checkToken, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, signOutUser]); // Added signOutUser to dependency array

  const signUp = async (email: string, password: string): Promise<User> => {
    if (!auth) throw new Error("Firebase auth is not initialized.");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (!userCredential.user) {
        throw new Error("User creation failed, no user returned from Firebase.");
    }
    return userCredential.user;
  };

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase auth is not initialized.");
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const res = await fetch(`/api/v1/users/${userCredential.user.uid}`);
    if (!res.ok) {
      await signOut(auth);
      throw new Error("Account not found or backend issue. Please register or contact support.");
    }
  };

  const resetPassword = async (email: string) => {
    if (!auth) throw new Error("Firebase auth is not initialized.");
    await sendPasswordResetEmail(auth, email);
  };

  const signInWithGoogle = async () => {
    if (!auth) throw new Error("Firebase auth is not initialized.");
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut: signOutUser, // Use the memoized version
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