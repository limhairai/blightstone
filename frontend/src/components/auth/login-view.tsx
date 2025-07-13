"use client"

import Link from "next/link"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { AdHubLogo } from "../core/AdHubLogo"
import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Loader } from "../core/Loader"
import { validateLoginForm, showValidationErrors } from "../../lib/form-validation"

export function LoginView() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { signIn, signInWithGoogle, signInWithMagicLink, user, session, loading: authIsLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pre-fill email from URL params (when redirected from registration)
  useEffect(() => {
    const emailParam = searchParams?.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Comprehensive form validation
    const validation = validateLoginForm({ email, password })
    
    if (!validation.isValid) {
      showValidationErrors(validation.errors)
      return
    }
    
    try {
      const result = await signIn(email, password);

      if (result.error) {
        console.error('🔐 Login error:', result.error);
        // Error toast is handled by AuthContext
        return;
      }
      
      // Success toast is now handled by AuthContext
      // Wait a moment for auth state to update, then redirect
      setTimeout(() => {
        router.push('/dashboard');
      }, 100);
    } catch (err: any) {
      console.error('🔐 Login exception:', err);
      const errorMessage = err?.message || "An unexpected error occurred during sign in.";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    
    try {
      const result = await signInWithGoogle();
      if (result.error) {
        let errorMessage = "Failed to sign in with Google. Please try again.";
        
        if (result.error.message.includes('popup_closed_by_user')) {
          errorMessage = "Google sign-in was cancelled.";
        } else if (result.error.message.includes('access_denied')) {
          errorMessage = "Google sign-in access was denied.";
        } else {
          errorMessage = result.error.message;
        }
        
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }
      
      // Success - Google will redirect, so we might not reach this point
      toast.success("Signed in!", {
        description: "Welcome back."
      });
    } catch (err: any) {
      const errorMessage = err?.message || "An unexpected error occurred during Google sign in.";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleMagicLinkSignIn = async () => {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    
    setError("");
    
    try {
      const result = await signInWithMagicLink(email);
      if (result.error) {
        const errorMessage = result.error.message || "Failed to send magic link. Please try again.";
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }
      
      // Success message is handled by the auth context
    } catch (err: any) {
      const errorMessage = err?.message || "An unexpected error occurred while sending magic link.";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Logo positioned at top left */}
      <div className="absolute top-6 left-6 z-10">
        <Link href="/">
          <AdHubLogo size="lg" />
        </Link>
      </div>
      
      {/* Left side - Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-muted/30">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back</h2>
            <p className="text-muted-foreground mb-8">Sign in to your account</p>
          </div>

          {/* GitHub-style button (placeholder for now) */}
          <div className="mb-6">
            <Button
              className="w-full h-12 rounded-md border border-border bg-background hover:bg-muted text-foreground flex items-center justify-center gap-3"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={authIsLoading}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {authIsLoading ? "Signing in..." : "Continue with Google"}
            </Button>
          </div>

          {/* Magic Link Button */}
          <div className="mb-6">
            <Button
              className="w-full h-12 rounded-md border border-border bg-background hover:bg-muted text-foreground flex items-center justify-center gap-3"
              type="button"
              onClick={handleMagicLinkSignIn}
              disabled={authIsLoading}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              Continue with Magic Link
            </Button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-muted-foreground/20" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-4 text-muted-foreground">or</span>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="limhairai@gmail.com"
                className="h-12 rounded-md px-4 text-sm bg-background border-border"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={authIsLoading}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                  Password
                </label>
                <Link href="/forgot-password" className="text-sm bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                  Forgot Password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-12 rounded-md px-4 text-sm bg-background border-border"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={authIsLoading}
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <div>
              <Button
                className="w-full h-12 rounded-md bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black font-medium"
                type="submit"
                disabled={authIsLoading}
              >
                {authIsLoading ? "Signing in..." : "Sign In"}
              </Button>
            </div>
          </form>

                      <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] bg-clip-text text-transparent hover:opacity-80 transition-opacity font-medium underline">
                  Sign Up Now
                </Link>
              </p>
            </div>

          <div className="mt-8 text-xs text-muted-foreground text-center">
            By continuing, you agree to AdHub&apos;s{" "}
            <Link href="/terms" className="underline hover:text-foreground">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
            , and to receive periodic emails with updates.
          </div>
        </div>
      </div>

      {/* Right side - Testimonial/Quote */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-20 xl:px-24 bg-background">
        <div className="mx-auto max-w-xl">
          <blockquote className="text-xl font-medium text-foreground leading-relaxed mb-8">
            "Using AdHub I&apos;m really pleased on the power of Facebook advertising (and social media in general). Despite being a bit dubious about the whole backend as a service thing I have to say I really don&apos;t miss anything. The whole experience feels very robust and secure."
          </blockquote>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] flex items-center justify-center">
              <span className="text-white font-semibold text-lg">PR</span>
            </div>
            <div>
              <div className="font-medium text-foreground">@PaoloRicciuti</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 