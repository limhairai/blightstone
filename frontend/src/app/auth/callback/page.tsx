"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../../lib/stores/supabase-client"
import { Skeleton } from "../../../components/ui/skeleton"
import { toast } from "sonner"

export default function AuthCallbackPage() {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(true)
  const [processingMessage, setProcessingMessage] = useState("Confirming your email...")

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔐 Auth callback started');
        
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
          console.log('🔐 Processing Supabase verification token:', { 
            type: verificationType, 
            hasToken: !!verificationToken,
            source: tokenFromSearch ? 'search' : 'hash',
            searchParams: Object.fromEntries(searchParams.entries()),
            hashParams: Object.fromEntries(hashParams.entries())
          });
          
          // CRITICAL: Check if this is a recovery token BEFORE processing
          if (verificationType === 'recovery') {
            console.log('🔐 RECOVERY TOKEN DETECTED - Redirecting to password reset');
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
              console.log('🔐 Session already established from verification');
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
              
              console.log('🔐 Token verification successful:', data);
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
            console.error('🔐 Token verification exception:', verifyError);
            toast.error("Verification failed");
            router.push('/login');
            return;
          }
        }
        
        console.log('🔐 URL params:', { 
          searchToken: !!tokenFromSearch,
          hashAccessToken: !!tokenFromHash, 
          type: authType,
          isMagicLink,
          fullURL: window.location.href
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
          console.log('🔐 No session found, trying alternative methods...');
          setProcessingMessage("Establishing your session...");
          
          // Try getUser first
          const { data: userData, error: userError } = await supabase.auth.getUser();
          
          if (userData.user && !userError) {
            console.log('🔐 User found via getUser, trying session again...');
            await new Promise(resolve => setTimeout(resolve, 500));
            ({ data, error } = await supabase.auth.getSession());
          }
          
          // If still no session but we have verification tokens, try manual verification
          if (!data.session && verificationToken && verificationType) {
            console.log('🔐 Trying manual token verification...');
            try {
              const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
                token_hash: verificationToken,
                type: verificationType as any,
              });
              
              if (!verifyError && verifyData.session) {
                console.log('🔐 Manual verification successful');
                data = { session: verifyData.session };
                error = null;
              }
            } catch (verifyErr) {
              console.error('🔐 Manual verification failed:', verifyErr);
            }
          }
        }
        
        console.log('🔐 Session result:', { 
          hasSession: !!data.session, 
          error: error?.message,
          userEmail: data.session?.user?.email,
          userCreated: data.session?.user?.created_at,
          emailConfirmed: data.session?.user?.email_confirmed_at
        });
        
        if (error) {
          console.error("Auth callback error:", error)
          toast.error("Authentication failed. Please try again.", {
            description: error.message || "Authentication Error"
          })
          router.push('/login')
          return
        }

        if (data.session) {
          const user = data.session.user
          console.log('🔐 Auth callback - user session found:', {
            user_id: user.id,
            email: user.email,
            email_confirmed_at: user.email_confirmed_at,
            created_at: user.created_at
          });
          
          // Check if this is a new user who just confirmed their email
          const now = new Date()
          const userCreated = new Date(user.created_at)
          const isVeryNewUser = (now.getTime() - userCreated.getTime()) < (10 * 60 * 1000) // Less than 10 minutes old
          
          // Check if user was just confirmed (email_confirmed_at is very recent)
          const justConfirmed = user.email_confirmed_at && 
            (now.getTime() - new Date(user.email_confirmed_at).getTime()) < (5 * 60 * 1000) // Confirmed within 5 minutes
          
          console.log('🔐 User analysis:', { isVeryNewUser, justConfirmed });
          
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
              
              // If user is very new AND just confirmed email, send to onboarding regardless of org
              if ((isVeryNewUser || justConfirmed) && hasOrganization) {
                // New user who just confirmed - go to onboarding even though they have an org
                let message = "🎉 Welcome to AdHub!";
                if (authType === 'signup' || isMagicLink) {
                  message = "🎉 Welcome to AdHub! Let's get you set up.";
                } else if (authType === 'magiclink') {
                  message = "🎉 Magic link sign in successful! Welcome to AdHub!";
                } else {
                  message = "🎉 Email confirmed successfully! Welcome to AdHub!";
                }
                toast.success(message)
                router.push('/onboarding')
              } else if (hasOrganization) {
                // Existing user with organization - go to dashboard
                const message = (authType === 'magiclink' || isMagicLink) ? 
                  "🎉 Magic link sign in successful! Welcome back!" : 
                  "Welcome back!";
                toast.success(message, {
                  description: "Signed in successfully"
                })
                router.push('/dashboard')
              } else {
                // User without organization (edge case) - go to onboarding
                toast.success("Welcome to AdHub! Let's get you set up.", {
                  description: "Account Created"
                })
                router.push('/onboarding')
              }
            } else {
              // Can't check organization, but if user is very new, send to onboarding
              if (isVeryNewUser || justConfirmed) {
                const message = authType === 'signup' ? 
                  "🎉 Email verified successfully! Welcome to AdHub!" : 
                  "🎉 Email confirmed successfully! Welcome to AdHub!";
                toast.success(message, {
                  description: "Let's get you set up"
          })
          router.push('/onboarding')
              } else {
                // Fallback to dashboard for existing users
                toast.success("Welcome back!")
                router.push('/dashboard')
              }
            }
          } catch (orgError) {
            console.error("Error checking organization:", orgError)
            // If we can't check organization but user is new, default to onboarding
            if (isVeryNewUser || justConfirmed) {
              const message = (authType === 'signup' || isMagicLink) ? 
                "🎉 Welcome to AdHub! Let's get you set up." : 
                "🎉 Email confirmed successfully! Welcome to AdHub!";
              toast.success(message)
              router.push('/onboarding')
            } else {
              // Fallback to dashboard for existing users
              toast.success("Welcome back!")
              router.push('/dashboard')
            }
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