'use client'

import { useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/stores/supabase-client'
import { useRouter } from 'next/navigation'

export default function AuthResetPage() {
  const router = useRouter()

  useEffect(() => {
    const resetAuth = async () => {
      const supabase = createSupabaseBrowserClient()
      
      // Sign out to clear all tokens
      await supabase.auth.signOut()
      
      // Clear all localStorage items related to Supabase and app state
      if (typeof window !== 'undefined') {
        const keys = Object.keys(localStorage)
        keys.forEach(key => {
          if (key.includes('supabase') || 
              key.includes('auth') || 
              key.includes('organization') ||
              key.includes('swr') ||
              key.includes('adhub')) {
            localStorage.removeItem(key)
          }
        })
        
        // Clear all sessionStorage items
        const sessionKeys = Object.keys(sessionStorage)
        sessionKeys.forEach(key => {
          if (key.includes('supabase') || 
              key.includes('auth') || 
              key.includes('organization') ||
              key.includes('swr') ||
              key.includes('adhub')) {
            sessionStorage.removeItem(key)
          }
        })

        // Clear all cookies related to auth
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
      }
      
      // Force a hard reload to clear any remaining state
      setTimeout(() => {
        window.location.href = '/login'
      }, 1000)
    }

    resetAuth()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Resetting Authentication...</h1>
        <p className="text-gray-600">Clearing stale tokens and redirecting to login...</p>
        <p className="text-sm text-gray-500 mt-2">This may take a moment...</p>
      </div>
    </div>
  )
} 