"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../../lib/stores/supabase-client"
import { FullPageLoading } from "../../../components/ui/enhanced-loading"
import { toast } from "../../../components/ui/use-toast"

export default function AuthCallbackPage() {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the auth callback from Supabase
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error("Auth callback error:", error)
          toast({
            title: "Authentication Error",
            description: error.message,
            variant: "destructive"
          })
          router.push('/login')
          return
        }

        if (data.session) {
          // User is now authenticated
          toast({
            title: "Email Confirmed!",
            description: "Your account has been verified. Welcome to AdHub!",
            variant: "default"
          })
          router.push('/dashboard')
        } else {
          // No session found
          toast({
            title: "Confirmation Issue",
            description: "Please try signing in with your credentials.",
            variant: "destructive"
          })
          router.push('/login')
        }
      } catch (error) {
        console.error("Unexpected error in auth callback:", error)
        toast({
          title: "Authentication Error",
          description: "Something went wrong. Please try signing in again.",
          variant: "destructive"
        })
        router.push('/login')
      } finally {
        setIsProcessing(false)
      }
    }

    handleAuthCallback()
  }, [router])

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <FullPageLoading />
          <p className="text-muted-foreground">Confirming your email...</p>
        </div>
      </div>
    )
  }

  return null
} 