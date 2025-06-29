import { useAuth } from "../contexts/AuthContext"
import { useState, useEffect } from "react"
import { supabase } from "../lib/stores/supabase-client"

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
        // Check user profile in Supabase for admin status
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_superuser')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
          setCanViewAdmin(false)
        } else {
          // User is an admin ONLY if they have the is_superuser flag
          setCanViewAdmin(profile?.is_superuser === true)
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