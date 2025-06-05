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
import { supabase } from '@/lib/supabaseClient'; // Adjusted path assuming lib is at src/lib

import { useRouter } from 'next/navigation';
import { toast } from "@/components/ui/use-toast"
import { Loader } from "@/components/core/Loader";

interface AuthContextType {
  user: SupabaseUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, options?: { data?: Record<string, any> }) => Promise<{ data: { user: SupabaseUser | null; session: Session | null; } | null; error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ data: { user: SupabaseUser | null; session: Session | null; } | null; error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string, options?: { redirectTo?: string }) => Promise<{ data: {} | null; error: AuthError | null }>;
  signInWithGoogle: (options?: { redirectTo?: string }) => Promise<{ data: { provider?: string; url?: string; } | null; error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Main effect for listening to auth changes
  useEffect(() => {
    // Immediately try to get the current session and user when the app loads
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: authSubscriptionData } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: AuthSession | null) => {
        console.log("Supabase auth event:", event, session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle specific events if needed
        if (event === 'PASSWORD_RECOVERY') {
          // User has followed password recovery link, might want to redirect them or show a message
          // Often handled by redirecting to a page that allows password update
        }
        if (event === 'USER_UPDATED') {
          // User metadata might have changed
          setUser(session?.user ?? null); 
        }
      }
    );

    return () => {
      authSubscriptionData?.subscription?.unsubscribe();
    };
  }, []);

  // Sign out function
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
      toast({ title: "Sign Out Error", description: error.message, variant: "destructive" });
    }
    // Clear local states regardless of error from Supabase signOut
    setUser(null);
    setSession(null);
    // Clear any other app-specific local storage related to user/org
    localStorage.removeItem("adhub_current_org"); // Example, if you store this
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
    // you might want to show a message to the user here.
    if (data.user && !data.session) {
        toast({
            title: "Registration successful!",
            description: "Please check your email to confirm your registration.",
            variant: "default", // Or a specific variant for info
            duration: 10000, // Keep message longer
        });
    }

    // The AuthContextType expects a specific return structure.
    // Supabase signUp returns { data: { user, session, ... }, error }
    // Let's align with that for the context consumer.
    return { data: { user: data.user, session: data.session }, error: null };
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Error signing in:", error);
      // Differentiate common errors for better UX
      if (error.message === 'Invalid login credentials') {
        toast({ title: "Sign In Failed", description: "Incorrect email or password. Please try again.", variant: "destructive" });
      } else if (error.message === 'Email not confirmed') {
        toast({ 
            title: "Email Not Confirmed", 
            description: "Please check your email to confirm your account before signing in.", 
            variant: "destructive",
            duration: 10000,
        });
      } else {
        toast({ title: "Sign In Error", description: error.message, variant: "destructive" });
      }
      setLoading(false);
      return { data: null, error };
    }

    // If signIn is successful, data.user and data.session will be populated.
    // onAuthStateChange will automatically pick this up and update the context state.
    // setLoading(false); // onAuthStateChange will handle this.

    // The fetch call to /api/v1/users/${userCredential.user.uid} from the old Firebase
    // version is no longer needed here. The existence of the user in auth.users is confirmed
    // by a successful Supabase login, and the profiles table entry is handled by the trigger.
    // If we need to fetch profile data immediately after login to populate the context further,
    // that could be done here or, more commonly, in a useEffect that reacts to user changes.

    // For now, we rely on onAuthStateChange to update user and session.
    // The component consuming the context might want to redirect to the dashboard here.
    // e.g., router.push('/dashboard') - but that's UI logic, not for the context itself.

    toast({ title: "Signed In", description: "Welcome back!", variant: "default" });

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