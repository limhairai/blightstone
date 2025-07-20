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
          const user = data.session.user
          
          // Check if this is a new user who just confirmed their email
          const now = new Date()
          const userCreated = new Date(user.created_at)
          const isVeryNewUser = (now.getTime() - userCreated.getTime()) < (10 * 60 * 1000) // Less than 10 minutes old
          
          // Check if user was just confirmed (email_confirmed_at is very recent)
          const justConfirmed = user.email_confirmed_at && 
            (now.getTime() - new Date(user.email_confirmed_at).getTime()) < (5 * 60 * 1000) // Confirmed within 5 minutes
          
          try {
            const response = await fetch('/api/organizations', {
              headers: {
                'Authorization': `Bearer ${data.session.access_token}`
              }
            })
            
            if (response.ok) {
              const orgData = await response.json()
              const hasOrganization = orgData.organizations && orgData.organizations.length > 0
              
              // If user is very new AND just confirmed email, send to onboarding regardless of org
              if ((isVeryNewUser || justConfirmed) && hasOrganization) {
                // New user who just confirmed - go to onboarding even though they have an org
                toast.success("Welcome to AdHub! Let's get you set up.", {
                  description: "Account confirmed successfully"
                })
                router.push('/onboarding')
              } else if (hasOrganization) {
                // Existing user with organization - go to dashboard
                toast.success("Welcome back!", {
                  description: "Signed in successfully"
                })
                router.push('/dashboard')
              } else {
                // User without organization (edge case) - go to onboarding
                toast.success("Welcome to AdHub! Let's get you set up.", {
                  description: "Account Created"
                })
                router.push('/onboarding')
              }
            } else {
              // Can't check organization, but if user is very new, send to onboarding
              if (isVeryNewUser || justConfirmed) {
                toast.success("Welcome to AdHub! Let's get you set up.", {
                  description: "Account confirmed successfully"
                })
                router.push('/onboarding')
              } else {
                // Fallback to dashboard for existing users
                toast.success("Welcome back!")
                router.push('/dashboard')
              }
            }
          } catch (orgError) {
            console.error("Error checking organization:", orgError)
            // If we can't check organization but user is new, default to onboarding
            if (isVeryNewUser || justConfirmed) {
              toast.success("Welcome to AdHub! Let's get you set up.", {
                description: "Account confirmed successfully"
              })
              router.push('/onboarding')
            } else {
              // Fallback to dashboard for existing users
              toast.success("Welcome back!")
              router.push('/dashboard')
            }
          }
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