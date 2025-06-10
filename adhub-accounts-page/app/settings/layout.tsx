"use client"

import type React from "react"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Topbar } from "@/components/topbar"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface SettingsLayoutProps {
  children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname()

  const tabs = [
    { name: "Organization", href: "/settings" },
    { name: "Team", href: "/settings/team" },
    { name: "Account", href: "/settings/account" },
  ]

  return (
    <div className="dark">
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        {/* Sidebar */}
        <DashboardSidebar />

        {/* Main Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <Topbar pageTitle="Settings" showEmptyStateElements={false} />

          <main className="flex-1 overflow-y-auto">
            <div className="max-w-full mx-auto px-6 py-4">
              {/* Organization Header */}
              <div className="mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-muted rounded-md">
                    <span className="text-lg font-semibold">SP</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-foreground">Startup Project</h1>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">org_VrfbN6vMc2MCvaZELhfJ</code>
                    </div>
                  </div>
                </div>
              </div>

              {/* Horizontal Tabs */}
              <div className="border-b border-border mb-6">
                <nav className="flex space-x-8">
                  {tabs.map((tab) => {
                    const isActive =
                      pathname === tab.href || (tab.href !== "/settings" && pathname.startsWith(tab.href))

                    return (
                      <Link
                        key={tab.name}
                        href={tab.href}
                        className={cn(
                          "py-3 px-1 border-b-2 font-medium text-sm transition-colors",
                          isActive
                            ? "border-[#c4b5fd] text-[#c4b5fd]"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                        )}
                      >
                        {tab.name}
                      </Link>
                    )
                  })}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="pb-8">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
