"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { AdHubLogo } from "../core/AdHubLogo"
import { useAuth } from "../../contexts/AuthContext"
import { toast } from "sonner"
import { Mail, CheckCircle, RefreshCw } from "lucide-react"

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
    <div className="min-h-screen flex flex-col bg-background">
      <div className="px-6 py-4 md:px-8">
        <AdHubLogo size="lg" />
      </div>
      
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <Card className="border-border">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">
                  We&apos;ve sent a confirmation email to:
                </p>
                <p className="font-medium text-foreground break-all">
                  {email}
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium">Click the confirmation link</p>
                    <p className="text-muted-foreground">Check your email and click the confirmation link to activate your account.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium">Return to sign in</p>
                    <p className="text-muted-foreground">Once confirmed, you can sign in with your email and password.</p>
                  </div>
                </div>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>Didn&apos;t receive the email? Check your spam folder or</p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleResendEmail}
                  disabled={isResending || !email}
                  variant="outline"
                  className="w-full"
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
                  className="w-full bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black"
                >
                  Back to Sign In
                </Button>
              </div>

              <div className="text-center text-xs text-muted-foreground">
                <p>
                  Need help?{" "}
                  <a href="mailto:support@adhub.com" className="text-primary hover:underline">
                    Contact support
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 