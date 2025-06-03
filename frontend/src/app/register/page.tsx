"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/core/Logo"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from '@/contexts/AuthContext'
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"

// Interface for Firebase-like errors that might include a 'code' string property
interface FirebaseError extends Error {
  code?: string;
}

// Type guard to check if an error object has a 'code' string property
function isFirebaseError(error: unknown): error is FirebaseError {
  return typeof error === 'object' && error !== null && 'code' in error && typeof (error as { code?: unknown }).code === 'string';
}

export default function RegisterPage() {
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
  // useEffect(() => { validateAll(); }, [name, email, password, confirmPassword]); // <--- COMMENTED OUT FOR DEBUGGING

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
    console.log("Register handleSubmit: Starting");
    try {
      console.log("Register handleSubmit: Calling signUp...");
      const firebaseUser = await signUp(email, password);
      console.log("Register handleSubmit: signUp successful, user:", firebaseUser);

      if (!firebaseUser || !firebaseUser.uid) {
        throw new Error("Failed to get Firebase UID after registration.");
      }
      const uid = firebaseUser.uid;
      console.log("Register handleSubmit: UID obtained:", uid);

      console.log("Register handleSubmit: Calling backend to create user profile...");
      const backendRes = await fetch("/api/proxy/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          email,
          name,
          createdAt: new Date().toISOString(),
          role: "user",
        }),
      });
      console.log("Register handleSubmit: Backend response status:", backendRes.status);

      if (!backendRes.ok) {
        const errData = await backendRes.json().catch(() => ({ detail: "Failed to parse backend error response" }));
        console.error("Register handleSubmit: Backend error data:", errData);
        throw new Error(errData.detail || "Failed to create user in backend");
      }
      console.log("Register handleSubmit: Backend user profile creation successful.");

      toast({ title: "Account created!", description: "Welcome to AdHub. Redirecting...", variant: "default" });
      router.push("/onboarding");
    } catch (err: unknown) {
      console.error("Register handleSubmit: Error caught:", err);
      let errorMessage = "Registration failed";
      let toastMessage = "Registration failed";
      
      if (isFirebaseError(err) && err.code === "auth/email-already-in-use") {
        errorMessage = "An account with this email already exists. Please log in or use a different email.";
        toastMessage = errorMessage;
        toast({ title: "Email already in use", description: errorMessage, variant: "destructive" });
      } else if (err instanceof Error) { // General Error object
        errorMessage = err.message;
        toastMessage = err.message;
        toast({ title: "Registration failed", description: errorMessage, variant: "destructive" });
      } else if (typeof err === 'string') { // String error
        errorMessage = err;
        toastMessage = err;
        toast({ title: "Registration failed", description: toastMessage, variant: "destructive" });
      } else { // Fallback for other unknown error types
        toast({ title: "Registration failed", description: toastMessage, variant: "destructive" });
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
      console.log("Register handleSubmit: Finished");
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
        <Logo />
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
                <input id="terms" name="terms" type="checkbox" className="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} />
                <Label htmlFor="terms" className="ml-2 block text-sm text-muted-foreground">
                  I agree to the{" "}
                  <Link href="/terms" className="text-white hover:text-white/90">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-white hover:text-white/90">
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              {error && <div className="text-red-500 text-sm text-center">{error}</div>}

              <div>
                <Button type="submit" className="w-full h-12 rounded-md bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black" disabled={loading || !isFormValid}>
                  {loading ? "Creating account..." : "Create account"}
                </Button>
              </div>

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative px-4 text-sm bg-background text-muted-foreground">Or continue with</div>
              </div>

              <div>
                <Button variant="outline" className="w-full h-12 rounded-md border border-border bg-secondary/50">
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
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
                    <path d="M1 1h22v22H1z" fill="none" />
                  </svg>
                  Sign up with Google
                </Button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="fey-gradient font-medium">
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