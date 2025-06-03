"use client"

import type { ReactNode } from "react"
import { useEffect } from "react"
import DashboardSidebar from "./dashboard-sidebar"
import { Topbar } from "./topbar"
import { usePathname } from "next/navigation"
import { usePageTitle } from "@/components/core/providers"

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const { setPageTitle } = usePageTitle()

  // Improved page title extraction
  const getPageTitle = () => {
    if (!pathname) {
      return "Dashboard"
    }

    // Map of paths to their display titles
    const pathTitles: Record<string, string> = {
      "/dashboard": "Dashboard",
      "/dashboard/wallet": "Wallet",
      "/dashboard/wallet/transactions": "Transactions",
      "/dashboard/accounts": "Accounts",
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
  }

  useEffect(() => {
    const title = getPageTitle()
    setPageTitle(title)
  }, [pathname, setPageTitle])

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar hasNotifications={false} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
} 