"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function HomePage() {
  const { session, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Check for email confirmation tokens in URL and redirect to auth callback
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      const hasToken = searchParams.get('token') || hashParams.get('access_token');
      const authType = searchParams.get('type') || hashParams.get('type');
      
      if (hasToken && authType) {
        console.log('🔐 Email confirmation detected on root page, redirecting to auth callback');
        // Redirect to auth callback with all parameters
        const currentUrl = window.location.href;
        const callbackUrl = currentUrl.replace(window.location.pathname, '/auth/callback');
        window.location.href = callbackUrl;
        return;
      }
    }
    
    if (!loading) {
      if (session) {
        // User is authenticated, redirect directly to dashboard
        router.replace('/dashboard');
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