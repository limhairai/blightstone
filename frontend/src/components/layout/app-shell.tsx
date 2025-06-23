"use client"

import type { ReactNode } from "react"
import { useEffect, useCallback, useState, createContext, useContext } from "react"
import { DashboardSidebar } from "./dashboard-sidebar"
import { Topbar } from "./topbar"
import { SetupGuideWidget } from "../onboarding/setup-guide-widget"
import { useSetupProgress } from "../../hooks/useSetupProgress"
import { shouldShowOnboarding } from "../../lib/state-utils"
import { usePathname } from "next/navigation"
import { usePageTitle } from "../core/simple-providers"
import { useAuth } from "../../contexts/AuthContext"
import { getGreeting } from "../../lib/utils"
import { layoutTokens } from "../../lib/design-tokens"

interface AppShellProps {
  children: ReactNode
}

// Create context for setup widget state
interface SetupWidgetContextType {
  setupWidgetState: "expanded" | "collapsed" | "closed"
  setSetupWidgetState: (state: "expanded" | "collapsed" | "closed") => void
  showEmptyStateElements: boolean
  setShowEmptyStateElements: (show: boolean) => void
}

const SetupWidgetContext = createContext<SetupWidgetContextType | undefined>(undefined)

export const useSetupWidget = () => {
  const context = useContext(SetupWidgetContext)
  if (!context) {
    // Return safe fallback instead of throwing
    return {
      setupWidgetState: "collapsed" as const,
      setSetupWidgetState: () => {},
      showEmptyStateElements: false,
      setShowEmptyStateElements: () => {}
    }
  }
  return context
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const { setPageTitle } = usePageTitle()
  const { user } = useAuth()
  const [setupWidgetState, setSetupWidgetState] = useState<"expanded" | "collapsed" | "closed">("expanded")
  const [showEmptyStateElements, setShowEmptyStateElements] = useState(false)
  
  // Get setup progress
  const setupProgress = useSetupProgress()
  const shouldShowOnboardingElements = shouldShowOnboarding(setupProgress)

  // Update empty state elements based on setup progress
  useEffect(() => {
    setShowEmptyStateElements(shouldShowOnboardingElements)
  }, [shouldShowOnboardingElements])

  // Improved page title extraction - memoized to prevent unnecessary re-renders
  const getPageTitle = useCallback(() => {
    if (!pathname) {
      return "Dashboard"
    }

    // For dashboard root, use user greeting like Slash does
    if (pathname === "/dashboard") {
      const userName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'
      const greeting = getGreeting()
      return `${greeting}, ${userName}`
    }

    // Map of paths to their display titles
    const pathTitles: Record<string, string> = {
      "/dashboard/businesses": "Businesses",
      "/dashboard/wallet": "Wallet",
      "/dashboard/transactions": "Transactions",
      "/dashboard/accounts": "Ad Accounts",
      "/dashboard/settings": "Settings",
    }

    // Check if we have a direct match for the path
    if (pathTitles[pathname]) {
      return pathTitles[pathname]
    }

    // If no direct match, try to find the closest parent path
    const segments = pathname.split("/").filter(Boolean)

    // Try to extract from the last path segment if no mapping exists
    const lastSegment = segments.pop() || "dashboard"

    // Convert to title case (capitalize first letter)
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)
  }, [pathname, user])

  useEffect(() => {
    const title = getPageTitle()
    setPageTitle(title)
  }, [getPageTitle, setPageTitle])

  return (
    <SetupWidgetContext.Provider value={{ 
      setupWidgetState, 
      setSetupWidgetState, 
      showEmptyStateElements, 
      setShowEmptyStateElements 
    }}>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <DashboardSidebar />

        {/* Main Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <Topbar 
            hasNotifications={false} 
            setupWidgetState={setupWidgetState}
            onSetupWidgetStateChange={setSetupWidgetState}
            showEmptyStateElements={showEmptyStateElements}
            setupProgress={setupProgress}
          />
          <main className={`flex-1 overflow-y-auto ${layoutTokens.padding.pageX} ${layoutTokens.padding.pageTop}`}>{children}</main>
        </div>

        {/* Global Setup Guide Widget - only show when user needs onboarding */}
        {showEmptyStateElements && (
          <SetupGuideWidget 
            widgetState={setupWidgetState} 
            onStateChange={setSetupWidgetState}
          />
        )}
      </div>
    </SetupWidgetContext.Provider>
  )
} 