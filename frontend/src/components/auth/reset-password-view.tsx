"use client"

import Link from "next/link"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { AdHubLogo } from "../core/AdHubLogo"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../contexts/AuthContext"
import { toast } from "sonner"
import { ArrowLeft, Eye, EyeOff } from "lucide-react"
import { supabase } from "../../lib/stores/supabase-client"

export function ResetPasswordView() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isValidSession, setIsValidSession] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if we have a valid password reset session
    const checkResetSession = async () => {
      try {
        // First check if we have URL parameters that need processing
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const type = urlParams.get('type');
        
        console.log('🔐 Reset password component - checking URL params:', { token: !!token, type });
        
        if (token && type === 'recovery') {
          // This is a direct Supabase recovery link - redirect to auth callback for processing
          console.log('🔐 Direct recovery link detected - redirecting to auth callback');
          window.location.href = `/auth/callback?token=${token}&type=${type}`;
          return;
        }
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (session && !error) {
          setIsValidSession(true)
        } else {
          toast.error("Invalid or expired password reset link", {
            description: "Please request a new password reset email"
          })
          setTimeout(() => {
            router.push('/forgot-password')
          }, 3000)
        }
      } catch (error) {
        console.error('Error checking reset session:', error)
        toast.error("Error validating reset link")
        setTimeout(() => {
          router.push('/forgot-password')
        }, 3000)
      } finally {
        setCheckingSession(false)
      }
    }

    checkResetSession()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password || !confirmPassword) {
      toast.error("Please fill in all fields")
      return
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    if (password !== confirmPassword) {
      toast.error("Passwords don't match")
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        toast.error(error.message || "Failed to update password")
        setLoading(false)
        return
      }

      toast.success("Password updated successfully!", {
        description: "You can now sign in with your new password"
      })
      
      // Redirect to login after successful password reset
      setTimeout(() => {
        router.push('/login')
      }, 2000)

    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred")
      setLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <AdHubLogo size="sm" className="mb-6" />
          <div className="text-white">Validating reset link...</div>
        </div>
      </div>
    )
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <AdHubLogo size="sm" className="mb-6" />
          <div className="text-white">Invalid reset link. Redirecting...</div>
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
            <h1 className="text-2xl font-semibold text-white">Reset Your Password</h1>
            <p className="text-gray-400">
              Enter your new password below
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm text-gray-300 mb-1">
                New Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11 bg-gray-900 border-gray-700 text-white placeholder-gray-500 rounded-md focus:border-gray-500 focus:ring-0 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm text-gray-300 mb-1">
                Confirm New Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? "Updating Password..." : "Update Password"}
            </Button>
          </form>

          {/* Back link */}
          <div className="text-center">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
              ← Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 