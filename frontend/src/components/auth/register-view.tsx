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
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const router = useRouter();
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validation = validateRegistrationForm({ name, email, password, confirmPassword, terms });

    if (!validation.isValid) {
      showValidationErrors(validation.errors);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await signUp(email, password, {
        data: { full_name: name },
      });

      if (error) {
        setError(error.message);
        toast.error(error.message);
        setLoading(false);
        return;
      }

      if (data.user && !data.session) {
        // This means email confirmation is required.
        setRegistrationComplete(true);
      } else if (data.user && data.session) {
        // User is immediately logged in.
        toast.success("Registration successful! Redirecting to dashboard...");
        router.push("/dashboard");
      } else {
        // Handle unexpected cases
        setError("An unexpected error occurred. Please try again.");
        toast.error("An unexpected error occurred. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="w-24 h-24" />
      </div>
    );
  }

  if (registrationComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center px-4">
        <AdHubLogo size="lg" />
        <h1 className="text-4xl font-bold tracking-tight mt-8">
          Registration Successful!
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Please check your email at <span className="font-semibold text-foreground">{email}</span> for a confirmation link to complete your sign up.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          (You can close this tab)
        </p>
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