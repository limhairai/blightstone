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
  const { signIn, signInWithGoogle, user, session, loading: authIsLoading } = useAuth();
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="px-6 py-4 md:px-8">
        <Link href={user ? "/dashboard" : "/"}>
          <AdHubLogo size="lg" />
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Welcome to{" "}
              <span>
                <span className="text-white">Ad</span>
                <span className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] bg-clip-text text-transparent">Hub</span>
              </span>
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">Sign in to your account to access your dashboard</p>
          </div>

          <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="Email address"
                  className="h-12 rounded-md px-5 text-sm"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={authIsLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  className="h-12 rounded-md px-5 text-sm"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={authIsLoading}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox" className="checkbox" disabled={authIsLoading} />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-muted-foreground">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/forgot-password" className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                  Forgot your password?
                </Link>
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <div>
              <Button
                className="w-full h-12 rounded-md bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black"
                type="submit"
                disabled={authIsLoading}
              >
                {authIsLoading ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </form>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-muted-foreground/20" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-4 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div>
            <Button
              className="w-full h-12 rounded-md border border-border bg-background hover:bg-muted text-foreground"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={authIsLoading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
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

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 