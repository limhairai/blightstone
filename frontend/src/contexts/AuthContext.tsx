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
import { authMessages } from '../lib/toast-messages'
import { clearStaleOrganizationData } from '../lib/localStorage-cleanup'
import { Loader } from "../components/core/Loader";

interface UserProfile {
  profile_id: string;
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
  const { setOrganization, clearOrganization, currentOrganizationId } = useOrganizationStore();
  const orgInitialized = useRef(false);

  // ALL HOOKS AND FUNCTIONS MUST BE AT THE TOP - NEVER CONDITIONALLY
  
  // Fetch user profile function
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('profile_id', userId)
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
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options
      });
      
      if (error) {
        console.error("🔐 AuthContext signUp error:", error);
        
        // Ensure we have a valid error message
        const errorMessage = error.message || error.toString() || 'Unknown error occurred';
        
        // Handle specific Supabase error messages with better UX
        if (errorMessage.includes('User already registered')) {
          // Don't show toast here - let the register component handle it
          // This prevents duplicate toasts
        } else if (errorMessage.includes('Password should be at least')) {
          if (typeof window !== 'undefined') {
            setTimeout(() => {
              toast.error(authMessages.signUp.weakPassword.description);
            }, 100);
          }
        } else if (errorMessage.includes('Invalid email')) {
          if (typeof window !== 'undefined') {
            setTimeout(() => {
              toast.error(authMessages.signUp.invalidEmail.description);
            }, 100);
          }
        } else if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('502')) {
          // Handle network/connection errors
          if (typeof window !== 'undefined') {
            setTimeout(() => {
              toast.error('Connection error. Please check your internet connection and try again.');
            }, 100);
          }
        } else {
          if (typeof window !== 'undefined') {
            setTimeout(() => {
              toast.error(errorMessage || authMessages.signUp.unknown.description);
            }, 100);
          }
        }
        
        setLoading(false);
        return { data: null, error };
      }

      if (data.user && !data.session) {
        // Email confirmation required
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            toast.success(authMessages.signUp.success.description, {
              duration: authMessages.signUp.success.duration
            });
          }, 100);
        }
        setLoading(false);
        return { data: { user: data.user, session: data.session }, error: null };
      }
      
      // User is immediately logged in
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          toast.success("Registration successful! Redirecting to dashboard...");
        }, 100);
      }
      setLoading(false);
      return { data: { user: data.user, session: data.session }, error: null };
    } catch (err: any) {
      console.error('🔐 AuthContext signUp exception:', err);
      const errorMessage = err?.message || err?.toString() || "An unexpected error occurred during registration.";
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          toast.error(errorMessage);
        }, 100);
      }
      setLoading(false);
      return { data: null, error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("🔐 AuthContext signIn error:", error);
        
        // Ensure we have a valid error message
        const errorMessage = error.message || error.toString() || 'Unknown error occurred';
        
        // Handle specific Supabase error messages with better UX
        if (errorMessage === 'Invalid login credentials') {
          // Ensure we're on client side for toast with small delay for hydration
          if (typeof window !== 'undefined') {
            setTimeout(() => {
              toast.error(authMessages.signIn.invalidCredentials.description);
            }, 100);
          }
        } else if (errorMessage === 'Email not confirmed') {
          if (typeof window !== 'undefined') {
            setTimeout(() => {
              toast.error(authMessages.signIn.emailNotConfirmed.description);
              // Redirect to email confirmation page with the email
              window.location.href = `/confirm-email?email=${encodeURIComponent(email)}`;
            }, 100);
          }
        } else if (errorMessage.includes('Too many requests')) {
          if (typeof window !== 'undefined') {
            setTimeout(() => {
              toast.error(authMessages.signIn.tooManyRequests.description);
            }, 100);
          }
        } else if (errorMessage.includes('User not found')) {
          if (typeof window !== 'undefined') {
            setTimeout(() => {
              toast.error(authMessages.signIn.userNotFound.description);
            }, 100);
          }
        } else if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('502')) {
          // Handle network/connection errors
          if (typeof window !== 'undefined') {
            setTimeout(() => {
              toast.error('Connection error. Please check your internet connection and try again.');
            }, 100);
          }
        } else {
          if (typeof window !== 'undefined') {
            setTimeout(() => {
              toast.error(errorMessage || authMessages.signIn.unknown.description);
            }, 100);
          }
        }
        
        setLoading(false);
        return { data: null, error };
      }

      // Set the user and session state upon successful sign-in
      setUser(data.user);
      setSession(data.session);
      
      // Show success toast
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          toast.success(authMessages.signIn.success.description);
        }, 100);
      }

      setLoading(false);
      return { data: { user: data.user, session: data.session }, error: null };
    } catch (err: any) {
      console.error("🔐 AuthContext signIn exception:", err);
      const errorMessage = err?.message || err?.toString() || "An unexpected error occurred during sign in.";
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          toast.error(errorMessage);
        }, 100);
      }
      setLoading(false);
      return { data: null, error: err };
    }
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

  // Organization initialization effect - runs when profile changes
  useEffect(() => {
    const initializeOrganization = async () => {
      // Skip if already initialized or no session
      if (orgInitialized.current || !session?.access_token) {
        return;
      }

      // Only initialize organizations when on protected routes that need them
      // Skip on public routes like landing page, login, register, etc.
      const currentPath = window.location.pathname;
      const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/auth/callback', '/confirm-email'];
      const isPublicRoute = publicRoutes.includes(currentPath) || currentPath.startsWith('/auth/');
      
      if (isPublicRoute) {
        return;
      }

      // Always fetch user's organizations to ensure we have access
      try {
        const response = await fetch('/api/organizations', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const organizations = data.organizations || [];
          
          if (organizations.length > 0) {
            // If we already have a current org ID and it's in the list, keep it
            if (currentOrganizationId && organizations.find((o: any) => o.id === currentOrganizationId)) {
              orgInitialized.current = true;
              return;
            }
            
            // If the profile organization is in the list, use it
            // Note: profile.organization_id matches the database organization_id field
            // but API returns organizations with id field (mapped from organization_id)
            if (profile?.organization_id && organizations.find((o: any) => o.id === profile.organization_id)) {
              const profileOrg = organizations.find((o: any) => o.id === profile.organization_id);
              setOrganization(profileOrg!.id, profileOrg!.name);
              orgInitialized.current = true;
              return;
            }
            
            // Otherwise, use the first available organization
            const firstOrg = organizations[0];
            setOrganization(firstOrg.id, firstOrg.name);
            orgInitialized.current = true;
          } else {
            
            // Check for database inconsistency: profile has org_id but user has no accessible orgs
            if (profile?.organization_id) {
              console.error('🚨 Database inconsistency detected:');
              console.error('   - Profile organization_id:', profile.organization_id);
              console.error('   - Accessible organizations: 0');
              console.error('   - This suggests missing organization_members entry');
              console.error('   - Attempting automatic repair...');
              
                             // Attempt automatic repair by adding the user to their organization
               try {
                 
                 const fixResponse = await fetch('/api/debug/fix-membership', {
                   method: 'POST',
                   headers: { 
                     'Authorization': `Bearer ${session.access_token}`,
                     'Content-Type': 'application/json'
                   }
                 });
                 
                 if (fixResponse.ok) {
                   const fixResult = await fixResponse.json();
                   
                   if (fixResult.details.fixed_memberships > 0) {
                     toast.success(
                       `Fixed ${fixResult.details.fixed_memberships} organization memberships. Refreshing...`,
                       { duration: 3000 }
                     );
                     
                     // Clear organization data and reload after a short delay
                     setTimeout(() => {
                       localStorage.removeItem('organization-store');
                       window.location.reload();
                     }, 2000);
                   } else {
                     toast.error(
                       'Unable to automatically fix account. Please contact support.',
                       { duration: 10000 }
                     );
                   }
                 } else {
                   console.error('🔧 Fix endpoint failed:', fixResponse.status);
                   toast.error(
                     'Account setup incomplete. Please contact support or try logging out and back in.',
                     { duration: 8000 }
                   );
                 }
               } catch (repairError) {
                 console.error('🔧 Failed to automatically repair organization membership:', repairError);
                 
                 // Show user-friendly toast about the issue
                 toast.error(
                   'Account setup incomplete. Please contact support or try logging out and back in.',
                   { duration: 8000 }
                 );
               }
            }
            
            // Clear any stale organization data when user has no access to any orgs
            if (currentOrganizationId) {
              clearOrganization();
              // Force clear localStorage directly as well
              localStorage.removeItem('currentOrganizationId');
              localStorage.removeItem('currentOrganizationName');
            }
            orgInitialized.current = true;
          }
        } else {
          console.error('🏢 Failed to fetch organizations:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('🏢 Error fetching organizations for initialization:', error);
      }
    };

    initializeOrganization();
  }, [profile, currentOrganizationId, setOrganization, session]);

  useEffect(() => {
    // Don't run auth logic until hydrated
    if (!isHydrated) return;

    // Set a reasonable timeout for loading
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
    }, 2000);

    // Get initial session with better error handling
    supabase.auth.getSession().then(async ({ data: { session: initialSession }, error }) => {
      clearTimeout(loadingTimeout);
      
      if (error) {
        // Silently handle common auth errors
        if (!error.message.includes('broken pipe') && !error.message.includes('refresh token')) {
          console.error('Error getting session:', error);
        }
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
          // Silently handle profile fetch errors
          if (error instanceof Error && !error.message.includes('broken pipe')) {
            console.error('Error fetching user profile:', error);
          }
          // Don't fail the whole auth process if profile fetch fails
        }
      }
      
      setLoading(false);
    }).catch(error => {
      clearTimeout(loadingTimeout);
      // Silently handle common connection errors
      if (!error.message.includes('broken pipe') && !error.message.includes('refresh token')) {
        console.error('Failed to get initial session:', error);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user && event === 'SIGNED_IN') {
        // Try to get user profile on sign in with retry logic
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
          // Silently handle auth errors - they're often temporary connection issues
          if (error instanceof Error && !error.message.includes('broken pipe')) {
            console.error('Error fetching user profile on sign in:', error);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        orgInitialized.current = false; // Reset organization initialization flag
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
  const context = useContext(AuthContext);
  
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

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 