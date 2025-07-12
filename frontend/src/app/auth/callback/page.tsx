"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../../lib/stores/supabase-client"
import { Skeleton } from "../../../components/ui/skeleton"
import { toast } from "sonner"

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
          toast.error(error.message, {
            description: "Authentication Error"
          })
          router.push('/login')
          return
        }

        if (data.session) {
          // User is now authenticated
          toast.success("Your account has been verified. Let's get you set up!", {
            description: "Email Confirmed!"
          })
          router.push('/onboarding')
        } else {
          // No session found
          toast.error("Please try signing in with your credentials.", {
            description: "Confirmation Issue"
          })
          router.push('/login')
        }
      } catch (error) {
        console.error("Unexpected error in auth callback:", error)
        toast.error("Something went wrong. Please try signing in again.", {
          description: "Authentication Error"
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
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
          <p className="text-muted-foreground">Confirming your email...</p>
        </div>
      </div>
    )
  }

  return null
} 