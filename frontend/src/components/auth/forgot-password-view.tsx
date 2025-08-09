"use client"

import Link from "next/link"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { BlightstoneLogo } from "../core/BlightstoneLogo"
import { useState } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { toast } from "sonner"
import { ArrowLeft, Mail, CheckCircle } from "lucide-react"

export function ForgotPasswordView() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast.error("Please enter your email address")
      return
    }

    setLoading(true)
    
    try {
      const { error } = await resetPassword(email)
      
      if (error) {
        toast.error(error.message || "Failed to send reset email")
        setLoading(false)
      } else {
        setSent(true)
        setLoading(false)
        toast.success("If an account exists for this email, a password reset link has been sent. Please check your inbox.")
      }
    } catch (err) {
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-background" />
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-muted/10 rounded-full blur-3xl" />
        
        {/* Home button */}
        <div className="absolute top-6 left-6 z-50">
          <Link 
            href="https://blightstone.com" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
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
              <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-foreground" />
              </div>
            </div>

            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-semibold text-foreground">Check Your Email</h1>
              <p className="text-muted-foreground">
                We've sent password reset instructions to {email}
              </p>
                </div>

            {/* Instructions */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                    Click the link in the email to reset your password. 
                If you don't see it, check your spam folder.
                  </p>
                </div>

            {/* Actions */}
                <div className="space-y-3">
              <Link href="/login">
                <Button className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md font-medium">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Sign In
                    </Button>
                  </Link>
                  
                  <Button
                onClick={() => {
                  setSent(false)
                  setEmail("")
                }}
                className="w-full h-11 bg-secondary hover:bg-secondary/80 border border-border text-foreground rounded-md font-normal"
                  >
                    Try Different Email
                  </Button>
                </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-background" />
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-muted/10 rounded-full blur-3xl" />
      
      {/* Home button */}
        <div className="absolute top-6 left-6 z-50">
        <Link 
          href="https://blightstone.com" 
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
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
            <BlightstoneLogo size="sm" />
          </div>

          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">Reset Your Password</h1>
            <p className="text-muted-foreground">
              Remember your password?{" "}
              <Link href="/login" className="text-foreground underline hover:no-underline">
                Sign in
              </Link>
              .
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
                placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                required
                    disabled={loading}
                className="h-11 bg-input border-border text-foreground placeholder-muted-foreground rounded-md focus:border-ring focus:ring-0"
                  />
                </div>

                  <Button
                    type="submit"
                    disabled={loading}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md font-medium"
                  >
              {loading ? "Sending..." : "Send Reset Link"}
                  </Button>
          </form>

          {/* Back link */}
          <div className="text-center">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back to Sign In
                  </Link>
              </div>
        </div>
      </div>
    </div>
  )
} 