"use client"

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
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
import { useOrganizationStore } from '@/lib/stores/organization-store';
// Removed demo mode imports - using real Supabase only

import { useRouter } from 'next/navigation';
import { toast } from "sonner"
import { Loader } from "../components/core/Loader";

interface UserProfile {
  id: string;
  organization_id: string | null;
  name: string | null;
  email: string | null;
  role: string;
  is_superuser: boolean;
  avatar_url: string | null;
}

interface AuthContextType {
  user: SupabaseUser | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  supabase: typeof supabase;
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const { setOrganization, currentOrganizationId } = useOrganizationStore();
  const orgInitialized = useRef(false);

  // ALL HOOKS AND FUNCTIONS MUST BE AT THE TOP - NEVER CONDITIONALLY
  
  // Fetch user profile function
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return profile as UserProfile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }, []);
  
  // Sign out function
  const signOut = useCallback(async () => {
    // Real Supabase sign out
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
      toast.error(`Sign out error: ${error.message}`);
    }
    setUser(null);
    setProfile(null);
    setSession(null);
    orgInitialized.current = false; // Reset organization initialization flag
    localStorage.removeItem("adhub_current_org");
    router.push('/login'); // Redirect after signing out
    
    return { error };
  }, [router]);

  // Auth functions - moved to top
  const signUp = async (email: string, password: string, options?: { data?: Record<string, any> }) => {
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
      toast.error(`Sign up error: ${error.message}`);
      setLoading(false);
      return { data: null, error };
    }

    if (data.user && !data.session) {
      setLoading(false);
      return { data: { user: data.user, session: data.session }, error: null };
    }
    
    setLoading(false);
    return { data: { user: data.user, session: data.session }, error: null };
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      return { data: null, error };
    }

    // Set the user and session state upon successful sign-in
    setUser(data.user);
    setSession(data.session);

    setLoading(false);
    return { data: { user: data.user, session: data.session }, error: null };
  };

  const resetPassword = async (email: string, options?: { redirectTo?: string }) => {
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
      toast.error(`Password reset error: ${error.message}`);
      return { data: null, error };
    }

    toast.success("If an account exists for this email, a password reset link has been sent. Please check your inbox.");
    return { data: data || {}, error: null }; 
  };

  const signInWithGoogle = async (options?: { redirectTo?: string }) => {
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
      toast.error(`Google sign-in error: ${error.message}`);
      setLoading(false);
      return { data: null, error };
    }

    return { data, error: null }; 
  };

  const resendVerification = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    if (error) {
      console.error("Error resending verification email:", error);
      toast.error(error.message);
      return { error };
    }

    toast.success("Verification email sent! Please check your email for the verification link.");
    return { error: null };
  };

  // Hydration effect - runs only on client
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // Don't run auth logic until hydrated
    if (!isHydrated) return;

    // Set a reasonable timeout for loading
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
    }, 2000);

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session: initialSession }, error }) => {
      clearTimeout(loadingTimeout);
      
      if (error) {
        console.error('Error getting session:', error);
        setLoading(false);
        return;
      }

      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      
      // If we have a session, try to get user profile
      if (initialSession?.user) {
        try {
          const response = await fetch('/api/auth/user', {
            headers: {
              'Authorization': `Bearer ${initialSession.access_token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setProfile(userData);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Don't fail the whole auth process if profile fetch fails
        }
      }
      
      setLoading(false);
    }).catch(error => {
      clearTimeout(loadingTimeout);
      console.error('Failed to get initial session:', error);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user && event === 'SIGNED_IN') {
        // Try to get user profile on sign in
        try {
          const response = await fetch('/api/auth/user', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setProfile(userData);
          }
        } catch (error) {
          console.error('Error fetching user profile on sign in:', error);
        }
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, [isHydrated, supabase.auth]);

  // Inactivity timer (30 minutes)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      if (session) { 
        timer = setTimeout(() => {
          toast.info("You have been logged out after 30 minutes of inactivity.");
          signOut();
        }, 30 * 60 * 1000);
      }
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    
    resetTimer();

    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
    };
  }, [session, signOut]);

  const value: AuthContextType = {
    user: loading ? null : user,
    profile: loading ? null : profile,
    session: loading ? null : session,
    loading,
    supabase,
    signUp,
    signIn,
    signOut,
    resetPassword,
    signInWithGoogle,
    resendVerification,
  };
  
  // Do not render children until hydration is complete and auth state is determined
  if (!isHydrated) {
      return (
          <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
              <Loader />
          </div>
      )
  }

  // Show loading only for a brief moment, then always show content
  if (loading) {
      return (
          <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
              <Loader />
          </div>
      )
  }

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
      profile: null,
      session: null,
      loading: false,
      supabase,
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