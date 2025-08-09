"use client"

import type { ReactNode } from "react"
import { useEffect, useCallback, useState, createContext, useContext } from "react"
import { DashboardSidebar } from "./dashboard-sidebar"
import { Topbar } from "./topbar"
// Onboarding components removed - internal CRM doesn't need onboarding
import { usePathname } from "next/navigation"
import { usePageTitle } from "../core/simple-providers"
import { useAuth } from "../../contexts/AuthContext"
import { getGreeting } from "../../lib/utils"
import { layoutTokens } from "../../lib/design-tokens"
import { useOrganizationStore } from '@/lib/stores/organization-store'
import { BlightstoneLogo } from "../core/BlightstoneLogo"
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
  // Welcome overlay removed for internal CRM
  const { setOrganization } = useOrganizationStore()
  
  // Onboarding removed for internal CRM

  // Show simple loading screen during initial auth
  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <div className="text-center">
          <BlightstoneLogo size="lg" className="mb-6" />
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Loading Blightstone...</span>
          </div>
        </div>
      </div>
    )
  }

  // SIMPLE APPROACH: Show widget immediately for new users, no API dependency
  useEffect(() => {
    if (!user) return
    
    // Check if user is new (created within last 48 hours - generous window)
    const isNewUser = user.created_at && new Date(user.created_at) > new Date(Date.now() - 48 * 60 * 60 * 1000)
    
    // UNSKIPPABLE: Always show setup widget for all users - no dismissal option
    if (isNewUser) {
      console.log('🚀 New user detected - showing setup widget immediately');
      setSetupWidgetState("expanded")
    } else {
      // Older users get collapsed widget by default
      setSetupWidgetState("collapsed")
    }
  }, [user]) // Remove dependency on API data

  // Welcome overlay logic removed for internal CRM

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
      // Business managers removed for CRM
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
            showEmptyStateElements={true}
          />
          <main className={`flex-1 overflow-y-auto ${layoutTokens.padding.pageX} ${layoutTokens.padding.pageTop}`}>
            {/* Welcome overlay removed for internal CRM */}
            {children}
          </main>
        </div>

        {/* Setup guide and welcome overlay removed for internal CRM */}
      </div>
    </SetupWidgetContext.Provider>
  )
} 