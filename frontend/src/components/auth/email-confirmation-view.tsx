"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { BlightstoneLogo } from "../core/BlightstoneLogo"
import { useAuth } from "../../contexts/AuthContext"
import { toast } from "sonner"
import { Mail, CheckCircle, RefreshCw, ArrowLeft } from "lucide-react"

export function EmailConfirmationView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { resendVerification } = useAuth()
  const [isResending, setIsResending] = useState(false)
  
  const email = searchParams?.get('email') || ''

  const handleResendEmail = async () => {
    if (!email) {
      toast.error("No email address found. Please try signing up again.")
      return
    }

    setIsResending(true)
    try {
              const { error } = await resendVerification(email)
        if (!error) {
          toast.success("We&apos;ve sent another confirmation email to your inbox.", {
            description: "Email Sent"
          })
      }
    } catch (error) {
      toast.error("Failed to resend confirmation email. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  const handleBackToLogin = () => {
    router.push('/login')
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

          {/* Success icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                </div>
                
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">Check Your Email</h1>
            <p className="text-muted-foreground">
              We've sent a confirmation email to{" "}
              <span className="font-medium text-foreground break-all">{email}</span>
            </p>
              </div>

          {/* Instructions */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Click the link in the email to confirm your account. 
              If you don't see it, check your spam folder.
            </p>
              </div>

          {/* Actions */}
              <div className="space-y-3">
                <Button
                  onClick={handleResendEmail}
                  disabled={isResending || !email}
              className="w-full h-11 bg-secondary hover:bg-secondary/80 border border-border text-foreground rounded-md font-normal"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Resend confirmation email
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleBackToLogin}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md font-medium"
                >
                  Back to Sign In
                </Button>
              </div>

          {/* Terms */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
                  Need help?{" "}
              <a href="mailto:support@blightstone.com" className="text-muted-foreground underline hover:no-underline">
                    Contact support
                  </a>
                </p>
              </div>
        </div>
      </div>
    </div>
  )
} 