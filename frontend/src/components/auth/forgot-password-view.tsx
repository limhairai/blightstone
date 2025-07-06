"use client"

import Link from "next/link"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { AdHubLogo } from "../core/AdHubLogo"
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
      } else {
        setSent(true)
        toast.success("Password reset email sent!")
      }
    } catch (err) {
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="px-6 py-4 md:px-8">
          <AdHubLogo size="lg" />
        </div>
        
        <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8">
            <Card className="border-border">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
                <CardDescription>
                  We&apos;ve sent password reset instructions to {email}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="text-center text-sm text-muted-foreground space-y-2">
                  <p>
                    Click the link in the email to reset your password. 
                    If you don&apos;t see it, check your spam folder.
                  </p>
                </div>

                <div className="space-y-3">
                  <Link href="/login" className="block">
                    <Button className="w-full bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Sign In
                    </Button>
                  </Link>
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setSent(false)}
                  >
                    Try Different Email
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
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
              <CardTitle className="text-2xl font-bold">Forgot Password?</CardTitle>
              <CardDescription>
                No worries! Enter your email and we&apos;ll send you reset instructions.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                    className="h-12 px-4"
                  />
                </div>

                <div className="space-y-3">
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black"
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send Reset Instructions"}
                  </Button>
                  
                  <Link href="/login" className="block">
                    <Button variant="outline" className="w-full h-12">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Sign In
                    </Button>
                  </Link>
                </div>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                <p>
                  Remember your password?{" "}
                  <Link href="/login" className="text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 