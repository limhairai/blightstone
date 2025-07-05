"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { formatCurrency, getInitials } from "../../utils/format"
import { getBusinessAvatarClasses } from "../../lib/design-tokens"
import { ChevronUp, ChevronDown, MoreHorizontal } from "lucide-react"
import { useRouter } from "next/navigation"
import { useOrganizationStore } from '@/lib/stores/organization-store'
import { useTheme } from "next-themes"
import { Skeleton } from "../ui/skeleton"
import { useCurrentOrganization, useBusinessManagers } from '@/lib/swr-config'

interface BusinessBalance {
  id: string
  name: string
  logo: string
  balance: number
  allocationPercent: number
  accounts: number
  bmId?: string
  isUnallocated?: boolean
}

export function BusinessBalancesTable() {
  const router = useRouter()
  const { theme } = useTheme()
  const { currentOrganizationId } = useOrganizationStore()
  const [isExpanded, setIsExpanded] = useState(true)

  // Use optimized hooks instead of direct SWR calls
  const { data: orgData, isLoading: isOrgLoading } = useCurrentOrganization(currentOrganizationId);
  const { data: businessManagersData, isLoading: areBMsLoading } = useBusinessManagers();

  const organization = orgData?.organizations?.[0];
  const businessManagers = businessManagersData?.business_managers || [];
  const isLoading = isOrgLoading || areBMsLoading;

  // Calculate total balance from all business managers to determine percentages
  // For now, since we don't have individual BM balances, we'll show the total balance as unallocated
  const totalBalance = (organization?.balance_cents ?? 0) / 100;
  const totalAllocated = 0; // TODO: Implement individual BM balance tracking
  const unallocatedAmount = Math.max(0, totalBalance - totalAllocated)

  // Convert business managers to BusinessBalance format
  const businessBalances: BusinessBalance[] = [
    {
      id: "unallocated",
      name: "Unallocated",
      logo: "💰",
      balance: unallocatedAmount,
      allocationPercent: totalBalance > 0 ? (unallocatedAmount / totalBalance) * 100 : 0,
      accounts: 0,
      isUnallocated: true,
    },
    ...businessManagers
      .filter(bm => bm.status === "active")
      .map(bm => ({
        id: bm.id.toString(),
        name: bm.name,
        logo: getInitials(bm.name),
        balance: 0, // TODO: Implement individual BM balance tracking
        allocationPercent: 0, // TODO: Calculate based on actual allocation
        accounts: bm.metadata?.ad_accounts_count || 0,
        bmId: bm.dolphin_id,
      }))
  ]

  const handleBusinessManagerClick = (businessManager: BusinessBalance) => {
    if (!businessManager.isUnallocated) {
      // For now, redirect to business managers page or show details
      router.push(`/dashboard/business-managers`)
    }
  }

  // Determine the current theme mode for avatar classes
  const currentMode = theme === "light" ? "light" : "dark"
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <Skeleton className="h-6 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-2" />
          <Skeleton className="h-10 w-full mb-2" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground">Business Manager balances</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="h-8 w-8 p-0">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-0">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-border text-sm text-muted-foreground font-medium">
            <div className="col-span-6">Asset</div>
            <div className="col-span-3 text-right">Balance</div>
            <div className="col-span-2 text-right">Allocation %</div>
            <div className="col-span-1"></div>
          </div>

          {/* Business Manager Rows */}
          <div className="divide-y divide-border">
            {businessBalances.map((businessManager) => (
              <div
                key={businessManager.id}
                className={`grid grid-cols-12 gap-4 px-6 py-4 transition-colors ${
                  businessManager.isUnallocated ? "hover:bg-muted/20" : "hover:bg-muted/30 cursor-pointer"
                }`}
                onClick={() => handleBusinessManagerClick(businessManager)}
              >
                {/* Asset Info */}
                <div className="col-span-6 flex items-center gap-3">
                  <div className="relative">
                    {businessManager.isUnallocated ? (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                        {businessManager.logo}
                      </div>
                    ) : (
                      <div className={getBusinessAvatarClasses('md', currentMode)}>
                        {businessManager.logo}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{businessManager.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {businessManager.isUnallocated ? (
                        "Ready for distribution"
                      ) : (
                        <>
                          {businessManager.accounts} account{businessManager.accounts !== 1 ? "s" : ""} 
                          {businessManager.bmId && ` • ${businessManager.bmId}`}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Balance */}
                <div className="col-span-3 flex flex-col items-end justify-center">
                  <div className="font-medium text-foreground">{formatCurrency(businessManager.balance)}</div>
                  <div className="text-xs text-muted-foreground">{formatCurrency(businessManager.balance)} USD</div>
                </div>

                {/* Allocation % */}
                <div className="col-span-2 flex items-center justify-end">
                  <div className="font-medium text-foreground">{businessManager.allocationPercent.toFixed(2)}%</div>
                </div>

                {/* Actions */}
                <div className="col-span-1 flex items-center justify-end">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
} 