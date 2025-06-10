"use client"

import type React from "react"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Topbar } from "@/components/topbar"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Copy, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"

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
              {/* Enhanced Organization Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-border">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 rounded-lg border border-border">
                    <AvatarImage src="/placeholder.svg?height=64&width=64" alt="Startup Project" />
                    <AvatarFallback className="text-2xl bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] text-white rounded-lg">
                      SP
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-2xl font-semibold text-foreground">Startup Project</h1>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-muted px-2 py-1 rounded border border-border font-mono text-muted-foreground">
                        org_VrfbN6vMc2MCvaZELhfJ
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (navigator.clipboard) {
                            navigator.clipboard
                              .writeText("org_VrfbN6vMc2MCvaZELhfJ")
                              .then(() => {
                                // You can add a toast notification here if needed
                              })
                              .catch((err) => console.error("Failed to copy:", err))
                          }
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] text-black border-0 px-3 py-1">
                    Business Plan
                  </Badge>
                  <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-accent">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Organization
                  </Button>
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
