"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import DashboardSidebar from "@/components/dashboard-sidebar"
import { TopNavigation } from "@/components/top-navigation"
import { WelcomeHeader } from "@/components/welcome-header"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isDashboardRoot = pathname === "/dashboard"

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Navigation with dynamic page title */}
        <TopNavigation />

        {/* Welcome Header - only on main dashboard */}
        {isDashboardRoot && (
          <div className="border-b border-border bg-background px-6 py-4">
            <WelcomeHeader />
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
