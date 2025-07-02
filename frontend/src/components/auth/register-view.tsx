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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    console.log('📝 Form submitted with data:', { name, email, password: '***', confirmPassword: '***', terms });

    const validation = validateRegistrationForm({ name, email, password, confirmPassword, terms });

    if (!validation.isValid) {
      console.log('📝 Form validation failed:', validation.errors);
      showValidationErrors(validation.errors);
      return;
    }

    console.log('📝 Form validation passed, starting registration...');
    setLoading(true);
    
    console.log('📝 Attempting registration with email:', email);

    try {
      const { data, error } = await signUp(email, password, {
        data: { full_name: name },
      });
      
      console.log('📝 Registration result:', { data, error });

      if (error) {
        console.error('📝 Registration error:', error);
        // Error toast is handled by AuthContext, but set local error too
        setError(error.message);
        return;
      }

      if (data?.user && !data.session) {
        // This means email confirmation is required.
        console.log('📝 Email confirmation required, redirecting to confirm-email page');
        // Add a small delay to ensure toast is shown before redirect
        setTimeout(() => {
          router.push(`/confirm-email?email=${encodeURIComponent(email)}`);
        }, 1000);
      } else if (data?.user && data.session) {
        // User is immediately logged in.
        console.log('📝 User immediately logged in, redirecting to dashboard');
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      } else {
        // Handle unexpected cases
        console.log('📝 Unexpected registration state:', { user: data?.user, session: data?.session });
        setError("Registration failed. Please try again.");
        toast.error("Registration failed. Please try again.");
      }
    } catch (err: any) {
      console.error('📝 Registration exception:', err);
      const errorMessage = err?.message || "An unexpected error occurred during registration.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      // Always reset loading state
      setLoading(false);
    }
  };

  if (loading) {
    console.log('📝 Showing loading state...');
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
    <div className="min-h-screen flex flex-col bg-background">
      <div className="px-6 py-4 md:px-8">
        <Link href="/">
          <AdHubLogo size="lg" />
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Create your account
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              And get access to ad accounts on demand.
            </p>
          </div>

          <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Input
                id="name"
                type="text"
                placeholder="Full name"
                className="h-12 rounded-md px-5 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                id="email"
                type="email"
                placeholder="Email address"
                className="h-12 rounded-md px-5 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <Input
                id="password"
                type="password"
                placeholder="Password"
                className="h-12 rounded-md px-5 text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm password"
                className="h-12 rounded-md px-5 text-sm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="flex items-start pt-2">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  className="focus:ring-primary h-4 w-4 text-primary border-gray-300 rounded"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="text-muted-foreground">
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="font-medium text-primary hover:underline"
                  >
                    Terms of Service
                  </Link>
                </label>
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center py-2">{error}</div>
            )}



            <div>
              <Button
                className="w-full h-12 rounded-md bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black"
                type="submit"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create Account"}
              </Button>
              
              {/* Debug info */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-muted-foreground text-center mt-2">
                  Loading: {loading.toString()} | Error: {error || 'none'}
                </div>
              )}
            </div>
          </form>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-primary hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 