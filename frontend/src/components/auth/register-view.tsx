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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="w-24 h-24 mx-auto" />
          <p className="text-muted-foreground">Creating your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Logo positioned at top left */}
      <div className="absolute top-6 left-6 z-10">
        <Link href="/">
          <AdHubLogo size="lg" />
        </Link>
      </div>
      
      {/* Left side - Register Form */}
      <div className="flex-1 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-20 xl:px-24 bg-muted/30">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Create your account</h2>
            <p className="text-muted-foreground mb-6">And get access to ad accounts on demand.</p>
          </div>

          {/* Google OAuth button */}
          <div className="mb-4">
            <Button
              className="w-full h-11 rounded-md border border-border bg-background hover:bg-muted text-foreground flex items-center justify-center gap-3"
              type="button"
              onClick={async () => {
                try {
                  await signInWithGoogle({ redirectTo: `${window.location.origin}/onboarding` });
                } catch (err: any) {
                  toast.error(err?.message || "Failed to sign up with Google");
                }
              }}
              disabled={loading}
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
              {loading ? "Signing up..." : "Continue with Google"}
            </Button>
          </div>

          {/* Magic Link button */}
          <div className="mb-4">
            <Button
              className="w-full h-11 rounded-md border border-border bg-background hover:bg-muted text-foreground flex items-center justify-center gap-3"
              type="button"
              onClick={async () => {
                if (!email) {
                  toast.error("Please enter your email address first");
                  return;
                }
                try {
                  await signInWithMagicLink(email, { redirectTo: `${window.location.origin}/onboarding` });
                  toast.success("Magic link sent! Check your email to complete registration.");
                } catch (err: any) {
                  toast.error(err?.message || "Failed to send magic link");
                }
              }}
              disabled={loading || !email}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              {loading ? "Sending..." : "Continue with Magic Link"}
            </Button>
          </div>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-muted-foreground/20" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-4 text-muted-foreground">or</span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="h-10 rounded-md px-3 text-sm bg-background border-border"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-10 rounded-md px-3 text-sm bg-background border-border"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <div className="pt-2">
              <Button
                className="w-full h-10 rounded-md bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black font-medium"
                type="submit"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Sign Up"}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Have an account?{" "}
              <Link
                href="/login"
                className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] bg-clip-text text-transparent hover:opacity-80 transition-opacity font-medium underline"
              >
                Sign In Now
              </Link>
            </p>
          </div>

          <div className="mt-6 text-xs text-muted-foreground text-center">
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
            "AdHub has revolutionized how we manage our Facebook ad campaigns. The seamless integration and instant account access has saved us countless hours of setup time. Our team can now focus on what matters most - creating winning ad strategies."
          </blockquote>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] flex items-center justify-center">
              <span className="text-white font-semibold text-lg">SM</span>
            </div>
            <div>
              <div className="font-medium text-foreground">@SarahMarketing</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 