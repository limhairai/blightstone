"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePageTitle } from "@/components/core/simple-providers"
import { usePathname } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Copy, Edit } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useEffect } from "react"
import { getInitials } from "@/lib/mock-data"
import { getAvatarClasses, gradientTokens } from "@/lib/design-tokens"
import { useTheme } from "next-themes"
import { useDemoState } from "@/contexts/DemoStateContext"

interface SettingsLayoutProps {
  children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname()
  const { setPageTitle } = usePageTitle()
  const { state } = useDemoState()
  
  // Use current organization from demo state
  const currentOrganization = state.currentOrganization

  useEffect(() => {
    setPageTitle("Settings")
  }, [setPageTitle])

  const tabs = [
    { name: "Organization", href: "/dashboard/settings" },
    { name: "Team", href: "/dashboard/settings/team" },
    { name: "Account", href: "/dashboard/settings/account" },
  ]

  return (
    <div className="max-w-full mx-auto py-4">
      {/* Enhanced Organization Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-border">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 rounded-lg border border-border">
            <AvatarImage src={currentOrganization.avatar || "/placeholder.svg?height=64&width=64"} alt={currentOrganization.name} />
            <AvatarFallback className={getAvatarClasses('lg')}>
              {getInitials(currentOrganization.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{currentOrganization.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-xs bg-muted px-2 py-1 rounded border border-border font-mono text-muted-foreground">
                {currentOrganization.id}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard
                      .writeText(currentOrganization.id)
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
          <Badge className={gradientTokens.primary}>
            {currentOrganization.plan} Plan
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
              pathname === tab.href || (tab.href !== "/dashboard/settings" && pathname && pathname.startsWith(tab.href))

            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={cn(
                  "py-3 px-1 border-b-2 font-medium text-sm transition-colors",
                  isActive
                    ? "border-violet-500 text-violet-600 dark:border-[#c4b5fd] dark:text-[#c4b5fd]"
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
  )
} 