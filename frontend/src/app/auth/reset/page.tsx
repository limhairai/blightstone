'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'

export default function AuthResetPage() {
  const router = useRouter()

  useEffect(() => {
    const resetAuth = async () => {
      const supabase = createClient()
      
      // Sign out to clear all tokens
      await supabase.auth.signOut()
      
      // Clear all localStorage items related to Supabase
      if (typeof window !== 'undefined') {
        const keys = Object.keys(localStorage)
        keys.forEach(key => {
          if (key.includes('supabase') || key.includes('auth')) {
            localStorage.removeItem(key)
          }
        })
        
        // Clear all sessionStorage items
        const sessionKeys = Object.keys(sessionStorage)
        sessionKeys.forEach(key => {
          if (key.includes('supabase') || key.includes('auth')) {
            sessionStorage.removeItem(key)
          }
        })
      }
      
      // Redirect to login after cleanup
      setTimeout(() => {
        router.push('/login')
      }, 1000)
    }

    resetAuth()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Resetting Authentication...</h1>
        <p className="text-gray-600">Clearing stale tokens and redirecting to login...</p>
      </div>
    </div>
  )
} 