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
  
  // Use the optimized hook
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

  if (error) {
    return (
        <div className="max-w-full mx-auto py-4">
            <div className="text-center text-muted-foreground">
                Failed to load organization settings
            </div>
        </div>
    )
  }

  return (
    <div className="max-w-full mx-auto py-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">
              {currentOrganization?.name || 'Organization Settings'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your organization preferences and team settings
            </p>
          </div>
        </div>
        <Badge 
          variant="secondary" 
          className={cn(
            "text-xs font-medium px-3 py-1",
            gradientTokens.text.primary
          )}
        >
          {planName}
        </Badge>
      </div>

      <div className="border-b border-border mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                "py-2 px-1 border-b-2 font-medium text-sm transition-colors",
                pathname === tab.href
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
              )}
            >
              {tab.name}
            </Link>
          ))}
        </nav>
      </div>

      {children}
    </div>
  )
} 