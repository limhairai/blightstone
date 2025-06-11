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
import { toast } from "../ui/use-toast"

export function RegisterView() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const router = useRouter();
  const { signUp } = useAuth();

  // Validation helpers
  function validateEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  function validatePassword(password: string) {
    // At least 8 chars, 1 letter, 1 number
    return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=]{8,}$/.test(password);
  }
  function validateName(name: string) {
    return name.length >= 2 && name.length <= 50 && /^[A-Za-z0-9 _.'-]+$/.test(name);
  }

  // Validate on change
  function validateAll() {
    setNameError(!validateName(name) ? "Name must be 2-50 characters and only letters, numbers, spaces, and _.'-" : "");
    setEmailError(!validateEmail(email) ? "Please enter a valid email address." : "");
    setPasswordError(!validatePassword(password) ? "Password must be at least 8 characters and include a letter and a number." : "");
    setConfirmPasswordError(password !== confirmPassword ? "Passwords do not match." : "");
  }
  // Validate on every change
  useEffect(() => { 
    validateAll(); 
  }, [name, email, password, confirmPassword, terms]);

  const isFormValid =
    validateName(name) &&
    validateEmail(email) &&
    validatePassword(password) &&
    password === confirmPassword &&
    terms;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    validateAll();
    if (!isFormValid) {
      setError("Please fix the errors above.");
      return;
    }
    setLoading(true);

    try {
      const signUpResponse = await signUp(email, password, { data: { fullName: name } });

      if (signUpResponse.error) {
        const errorMessage = signUpResponse.error.message.toLowerCase();
        if (errorMessage.includes("user already registered") || 
            errorMessage.includes("email address is already in use") ||
            errorMessage.includes("email link is invalid or has expired")) { // Common variations
          // User already exists - redirect to login instead of showing error
          toast({ 
            title: "Account Exists", 
            description: "An account with this email already exists. Redirecting to login...", 
            variant: "default",
            duration: 3000
          });
          // Show immediate feedback
          setError("Account already exists. Redirecting to login...");
          setTimeout(() => {
            router.push('/login?email=' + encodeURIComponent(email));
          }, 2000);
          return;
        } else {
          setError(signUpResponse.error.message); // Default Supabase error
          toast({ title: "Registration Failed", description: signUpResponse.error.message, variant: "destructive" });
        }
        return; // Stop execution if there was a sign-up error
      }

      if (!signUpResponse.data?.user?.id) {
        console.error("Register handleSubmit: Failed to get user ID after Supabase registration.", signUpResponse.data);
        setError("Registration succeeded but failed to retrieve user details. Please try logging in.");
        toast({ title: "Registration Incomplete", description: "Failed to retrieve user details. Please try logging in.", variant: "destructive" });
        return;
      }

      toast({
        title: "Registration successful!",
        description: "Please check your email to verify your account before logging in.",
      });

      router.push('/dashboard'); // Redirect to dashboard

    } catch (error: any) { // This catch block is now for truly unexpected errors not from supabase.auth.signUp directly
      console.error("Register handleSubmit: Unexpected error caught:", error);
      let errorMessage = "An unexpected error occurred during registration.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      setError(errorMessage);
      toast({ title: "Registration Error", description: errorMessage, variant: "destructive" });
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="px-6 py-4 md:px-8">
        <AdHubLogo size="lg" />
      </div>
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight">
              Join{" "}
              <span>
                <span className="text-white">Ad</span>
                <span className="fey-gradient">Hub</span>
              </span>
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">Create an account to access ad accounts on demand</p>
          </div>

          <div className="mt-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    id="name"
                    type="text"
                    placeholder="Full name"
                    className="h-12 bg-secondary/50 border-0 rounded-md px-5 text-sm"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                  {nameError && <div className="text-red-500 text-xs mt-1">{nameError}</div>}
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email address"
                    className="h-12 bg-secondary/50 border-0 rounded-md px-5 text-sm"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                  {emailError && <div className="text-red-500 text-xs mt-1">{emailError}</div>}
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="Password"
                    className="h-12 bg-secondary/50 border-0 rounded-md px-5 text-sm"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  {passwordError && <div className="text-red-500 text-xs mt-1">{passwordError}</div>}
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm password"
                    className="h-12 bg-secondary/50 border-0 rounded-md px-5 text-sm"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                  {confirmPasswordError && <div className="text-red-500 text-xs mt-1">{confirmPasswordError}</div>}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  checked={terms}
                  onChange={e => setTerms(e.target.checked)}
                  required
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-muted-foreground">
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {error && (
                <div className="text-red-500 text-sm text-center">{error}</div>
              )}

              <div>
                <Button
                  className="w-full h-12 rounded-md bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black"
                  type="submit"
                  disabled={!isFormValid || loading}
                >
                  {loading ? "Creating account..." : "Create account"}
                </Button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="fey-gradient">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 