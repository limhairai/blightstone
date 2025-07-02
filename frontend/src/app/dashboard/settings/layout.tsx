"use client"

import type React from "react"
import { cn } from "../../../lib/utils"
import Link from "next/link"
import { usePageTitle } from "../../../components/core/simple-providers"
import { usePathname } from "next/navigation"
import { Badge } from "../../../components/ui/badge"
import { Copy } from 'lucide-react'
import { Button } from "../../../components/ui/button"
import { useEffect } from "react"
import useSWR from 'swr'
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { useCurrentOrganization } from "@/lib/swr-config"
import { useSubscription } from "@/hooks/useSubscription"
import { gradientTokens } from "../../../lib/design-tokens"
import { Skeleton } from "@/components/ui/skeleton"

interface SettingsLayoutProps {
  children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname()
  const { setPageTitle } = usePageTitle()
  const { currentOrganizationId } = useOrganizationStore();
  
  // Use the proper authenticated hook
  const { data, error, isLoading } = useCurrentOrganization(currentOrganizationId);
  const currentOrganization = data?.organizations?.[0];
  
  // Use subscription hook for plan data
  const { currentPlan, isLoading: isSubscriptionLoading } = useSubscription();
  const planName = currentPlan?.name || 'Free';

  useEffect(() => {
    setPageTitle("Settings")
  }, [setPageTitle])

  const tabs = [
    { name: "Organization", href: "/dashboard/settings" },
    { name: "Team", href: "/dashboard/settings/team" },
    { name: "Account", href: "/dashboard/settings/account" },
  ]
  
  if (isLoading) {
    return (
        <div className="max-w-full mx-auto py-4">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <Skeleton className="h-6 w-20" />
            </div>
        </div>
    )
  }

  return (
    <div className="max-w-full mx-auto py-4">
      {/* Minimal Organization Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{currentOrganization?.name || "My Organization"}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">ID:</span>
              <code className="text-xs bg-muted px-2 py-1 rounded font-mono text-muted-foreground">
                {currentOrganization?.organization_id || "org_id_placeholder"}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (navigator.clipboard && currentOrganization?.organization_id) {
                    navigator.clipboard.writeText(currentOrganization.organization_id)
                  }
                }}
                className="h-5 w-5 p-0"
              >
                <Copy className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={gradientTokens.primary}>
            {isSubscriptionLoading ? "..." : planName} Plan
          </Badge>
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