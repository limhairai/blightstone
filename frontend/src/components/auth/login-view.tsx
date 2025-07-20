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
import { ArrowLeft } from "lucide-react"

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
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 via-black to-gray-900/30" />
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-gray-800/20 via-transparent to-transparent rounded-full blur-3xl" />
      
      {/* Home button - now clickable */}
      <div className="absolute top-6 left-6 z-50">
        <Link 
          href="https://adhub.tech"
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>
      </div>
      
      {/* Main content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md space-y-8">
          
          {/* Logo */}
          <div className="flex justify-center">
            <AdHubLogo size="sm" />
          </div>

          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
            <p className="text-gray-400">
              Don't have an account?{" "}
              <Link href="/register" className="text-white underline hover:no-underline">
                Sign up
              </Link>
              .
            </p>
          </div>

          {/* Social login buttons - changed to grey */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={authIsLoading}
              className="h-11 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white rounded-md font-normal"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
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
              Continue with Google
            </Button>

            <Button
              type="button"
              onClick={handleMagicLinkSignIn}
              disabled={authIsLoading}
              className="h-11 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white rounded-md font-normal"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              Continue with Magic Link
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-black px-4 text-gray-400">or</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm text-gray-300 mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={authIsLoading}
                className="h-11 bg-gray-900 border-gray-700 text-white placeholder-gray-500 rounded-md focus:border-gray-500 focus:ring-0"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm text-gray-300">
                  Password
                </label>
                <Link href="/forgot-password" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Forgot Password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={authIsLoading}
                className="h-11 bg-gray-900 border-gray-700 text-white placeholder-gray-500 rounded-md focus:border-gray-500 focus:ring-0"
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm">{error}</div>
            )}

            <Button
              type="submit"
              disabled={authIsLoading}
              className="w-full h-11 bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black rounded-md font-medium"
            >
              {authIsLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Terms */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              By continuing, you agree to AdHub's{" "}
              <Link href="/terms" className="text-gray-400 underline hover:no-underline">
                Terms of Service
              </Link>
              {" "}and{" "}
              <Link href="/privacy" className="text-gray-400 underline hover:no-underline">
                Privacy Policy
              </Link>
              , and to receive periodic emails with updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 