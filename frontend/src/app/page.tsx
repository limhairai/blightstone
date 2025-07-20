"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function HomePage() {
  const { session, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (session) {
        // User is authenticated, check if they need onboarding first
        const checkOnboardingAndRedirect = async () => {
          try {
            const response = await fetch('/api/onboarding-progress', {
              headers: {
                'Authorization': `Bearer ${session.access_token}`
              }
            });
            
            if (response.ok) {
              const onboardingData = await response.json();
              const needsOnboarding = !Object.values(onboardingData.progress).every(Boolean) && 
                                     !onboardingData.persistence?.hasExplicitlyDismissed;
              
              if (needsOnboarding) {
                router.replace('/onboarding');
              } else {
                router.replace('/dashboard');
              }
            } else {
              // Fallback to dashboard if we can't check onboarding
              router.replace('/dashboard');
            }
          } catch (error) {
            console.error('Error checking onboarding status:', error);
            // Fallback to dashboard
            router.replace('/dashboard');
          }
        };
        
        checkOnboardingAndRedirect();
      } else {
        // User is not authenticated, redirect to login
        router.replace('/login')
      }
    }
  }, [session, loading, router])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // This will only show briefly while redirecting
  return null
} 