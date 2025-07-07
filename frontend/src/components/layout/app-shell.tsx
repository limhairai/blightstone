"use client"

import type { ReactNode } from "react"
import { useEffect, useCallback, useState, createContext, useContext } from "react"
import { DashboardSidebar } from "./dashboard-sidebar"
import { Topbar } from "./topbar"
import { SetupGuideWidget } from "../onboarding/setup-guide-widget"
import { useAdvancedOnboarding } from "../../hooks/useAdvancedOnboarding"
import { usePathname } from "next/navigation"
import { usePageTitle } from "../core/simple-providers"
import { useAuth } from "../../contexts/AuthContext"
import { getGreeting } from "../../lib/utils"
import { layoutTokens } from "../../lib/design-tokens"
import { useOrganizationStore } from '@/lib/stores/organization-store'

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
  const { user, session } = useAuth()
  const [setupWidgetState, setSetupWidgetState] = useState<"expanded" | "collapsed" | "closed">("collapsed")
  const { setOrganization } = useOrganizationStore()
  
  // Use the new, simplified onboarding hook
  const {
    shouldShowOnboarding,
    isLoading,
    progressData
  } = useAdvancedOnboarding()



  // SIMPLIFIED LOGIC: Just manage widget state, don't overthink it
  useEffect(() => {
    if (isLoading) return
    
    // If setup is complete, always close
    if (progressData?.completionPercentage === 100) {
      setSetupWidgetState("closed")
      return
    }
    
    // If user never dismissed and setup incomplete, show expanded
    if (shouldShowOnboarding && setupWidgetState === "closed") {
      setSetupWidgetState("expanded")
    }
  }, [shouldShowOnboarding, isLoading, progressData, setupWidgetState])

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
      "/dashboard/transactions": "Transactions",
      "/dashboard/topup-requests": "Top-up Requests",
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
          <main className={`flex-1 overflow-y-auto ${layoutTokens.padding.pageX} ${layoutTokens.padding.pageTop}`}>{children}</main>
        </div>

        {/* Global Setup Guide Widget - Simple logic: show when incomplete */}
        {progressData && progressData.completionPercentage < 100 && (
          <SetupGuideWidget 
            widgetState={setupWidgetState} 
            onStateChange={setSetupWidgetState}
          />
        )}
      </div>
    </SetupWidgetContext.Provider>
  )
} 