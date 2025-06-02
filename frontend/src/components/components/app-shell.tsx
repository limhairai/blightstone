"use client"

import type { ReactNode } from "react"
import DashboardSidebar from "./dashboard-sidebar"
import { TopNavigation } from "./top-navigation"
import { usePathname } from "next/navigation"

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()

  // Improved page title extraction
  const getPageTitle = () => {
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
    const lastSegment = segments[segments.length - 1] || "dashboard"

    // Convert to title case (capitalize first letter)
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNavigation pageTitle={getPageTitle()} hasNotifications={false} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
} 