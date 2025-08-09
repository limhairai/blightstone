"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../../lib/stores/supabase-client"
import { Skeleton } from "../../../components/ui/skeleton"
import { toast } from "sonner"
import { log } from "../../../lib/logger"

export default function AuthCallbackPage() {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(true)
  const [processingMessage, setProcessingMessage] = useState("Confirming your email...")

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        log.auth('Auth callback started');
        
        // Get URL parameters for magic links and email confirmations
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        const tokenFromSearch = searchParams.get('token');
        const tokenFromHash = hashParams.get('access_token');
        const authType = hashParams.get('type') || searchParams.get('type');
        const isMagicLink = tokenFromHash && !tokenFromSearch; // Magic links come as hash params
        
                // Handle direct Supabase verification URLs that might come here
        // Check for both URL params and hash params for maximum compatibility
        const verificationToken = tokenFromSearch || hashParams.get('token');
        // For verification type, prioritize search params (where recovery tokens come from)
        const verificationType = searchParams.get('type') || hashParams.get('type');
        
        if (verificationToken && verificationType) {
          log.auth('Processing Supabase verification token', { 
            type: verificationType, 
            hasToken: !!verificationToken,
            source: tokenFromSearch ? 'search' : 'hash'
          });
          
          // CRITICAL: Check if this is a recovery token BEFORE processing
          if (verificationType === 'recovery') {
            log.auth('Recovery token detected - redirecting to password reset');
            setProcessingMessage("Verifying password reset link...");
            toast.success("Password reset link verified!", {
              description: "Redirecting to password reset form..."
            });
            router.push('/reset-password');
            return; // EXIT EARLY - don't process further
          }
          
          // Update loading message for other types
          setProcessingMessage("Setting up your account...");
          
          try {
            // Try session exchange first (for magic links)
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionData?.session && !sessionError) {
              log.auth('Session already established from verification');
            } else {
              // Try to exchange the token for a session
              const { data, error } = await supabase.auth.verifyOtp({
                token_hash: verificationToken,
                type: verificationType as any,
              });
              
              if (error) {
                console.error('🔐 Token verification failed:', error);
                if (verificationType === 'recovery') {
                  toast.error("Password reset link has expired", {
                    description: "Please request a new password reset email"
                  });
                  router.push('/forgot-password');
                  return;
                } else {
                  toast.error("Verification link has expired", {
                    description: "Please try again"
                  });
                  router.push('/login');
                  return;
                }
              }
              
                              log.auth('Token verification successful');
            }
            
            // For recovery type, redirect to password reset page
            if (verificationType === 'recovery') {
              toast.success("Password reset link verified!", {
                description: "Please enter your new password"
              });
              router.push('/reset-password');
              return;
            }
            
            // For other types, continue with normal flow below
            
                      } catch (verifyError) {
              log.error('Token verification exception', verifyError);
            toast.error("Verification failed");
            router.push('/login');
            return;
          }
        }
        
        log.auth('Processing URL params', { 
          searchToken: !!tokenFromSearch,
          hashAccessToken: !!tokenFromHash, 
          type: authType,
          isMagicLink
        });

        // Update loading message for better UX
        setProcessingMessage("Verifying your session...");
        
        // Give Supabase time to process URL tokens automatically
        let data, error;
        
        // Wait for Supabase to auto-process tokens
        await new Promise(resolve => setTimeout(resolve, 1000)); // Longer wait for stability
        ({ data, error } = await supabase.auth.getSession());
        
        // If still no session, try multiple approaches
        if (!data.session && !error) {
          log.auth('No session found, trying alternative methods');
          setProcessingMessage("Establishing your session...");
          
          // Try getUser first
          const { data: userData, error: userError } = await supabase.auth.getUser();
          
          if (userData.user && !userError) {
            log.auth('User found via getUser, trying session again');
            await new Promise(resolve => setTimeout(resolve, 500));
            ({ data, error } = await supabase.auth.getSession());
          }
          
          // If still no session but we have verification tokens, try manual verification
          if (!data.session && verificationToken && verificationType) {
            log.auth('Trying manual token verification');
            try {
              const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
                token_hash: verificationToken,
                type: verificationType as any,
              });
              
              if (!verifyError && verifyData.session) {
                log.auth('Manual verification successful');
                data = { session: verifyData.session };
                error = null;
              }
            } catch (verifyErr) {
              log.error('Manual verification failed', verifyErr);
            }
          }
        }
        
        log.auth('Session result', { 
          hasSession: !!data.session, 
          error: error?.message
        });
        
        if (error) {
          log.error("Auth callback error", error)
          toast.error("Authentication failed. Please try again.", {
            description: error.message || "Authentication Error"
          })
          router.push('/login')
          return
        }

        if (data.session) {
          const user = data.session.user
          log.auth('User session found', {
            user_id: user.id,
            provider: user.app_metadata?.provider
          });
          
          // For Google OAuth users, check if they have an organization instead of time-based logic
          // Google OAuth users are confirmed immediately and don't go through email verification
          const isGoogleOAuth = !user.email_confirmed_at || user.app_metadata?.provider === 'google'
          
          log.auth('User analysis', { 
            provider: user.app_metadata?.provider,
            isGoogleOAuth
          });
          
          // Update loading message
          setProcessingMessage("Almost done...");
          
          try {
            const response = await fetch('/api/organizations', {
              headers: {
                'Authorization': `Bearer ${data.session.access_token}`
              }
            })
            
            if (response.ok) {
              const orgData = await response.json()
              const hasOrganization = orgData.organizations && orgData.organizations.length > 0
              
              if (hasOrganization) {
                // Existing user with organization - go to dashboard
                const message = isGoogleOAuth ? 
                  "🎉 Google sign in successful! Welcome back!" : 
                  (authType === 'magiclink' || isMagicLink) ? 
                    "🎉 Magic link sign in successful! Welcome back!" : 
                    "Welcome back!";
                toast.success(message, {
                  description: "Signed in successfully"
                })
                router.push('/dashboard')
              } else {
                // User without organization - go to onboarding (truly new user)
                let message = "🎉 Welcome to Blightstone! Let's get you set up.";
                if (isGoogleOAuth) {
                  message = "🎉 Welcome to Blightstone! Account created successfully.";
                } else if (authType === 'signup' || isMagicLink) {
                  message = "🎉 Welcome to Blightstone! Let's get you set up.";
                } else if (authType === 'magiclink') {
                  message = "🎉 Magic link sign in successful! Welcome to Blightstone!";
                } else {
                  message = "🎉 Email confirmed successfully! Welcome to Blightstone!";
                }
                toast.success(message, {
                  description: "Let's get your account set up"
                })
                router.push('/onboarding')
              }
                      } else {
            // Can't check organization - default to dashboard for safety
            const message = isGoogleOAuth ? 
              "🎉 Google sign in successful!" : 
              "Welcome back!";
            toast.success(message)
            router.push('/dashboard')
          }
          } catch (orgError) {
            console.error("Error checking organization:", orgError)
            // Fallback logic - if we can't check organization, default to dashboard for safety
            // (better to show empty dashboard than force existing user through onboarding)
            const message = isGoogleOAuth ? 
              "🎉 Google sign in successful!" : 
              "Welcome back!";
            toast.success(message)
            router.push('/dashboard')
          }
        } else {
          // No session found - check for error parameters in URL
          const errorParam = searchParams.get('error');
          const errorCode = searchParams.get('error_code');
          const errorDescription = searchParams.get('error_description');
          
          console.log("No session found in auth callback", { 
            error: errorParam, 
            errorCode, 
            errorDescription,
            authType 
          });
          
          // Handle specific error cases
          if (errorCode === 'otp_expired' || errorParam === 'access_denied') {
            if (authType === 'magiclink' || isMagicLink) {
              toast.error("Magic link has expired.", {
                description: "Please request a new magic link to sign in"
              });
              router.push('/magic-link');
            } else if (authType === 'signup') {
              toast.error("Email confirmation link has expired.", {
                description: "Please try registering again to get a new confirmation email"
              });
              router.push('/register');
            } else if (authType === 'recovery') {
              toast.error("Password reset link has expired.", {
                description: "Please request a new password reset link"
              });
              router.push('/forgot-password');
            } else {
              toast.error("Authentication link has expired.", {
                description: "Please try signing in again"
              });
              router.push('/login');
            }
          } else {
            // Generic expired/invalid token handling
            if (authType === 'magiclink' || isMagicLink) {
              toast.error("Magic link has expired or is invalid.", {
                description: "Please request a new magic link"
              })
              router.push('/magic-link')
            } else if (authType === 'signup') {
              toast.error("Email verification link has expired or is invalid.", {
                description: "Please try registering again"
              })
              router.push('/register')
            } else {
              toast.error("Authentication failed. Please try signing in again.", {
                description: "Link may be expired or invalid"
          })
          router.push('/login')
            }
          }
        }
      } catch (error) {
        console.error("Unexpected error in auth callback:", error)
        toast.error("Something went wrong. Please try signing in again.", {
          description: "Authentication Error"
        })
        router.push('/login')
      } finally {
        setIsProcessing(false)
      }
    }

    handleAuthCallback()
  }, [router])

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
          <p className="text-muted-foreground">{processingMessage}</p>
          <div className="text-xs text-muted-foreground/70">
            This should only take a moment...
          </div>
        </div>
      </div>
    )
  }

  return null
} 