"use client"

import Link from "next/link"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { AdHubLogo } from "../core/AdHubLogo"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from '../../contexts/AuthContext'
import { Skeleton } from "../ui/skeleton"
import { toast } from "sonner"
import { validateRegistrationForm, showValidationErrors } from "../../lib/form-validation"
import { ArrowLeft } from "lucide-react"

export function RegisterView() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const { signUp, signInWithGoogle, signInWithMagicLink } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await signUp(email, password);
      
      if (error) {
        console.error('📝 Registration error:', error);
        setError(error.message);
        
        if (error.message.includes('User already registered')) {
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        }
        return;
      }

      if (data?.user && !data.session) {
        const isExistingUser = data.user.email_confirmed_at !== null;
        
        if (isExistingUser) {
          toast.error("An account with this email already exists. Redirecting to login...", {
            duration: 3000
          });
          setTimeout(() => {
            router.push(`/login?email=${encodeURIComponent(email)}`);
          }, 3000);
          return;
        }
        
        toast.success("Registration successful! Please check your email to confirm your account.", {
          duration: 10000
        });
        setTimeout(() => {
          router.push(`/confirm-email?email=${encodeURIComponent(email)}`);
        }, 1000);
      } else if (data?.user && data.session) {
        toast.success("Registration successful! Let's get you set up...");
        setTimeout(() => {
          router.push("/onboarding");
        }, 1000);
      } else {
        setError("Registration failed. Please try again.");
        toast.error("Registration failed. Please try again.");
      }
    } catch (err: any) {
      console.error('📝 Registration exception:', err);
      const errorMessage = err?.message || "An unexpected error occurred during registration.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError("");
    
    try {
      const result = await signInWithGoogle();
      if (result.error) {
        let errorMessage = "Failed to sign up with Google. Please try again.";
        
        if (result.error.message.includes('popup_closed_by_user')) {
          errorMessage = "Google sign-up was cancelled.";
        } else if (result.error.message.includes('access_denied')) {
          errorMessage = "Google sign-up access was denied.";
        } else {
          errorMessage = result.error.message;
        }
        
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }
      
      toast.success("Account created!", {
        description: "Welcome to AdHub."
      });
    } catch (err: any) {
      const errorMessage = err?.message || "An unexpected error occurred during Google sign up.";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleMagicLinkSignUp = async () => {
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
    } catch (err: any) {
      const errorMessage = err?.message || "An unexpected error occurred while sending magic link.";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 via-black to-gray-900/30" />
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-gray-800/20 via-transparent to-transparent rounded-full blur-3xl" />
        
        {/* Main content */}
        <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
          <div className="w-full max-w-md text-center space-y-4">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-400">Creating your account...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 via-black to-gray-900/30" />
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-gray-800/20 via-transparent to-transparent rounded-full blur-3xl" />
      
      {/* Home button */}
      <div className="absolute top-6 left-6 z-10">
        <a 
          href="https://adhub.tech" 
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Home
        </a>
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
            <h1 className="text-2xl font-semibold text-white">Create a AdHub Account</h1>
            <p className="text-gray-400">
              Already have an account?{" "}
              <Link href="/login" className="text-white underline hover:no-underline">
                Log in
              </Link>
              .
            </p>
          </div>

          {/* Social login buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={loading}
              className="h-11 bg-gradient-to-r from-[#b4a0ff]/30 to-[#ffb4a0]/30 hover:from-[#b4a0ff]/40 hover:to-[#ffb4a0]/40 border border-gray-600 text-white rounded-md font-normal"
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
              onClick={handleMagicLinkSignUp}
              disabled={loading}
              className="h-11 bg-gradient-to-r from-[#b4a0ff]/30 to-[#ffb4a0]/30 hover:from-[#b4a0ff]/40 hover:to-[#ffb4a0]/40 border border-gray-600 text-white rounded-md font-normal"
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
                placeholder="alan.turing@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-11 bg-gray-900 border-gray-700 text-white placeholder-gray-500 rounded-md focus:border-gray-500 focus:ring-0"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm text-gray-300 mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="h-11 bg-gray-900 border-gray-700 text-white placeholder-gray-500 rounded-md focus:border-gray-500 focus:ring-0"
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm">{error}</div>
            )}

              <Button
                type="submit"
                disabled={loading}
              className="w-full h-11 bg-white text-black hover:bg-gray-100 rounded-md font-medium"
              >
              {loading ? "Creating Account..." : "Create Account"}
              </Button>
          </form>

          {/* Terms */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              By signing up, you agree to our{" "}
              <Link href="/terms" className="text-gray-400 underline hover:no-underline">
                Terms
              </Link>
              ,{" "}
              <Link href="/privacy" className="text-gray-400 underline hover:no-underline">
                Acceptable Use
              </Link>
              , and{" "}
              <Link href="/privacy" className="text-gray-400 underline hover:no-underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 