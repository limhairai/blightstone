"use client"

import Link from "next/link"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { AdHubLogo } from "../core/AdHubLogo"
import { useState } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"

export function MagicLinkView() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { signInWithMagicLink } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      console.log('🔗 Sending magic link for:', email);
      const result = await signInWithMagicLink(email);
      
      if (result.error) {
        toast.error(result.error.message || "Failed to send magic link. Please try again.");
        setLoading(false);
        return;
      }

      setSent(true);
      setLoading(false);
    } catch (err: any) {
      const errorMessage = err?.message || "An unexpected error occurred while sending magic link.";
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 via-black to-gray-900/30" />
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-gray-800/20 via-transparent to-transparent rounded-full blur-3xl" />
        
        {/* Home button */}
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
            
            {/* Success icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
            </div>

            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-semibold text-white">Check Your Email</h1>
              <p className="text-gray-400">
                We've sent a magic link to{" "}
                <span className="font-medium text-white break-all">{email}</span>
              </p>
            </div>

            {/* Instructions */}
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Click the link in the email to sign in instantly. 
                If you don't see it, check your spam folder.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-6">
              <Button 
                onClick={() => {
                  setSent(false)
                  setEmail("")
                }}
                className="w-full h-11 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white rounded-md font-normal"
              >
                Try Different Email
              </Button>
              
              <Link href="/login" className="block mt-6">
                <Button className="w-full h-11 bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black rounded-md font-medium">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Button>
              </Link>
            </div>

            {/* Terms */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Need help?{" "}
                <a href="mailto:support@adhub.com" className="text-gray-400 underline hover:no-underline">
                  Contact support
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 via-black to-gray-900/30" />
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-gray-800/20 via-transparent to-transparent rounded-full blur-3xl" />
      
      {/* Home button */}
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
            <h1 className="text-2xl font-semibold text-white">Sign in with Magic Link</h1>
            <p className="text-gray-400">
              Enter your email and we'll send you a secure link to sign in instantly.
            </p>
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
                disabled={loading}
                className="h-11 bg-gray-900 border-gray-700 text-white placeholder-gray-500 rounded-md focus:border-gray-500 focus:ring-0"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black rounded-md font-medium"
            >
              {loading ? "Sending Magic Link..." : "Send Magic Link"}
            </Button>
          </form>

          {/* Back link */}
          <div className="text-center">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
              ← Back to Sign In
            </Link>
          </div>

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