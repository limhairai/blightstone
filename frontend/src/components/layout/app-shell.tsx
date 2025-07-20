"use client"

import type { ReactNode } from "react"
import { useEffect, useCallback, useState, createContext, useContext } from "react"
import { DashboardSidebar } from "./dashboard-sidebar"
import { Topbar } from "./topbar"
import { SetupGuideWidget } from "../onboarding/setup-guide-widget"
import { WelcomeOverlay } from "../onboarding/welcome-overlay"
import { useAdvancedOnboarding } from "../../hooks/useAdvancedOnboarding"
import { usePathname } from "next/navigation"
import { usePageTitle } from "../core/simple-providers"
import { useAuth } from "../../contexts/AuthContext"
import { getGreeting } from "../../lib/utils"
import { layoutTokens } from "../../lib/design-tokens"
import { useOrganizationStore } from '@/lib/stores/organization-store'
import { AdHubLogo } from "../core/AdHubLogo"
import { Loader2 } from "lucide-react"

interface AppShellProps {
  children: ReactNode
}

// Create context for setup widget state
interface SetupWidgetContextType {
  setupWidgetState: "expanded" | "collapsed" | "closed"
  setSetupWidgetState: (state: "expanded" | "collapsed" | "closed") => void
}

const SetupWidgetContext = createContext<SetupWidgetContextType | undefined>(undefined)

export const useSetupWidget = () => {
  const context = useContext(SetupWidgetContext)
  if (!context) {
    // Return safe fallback
    return {
      setupWidgetState: "collapsed" as const,
      setSetupWidgetState: () => {},
    }
  }
  return context
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const { setPageTitle } = usePageTitle()
  const { user, session, loading: authLoading } = useAuth()
  const [setupWidgetState, setSetupWidgetState] = useState<"expanded" | "collapsed" | "closed">("expanded") // Show widget expanded
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(false)
  const { setOrganization } = useOrganizationStore()
  
  // Use the new, simplified onboarding hook
  const {
    shouldShowOnboarding,
    isLoading,
    progressData
  } = useAdvancedOnboarding()

  // Show simple loading screen during initial auth
  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <div className="text-center">
          <AdHubLogo size="lg" className="mb-6" />
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Loading AdHub...</span>
          </div>
        </div>
      </div>
    )
  }

  // Show setup widget IMMEDIATELY for new users, then update based on progress
  useEffect(() => {
    if (!user) return
    
    // Check if user is new (created within last 24 hours)
    const isNewUser = user.created_at && new Date(user.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    // IMMEDIATELY show setup widget for new users
    if (isNewUser) {
      console.log('🚀 New user detected - showing setup widget immediately');
      setSetupWidgetState("expanded")
    }
    
    // Once progress loads, adjust widget state based on completion
    if (!isLoading && progressData) {
      if (progressData.hasCompletedOnboarding) {
        setSetupWidgetState("collapsed") // Completed users get collapsed widget
      } else if (isNewUser) {
        // Keep expanded for new users who haven't completed
        setSetupWidgetState("expanded")
      }
    }
  }, [user, isLoading, progressData])

  // Show welcome overlay for new users - IMMEDIATE display
  useEffect(() => {
    if (!user || isLoading) return
    
    // Check if user is new (hasn't seen welcome overlay before)
    const hasSeenWelcome = localStorage.getItem(`adhub_welcome_seen_${user.id}`)
    
    // Show welcome overlay IMMEDIATELY for:
    // 1. Any user who hasn't seen it before
    // 2. Users coming from onboarding
    // 3. New users (created within last 48 hours - more generous)
    if (!hasSeenWelcome) {
      const urlParams = new URLSearchParams(window.location.search)
      const fromOnboarding = urlParams.get('welcome') === 'true'
      const isNewUser = user.created_at && new Date(user.created_at) > new Date(Date.now() - 48 * 60 * 60 * 1000) // 48 hours
      
      // Show for ANY new user or anyone from onboarding
      if (fromOnboarding || isNewUser || !hasSeenWelcome) {
        console.log('🎉 Showing welcome overlay for new user');
        setShowWelcomeOverlay(true)
        setSetupWidgetState("expanded") // Also expand setup guide immediately
      }
    }
  }, [user, isLoading])

  const handleWelcomeOverlayDismiss = () => {
    if (user) {
      localStorage.setItem(`adhub_welcome_seen_${user.id}`, 'true')
    }
    setShowWelcomeOverlay(false)
    
    // Clean up URL parameter if it exists
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('welcome')) {
      urlParams.delete('welcome')
      const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`
      window.history.replaceState({}, '', newUrl)
    }
  }

  useEffect(() => {
    if (session?.user?.app_metadata?.organization_id && session?.user?.app_metadata?.organization_name) {
      setOrganization(
        session.user.app_metadata.organization_id,
        session.user.app_metadata.organization_name
      )
    }
  }, [session, setOrganization])

  // Improved page title extraction
  const getPageTitle = useCallback(() => {
    if (!pathname) return "Dashboard"
    if (pathname === "/dashboard") {
      const userName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'
      const greeting = getGreeting()
      return `${greeting}, ${userName}`
    }
    const pathTitles: Record<string, string> = {
      "/dashboard/businesses": "Businesses",
      "/dashboard/business-managers": "Business Managers",
      "/dashboard/wallet": "Wallet",
      "/dashboard/topup-requests": "Transactions",
      "/dashboard/accounts": "Ad Accounts",
      "/dashboard/settings": "Settings",
    }
    if (pathTitles[pathname]) return pathTitles[pathname]
    const segments = pathname.split("/").filter(Boolean)
    const lastSegment = segments.pop() || "dashboard"
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)
  }, [pathname, user])

  useEffect(() => {
    const title = getPageTitle()
    setPageTitle(title)
  }, [getPageTitle, setPageTitle])

  return (
    <SetupWidgetContext.Provider value={{ setupWidgetState, setSetupWidgetState }}>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <DashboardSidebar />

        {/* Main Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <Topbar 
            hasNotifications={false} 
            setupWidgetState={setupWidgetState}
            onSetupWidgetStateChange={setSetupWidgetState}
            showEmptyStateElements={progressData ? progressData.completionPercentage < 100 : true}
          />
          <main className={`flex-1 overflow-y-auto ${layoutTokens.padding.pageX} ${layoutTokens.padding.pageTop}`}>
            {/* Blocking overlay for new users until they see welcome */}
            {showWelcomeOverlay && (
              <div className="absolute inset-0 bg-black/50 z-30 backdrop-blur-sm" />
            )}
            {children}
          </main>
        </div>

        {/* Global Setup Guide Widget - Higher z-index when blocking */}
        <SetupGuideWidget 
          widgetState={setupWidgetState} 
          onStateChange={setSetupWidgetState}
        />

        {/* Welcome Overlay for New Users - Always on top */}
        {showWelcomeOverlay && (
          <WelcomeOverlay onDismiss={handleWelcomeOverlayDismiss} />
        )}
      </div>
    </SetupWidgetContext.Provider>
  )
} 