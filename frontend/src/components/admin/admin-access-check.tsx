"use client"

import { useAuth } from "../../contexts/AuthContext"
import { useState, useEffect, useMemo } from "react"
import { Loader } from "../core/Loader"
import { Shield, RefreshCw, ArrowLeft } from "lucide-react"
import { Button } from "../ui/button"

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



        // Use API endpoint only to avoid RLS recursion issues
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
          const errorData = await response.text();
          console.error('AdminAccessCheck: API check failed:', errorData);
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-medium text-foreground">Verifying Access</h2>
          <p className="text-sm text-muted-foreground">
            Checking admin permissions...
          </p>
        </div>
        <Loader />
      </div>
    </div>
  ), [])

  const errorComponent = useMemo(() => (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-12 w-12 bg-destructive/10 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-destructive" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-lg font-medium text-foreground">Authentication Error</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
          className="w-full"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    </div>
  ), [error])

  const accessDeniedComponent = useMemo(() => (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-12 w-12 bg-destructive/10 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-destructive" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-lg font-medium text-foreground">Access Denied</h1>
          <p className="text-sm text-muted-foreground">
            Admin privileges required to view this page.
          </p>
        </div>
        <div className="space-y-3">
          <Button 
            onClick={() => window.location.href = '/dashboard'} 
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Dashboard
          </Button>
          <Button 
            onClick={() => window.location.href = '/admin-setup'} 
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground hover:text-foreground"
          >
            Request Admin Access
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