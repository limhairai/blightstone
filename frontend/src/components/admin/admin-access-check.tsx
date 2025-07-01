"use client"

import { useAuth } from "../../contexts/AuthContext"
import { useState, useEffect, useMemo } from "react"
import { Loader } from "../core/Loader"
import { Shield, RefreshCw } from "lucide-react"
import { Button } from "../ui/button"
import { supabase } from "../../lib/stores/supabase-client"
import { adminCache } from "../../lib/admin-cache"

interface AdminAccessCheckProps {
  children: React.ReactNode
}

export function AdminAccessCheck({ children }: AdminAccessCheckProps) {
  const { user, session, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAdminStatus = async () => {
      // Wait for auth to complete, but don't wait forever
      if (authLoading && !user) {
        return;
      }
      
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Simple admin check - just call the API directly
        const response = await fetch('/api/auth/admin-check', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.isAdmin || false);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('AdminAccessCheck: Error checking admin status:', error);
        setError('Failed to verify admin access');
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    // Add a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setIsAdmin(false);
      setLoading(false);
    }, 3000);

    checkAdminStatus().finally(() => {
      clearTimeout(timeout);
    });

    return () => {
      clearTimeout(timeout);
    };
  }, [user, session, authLoading]);

  const loadingComponent = useMemo(() => (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
      <div className="p-8 bg-card rounded-lg shadow-xl max-w-md text-center">
        <Shield className="h-12 w-12 text-[#c4b5fd] mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Verifying Admin Access</h2>
        <p className="text-muted-foreground mb-6">
          Please wait while we verify your credentials...
        </p>
        <Loader />
      </div>
    </div>
  ), [])

  const errorComponent = useMemo(() => (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
      <div className="p-8 bg-card rounded-lg shadow-xl max-w-md text-center">
        <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-destructive mb-4">Authentication Error</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
          className="w-full"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Page
        </Button>
      </div>
    </div>
  ), [error])

  const accessDeniedComponent = useMemo(() => (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
      <div className="p-8 bg-card rounded-lg shadow-xl max-w-md text-center">
        <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-destructive mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-6">
          You are not authorized to view this page. Admin privileges required.
        </p>
        <div className="space-y-3">
          <Button 
            onClick={() => window.location.href = '/dashboard'} 
            variant="outline"
            className="w-full"
          >
            Return to Dashboard
          </Button>
          <Button 
            onClick={() => window.location.href = '/promote-admin'} 
            variant="ghost"
            size="sm"
            className="w-full"
          >
            Promote to Admin
          </Button>
        </div>
      </div>
    </div>
  ), [])

  if (loading) {
    return loadingComponent
  }

  if (error) {
    return errorComponent
  }

  if (!isAdmin) {
    return accessDeniedComponent
  }

  return <>{children}</>
} 