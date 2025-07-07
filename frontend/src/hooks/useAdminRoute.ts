import { useAuth } from "../contexts/AuthContext"
import { useState, useEffect } from "react"

export function useAdminRoute() {
  const { user, session, loading: authLoading } = useAuth()
  const [canViewAdmin, setCanViewAdmin] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (authLoading) return // Wait for auth to finish loading
      
      if (!session || !user) {
        setCanViewAdmin(false)
        setLoading(false)
        return
      }

      try {
        // Use the API endpoint instead of direct database query to avoid RLS issues
        const response = await fetch('/api/auth/admin-check')
        
        if (response.ok) {
          const data = await response.json()
          setCanViewAdmin(data.isAdmin === true)
        } else {
          console.error('Admin check API error:', response.status)
          setCanViewAdmin(false)
        }
      } catch (err) {
        console.error('Admin check error:', err)
        setCanViewAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdminAccess()
  }, [user, session, authLoading])

  return { canViewAdmin, loading }
} 