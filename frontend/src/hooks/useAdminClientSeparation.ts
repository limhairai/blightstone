import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'

/**
 * 🔒 SECURITY: Admin/Client Separation Hook
 * 
 * Enforces strict separation between admin and client access:
 * - Admins can ONLY access /admin routes
 * - Clients can ONLY access /dashboard routes  
 * - No cross-access allowed for security
 */
export function useAdminClientSeparation() {
  const { user, session, loading: authLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdminStatusAndEnforceSeparation = async () => {
      // Wait for auth to load
      if (authLoading || !user || !session) {
        if (!authLoading) {
          setLoading(false)
        }
        return
      }

      try {
        // Check admin status using the API
        const response = await fetch('/api/auth/admin-check', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          const adminStatus = data.isAdmin === true
          setIsAdmin(adminStatus)

          // 🔒 ENFORCE STRICT SEPARATION
          const isOnAdminRoute = pathname?.startsWith('/admin')
          const isOnClientRoute = pathname?.startsWith('/dashboard') || 
                                  pathname?.startsWith('/wallet') ||
                                  pathname?.startsWith('/pricing') ||
                                  pathname?.startsWith('/settings') ||
                                  pathname?.startsWith('/support')

          if (adminStatus && isOnClientRoute) {
            // ❌ SECURITY VIOLATION: Admin trying to access client dashboard
            console.warn('🔒 SECURITY: Admin redirected from client dashboard to admin panel')
            router.replace('/admin')
            return
          }

          if (!adminStatus && isOnAdminRoute) {
            // ❌ SECURITY VIOLATION: Client trying to access admin panel
            console.warn('🔒 SECURITY: Non-admin redirected from admin panel to dashboard')
            router.replace('/dashboard')
            return
          }
        } else {
          // API failed, assume not admin for security
          setIsAdmin(false)
          
          // If on admin route and API failed, redirect to dashboard
          if (pathname?.startsWith('/admin')) {
            router.replace('/dashboard')
            return
          }
        }
      } catch (error) {
        console.error('Admin check failed:', error)
        // On error, assume not admin for security
        setIsAdmin(false)
        
        // If on admin route and check failed, redirect to dashboard
        if (pathname?.startsWith('/admin')) {
          router.replace('/dashboard')
          return
        }
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatusAndEnforceSeparation()
  }, [user, session, authLoading, pathname, router])

  return {
    isAdmin,
    loading: loading || authLoading,
    canAccessAdmin: isAdmin === true,
    canAccessClient: isAdmin === false,
  }
}