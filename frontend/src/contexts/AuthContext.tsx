"use client"

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
// Firebase imports to be removed/replaced
// import {
//   User as FirebaseUser, // Renaming to avoid conflict if Supabase User is also named User
//   createUserWithEmailAndPassword,
//   signInWithEmailAndPassword,
//   signOut as firebaseSignOut, // Renaming to avoid conflict
//   onAuthStateChanged as firebaseOnAuthStateChanged, // Renaming
//   sendPasswordResetEmail,
//   updateProfile,
//   GoogleAuthProvider,
//   signInWithPopup
// } from 'firebase/auth';
// import { useFirebase } from './FirebaseContext'; // To be removed

// Supabase imports
import { User as SupabaseUser, Session, AuthError, AuthChangeEvent, AuthSession } from '@supabase/supabase-js';
import { supabase } from '../lib/stores/supabase-client';
import { config, shouldUseAppData, isDemoMode } from '../lib/data/config';

import { useRouter } from 'next/navigation';
import { toast } from "../components/ui/use-toast"
import { Loader } from "../components/core/Loader";

interface AuthContextType {
  user: SupabaseUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, options?: { data?: Record<string, any> }) => Promise<{ data: { user: SupabaseUser | null; session: Session | null; } | null; error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ data: { user: SupabaseUser | null; session: Session | null; } | null; error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string, options?: { redirectTo?: string }) => Promise<{ data: {} | null; error: AuthError | null }>;
  signInWithGoogle: (options?: { redirectTo?: string }) => Promise<{ data: { provider?: string; url?: string; } | null; error: AuthError | null }>;
  resendVerification: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  // ALL HOOKS AND FUNCTIONS MUST BE AT THE TOP - NEVER CONDITIONALLY
  
  // Sign out function
  const signOut = useCallback(async () => {
    // In demo mode, just clear local state
    if (isDemoMode() || shouldUseAppData()) {
      setUser(null);
      setSession(null);
      
      return { error: null };
    }

    // Production sign out
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
      toast({ title: "Sign Out Error", description: error.message, variant: "destructive" });
    }
    setUser(null);
    setSession(null);
    localStorage.removeItem("adhub_current_org");
    
    return { error };
  }, [router]);

  // Auth functions - moved to top
  const signUp = useCallback(async (email: string, password: string, options?: { data?: Record<string, any> }) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        ...(options ? { data: options.data } : {}),
      },
    });

    if (error) {
      console.error("Error signing up:", error);
      toast({ title: "Sign Up Error", description: error.message, variant: "destructive" });
      setLoading(false);
      return { data: null, error };
    }

    if (data.user && !data.session) {
      setLoading(false);
      return { data: { user: data.user, session: data.session }, error: null };
    }
    
    setLoading(false);
    return { data: { user: data.user, session: data.session }, error: null };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("❌ Error signing in:", error, {
        message: error.message,
        status: error.status,
        environment: process.env.NODE_ENV
      });
      setLoading(false);
      return { data: null, error };
    }

    setLoading(false);
    return { data: { user: data.user, session: data.session }, error: null };
  }, []);

  const resetPassword = useCallback(async (email: string, options?: { redirectTo?: string }) => {
    setLoading(true);
    const defaultRedirectTo = typeof window !== 'undefined' 
      ? `${window.location.origin}/auth/update-password`
      : 'https://adhub.tech/auth/update-password'; 

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: options?.redirectTo || defaultRedirectTo,
    });

    setLoading(false);

    if (error) {
      console.error("Error sending password reset email:", error);
      toast({ title: "Password Reset Error", description: error.message, variant: "destructive" });
      return { data: null, error };
    }

    toast({ 
        title: "Password Reset Email Sent", 
        description: "If an account exists for this email, a password reset link has been sent. Please check your inbox.", 
        variant: "default",
        duration: 10000,
    });
    return { data: data || {}, error: null }; 
  }, []);

  const signInWithGoogle = useCallback(async (options?: { redirectTo?: string }) => {
    setLoading(true);
    const defaultRedirectTo = typeof window !== 'undefined' 
      ? `${window.location.origin}/`
      : 'https://adhub.tech/'; 

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: options?.redirectTo || defaultRedirectTo,
      },
    });

    if (error) {
      console.error("Error initiating Google sign-in:", error);
      toast({ title: "Google Sign-In Error", description: error.message, variant: "destructive" });
      setLoading(false);
      return { data: null, error };
    }

    return { data, error: null }; 
  }, []);

  const resendVerification = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    if (error) {
      console.error("Error resending verification email:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return { error };
    }

    toast({ 
      title: "Verification Email Sent", 
      description: "Please check your email for the verification link.", 
      variant: "default",
      duration: 5000,
    });
    return { error: null };
  }, []);

  // Hydration effect - runs only on client
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // Don't run auth logic until hydrated
    if (!isHydrated) return;

    // In demo mode, provide mock user and session
    if (isDemoMode() || shouldUseAppData()) {
      const mockUser: SupabaseUser = {
        id: 'demo-user-123',
        email: 'admin@adhub.tech',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        app_metadata: { provider: 'demo' },
        user_metadata: { 
          name: 'Demo Admin',
          is_superuser: true 
        },
        aud: 'authenticated',
        role: 'authenticated'
      } as SupabaseUser;

      const mockSession: Session = {
        access_token: 'demo-access-token-123',
        refresh_token: 'demo-refresh-token-123',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: mockUser
      };

      setUser(mockUser);
      setSession(mockSession);
      setLoading(false);
      return;
    }

    // Production authentication logic
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
    }).catch(error => {
      console.error("Error fetching initial session:", error);
    });

    const { data: authSubscriptionData } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, currentSession: AuthSession | null) => {
        if (event === 'SIGNED_IN' && currentSession?.user) {
          if (currentSession.user.email_confirmed_at) {
            toast({
              title: "Welcome back!",
              description: "You have successfully signed in.",
              variant: "default",
            });
          }
        }

        if (event === 'TOKEN_REFRESHED' && currentSession?.user?.email_confirmed_at) {
          toast({
            title: "Email Confirmed!",
            description: "Your email has been successfully verified.",
            variant: "default",
          });
        }

        setSession(currentSession);
        setUser(currentSession?.user || null);
        setLoading(false);
      }
    );

    return () => {
      authSubscriptionData?.subscription?.unsubscribe();
    };
  }, [isHydrated]);

  // Inactivity timer (30 minutes)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      if (session) { 
        timer = setTimeout(() => {
          toast({ title: "Logged out due to inactivity", description: "You have been logged out after 30 minutes of inactivity.", variant: "default" });
          signOut();
        }, 30 * 60 * 1000);
      }
    };
    const events = ["mousemove", "keydown", "mousedown", "touchstart"];
    if (session) {
        events.forEach((event) => window.addEventListener(event, resetTimer));
        resetTimer();
    }
    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [session, signOut]);

  // Show loading during SSR and initial hydration
  if (!isHydrated) {
    return <Loader fullScreen />;
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    signInWithGoogle,
    resendVerification,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  // Handle build-time rendering gracefully
  if (typeof window === 'undefined') {
    // During build/SSR, return safe defaults
    return {
      user: null,
      session: null,
      loading: false,
      signIn: async () => ({ data: null, error: null }),
      signUp: async () => ({ data: null, error: null }),
      signOut: async () => ({ error: null }),
      resetPassword: async () => ({ data: null, error: null }),
      signInWithGoogle: async () => ({ data: null, error: null }),
      resendVerification: async () => ({ error: null }),
    };
  }

  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 