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
          {/* Organization Avatar */}
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg ${gradientTokens.avatar}`}>
            {currentOrganization?.name 
              ? currentOrganization.name.split(' ').map((word: string) => word.charAt(0)).join('').slice(0, 2).toUpperCase()
              : 'ORG'
            }
          </div>
          
          {/* Organization Info */}
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">
                {currentOrganization?.name || 'Organization Settings'}
              </h1>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-accent"
                onClick={() => {
                  if (currentOrganization?.organization_id) {
                    navigator.clipboard.writeText(currentOrganization.organization_id);
                    // You could add a toast here if needed
                  }
                }}
              >
                <Copy className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Manage your organization preferences and team settings
            </p>
          </div>
        </div>
        
        {/* Plan Badge */}
        <div className="flex items-center gap-3">
          <Badge 
            variant="secondary" 
            className={cn(
              "text-xs font-medium px-3 py-1.5 bg-gradient-to-r from-[#b4a0ff]/10 to-[#ffb4a0]/10 border-[#b4a0ff]/20 text-foreground",
              "hover:from-[#b4a0ff]/20 hover:to-[#ffb4a0]/20 transition-all duration-200"
            )}
          >
            <span className="w-2 h-2 bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] rounded-full mr-2"></span>
            {planName}
          </Badge>
        </div>
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