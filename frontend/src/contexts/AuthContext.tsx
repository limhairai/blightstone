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
import { supabase } from '../lib/supabaseClient'; // Adjusted path assuming lib is at src/lib
import { config, shouldUseMockData, isDemoMode } from '../lib/config';

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

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In demo mode, provide mock user and session
    if (isDemoMode() || shouldUseMockData()) {
      console.log('AuthContext: Demo mode detected, providing mock user session');
      
      const mockUser: SupabaseUser = {
        id: 'demo-admin-user-123',
        email: 'admin@adhub.tech',
        email_confirmed_at: new Date().toISOString(),
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
        console.log("🔐 Supabase auth event:", event, {
          hasSession: !!currentSession,
          hasUser: !!currentSession?.user,
          userId: currentSession?.user?.id,
          environment: process.env.NODE_ENV
        });

        if (event === 'SIGNED_IN' && currentSession?.user && !user) {
          if (currentSession.user.email_confirmed_at) {
            toast({
              title: "Welcome back!",
              description: "You have successfully signed in.",
              variant: "default",
            });
          }
        }

        if (event === 'TOKEN_REFRESHED' && currentSession?.user?.email_confirmed_at && user && !user.email_confirmed_at) {
          toast({
            title: "Email Confirmed!",
            description: "Your email has been successfully verified.",
            variant: "default",
          });
        }

        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      authSubscriptionData?.subscription?.unsubscribe();
    };
  }, []);

  // Sign out function
  const signOut = useCallback(async () => {
    // In demo mode, just clear local state
    if (isDemoMode() || shouldUseMockData()) {
      setUser(null);
      setSession(null);
      router.push('/login');
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
    router.push('/login');
    return { error };
  }, [router]);

  // Inactivity timer (30 minutes) - uses the new signOut
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      // Only set timer if user is logged in
      if (session) { 
        timer = setTimeout(() => {
          toast({ title: "Logged out due to inactivity", description: "You have been logged out after 30 minutes of inactivity.", variant: "default" });
          signOut();
        }, 30 * 60 * 1000); // 30 minutes
      }
    };
    const events = ["mousemove", "keydown", "mousedown", "touchstart"];
    if (session) { // Only add/remove listeners if there's a session
        events.forEach((event) => window.addEventListener(event, resetTimer));
        resetTimer(); // Initialize timer on mount if user is logged in
    }
    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [session, signOut]); // Now depends on session and signOut

  // Placeholder functions for auth operations - to be implemented next
  const signUp = async (email: string, password: string, options?: { data?: Record<string, any> }) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // emailRedirectTo: `${window.location.origin}/auth/callback`, // Optional: if you have a specific redirect after email confirmation
        ...(options ? { data: options.data } : {}), // Pass through user_metadata
      },
    });

    if (error) {
      console.error("Error signing up:", error);
      toast({ title: "Sign Up Error", description: error.message, variant: "destructive" });
      setLoading(false);
      return { data: null, error };
    }

    // User object is in data.user, session in data.session
    // onAuthStateChange will handle setting user and session state if signUp was successful 
    // and if email confirmation is not required or is auto-confirmed.
    // If email confirmation is required, data.session will be null here.
    // The user object (data.user) will contain the new user details.
    // Our handle_new_user trigger in Postgres should create the profile.
    
    // It's generally better to let onAuthStateChange handle the state updates for user/session.
    // setLoading(false); // onAuthStateChange will set loading to false.
    
    // If sign up is successful and an email needs to be confirmed, 
    // the component will handle the redirect to email confirmation page.
    // We don't show a toast here since the component will handle the UX.
    if (data.user && !data.session) {
        console.log("SignUp successful - email confirmation required");
    }

    // The AuthContextType expects a specific return structure.
    // Supabase signUp returns { data: { user, session, ... }, error }
    // Let's align with that for the context consumer.
    return { data: { user: data.user, session: data.session }, error: null };
  };

  const signIn = async (email: string, password: string) => {
    console.log("🚀 Starting sign in attempt:", { email, environment: process.env.NODE_ENV });
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
      

      
      // Return the error to let the login component handle the UI feedback
      return { data: null, error };
    }

    // If signIn is successful, data.user and data.session will be populated.
    // onAuthStateChange will automatically pick this up and update the context state.
    // Set loading to false immediately for better UX
    setLoading(false);

    // For now, we rely on onAuthStateChange to update user and session.
    // The component consuming the context might want to redirect to the dashboard here.

    return { data: { user: data.user, session: data.session }, error: null };
  };

  const resetPassword = async (email: string, options?: { redirectTo?: string }) => {
    setLoading(true);
    // Construct the redirect URL. This should point to a page in your app 
    // where users can enter their new password.
    // Example: `${window.location.origin}/update-password`
    const defaultRedirectTo = `${window.location.origin}/auth/update-password`; 

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: options?.redirectTo || defaultRedirectTo,
    });

    setLoading(false); // Set loading false after the call, regardless of onAuthStateChange for this one

    if (error) {
      console.error("Error sending password reset email:", error);
      toast({ title: "Password Reset Error", description: error.message, variant: "destructive" });
      return { data: null, error }; // Supabase v2 returns {data: {}, error} or {data: null, error}
    }

    toast({ 
        title: "Password Reset Email Sent", 
        description: "If an account exists for this email, a password reset link has been sent. Please check your inbox.", 
        variant: "default",
        duration: 10000,
    });
    // Supabase v2 returns {data (usually {} or specific info), error}
    return { data: data || {}, error: null }; 
  };

  const signInWithGoogle = async (options?: { redirectTo?: string }) => {
    setLoading(true);
    // Default redirect: ensure this is a page that handles the auth callback if needed,
    // or simply your main app page after login.
    const defaultRedirectTo = `${window.location.origin}/`; 

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: options?.redirectTo || defaultRedirectTo,
        // scopes: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile', // Optional: request specific Google scopes
      },
    });

    // setLoading(false); // For OAuth, redirection happens, so user interaction with current page stops.
                        // setLoading will be handled by onAuthStateChange when user returns.

    if (error) {
      console.error("Error initiating Google sign-in:", error);
      toast({ title: "Google Sign-In Error", description: error.message, variant: "destructive" });
      setLoading(false); // Set loading false only if there was an immediate error before redirect
      return { data: null, error };
    }

    // If successful, data.url contains the URL to redirect the user to Google.
    // The browser will navigate away. If data.url is null, something went wrong before redirect.
    // No explicit toast for success here as the user is redirected immediately.
    // Supabase signInWithOAuth returns { data: { provider, url }, error }
    return { data, error: null }; 
  };

  const resendVerification = async (email: string) => {
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
  };
  // End placeholder functions

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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 