"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { formatCurrency, getInitials } from "../../lib/mock-data"
import { getBusinessAvatarClasses } from "../../lib/design-tokens"
import { ChevronUp, ChevronDown, MoreHorizontal } from "lucide-react"
import { useRouter } from "next/navigation"
import { useDemoState } from "../../contexts/DemoStateContext"
import { useTheme } from "next-themes"

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
  const { state } = useDemoState()
  const router = useRouter()
  const { theme } = useTheme()
  const [isExpanded, setIsExpanded] = useState(true)

  // Calculate total balance from all businesses to determine percentages
  const totalAllocated = state.businesses.reduce((sum, business) => sum + (business.totalBalance || 0), 0)
  const unallocatedAmount = Math.max(0, state.financialData.walletBalance - totalAllocated)
  const totalBalance = state.financialData.walletBalance

  // Convert businesses to BusinessBalance format
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
    ...state.businesses
      .filter(business => business.status === "active" || business.status === "pending")
      .map(business => ({
        id: business.id,
        name: business.name,
        logo: getInitials(business.name),
        balance: business.totalBalance || 0,
        allocationPercent: totalBalance > 0 ? ((business.totalBalance || 0) / totalBalance) * 100 : 0,
        accounts: business.accountsCount || 0,
        bmId: business.bmId || "",
      }))
  ]

  const handleBusinessClick = (business: BusinessBalance) => {
    if (!business.isUnallocated) {
      router.push(`/dashboard/wallet/business/${business.id}`)
    }
  }

  // Determine the current theme mode for avatar classes
  const currentMode = theme === "light" ? "light" : "dark"

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground">Business balances</CardTitle>
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

          {/* Business Rows */}
          <div className="divide-y divide-border">
            {businessBalances.map((business) => (
              <div
                key={business.id}
                className={`grid grid-cols-12 gap-4 px-6 py-4 transition-colors ${
                  business.isUnallocated ? "hover:bg-muted/20" : "hover:bg-muted/30 cursor-pointer"
                }`}
                onClick={() => handleBusinessClick(business)}
              >
                {/* Asset Info */}
                <div className="col-span-6 flex items-center gap-3">
                  <div className="relative">
                    {business.isUnallocated ? (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                        {business.logo}
                      </div>
                    ) : (
                      <div className={getBusinessAvatarClasses('md', currentMode)}>
                        {business.logo}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{business.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {business.isUnallocated ? (
                        "Ready for distribution"
                      ) : (
                        <>
                          {business.accounts} account{business.accounts !== 1 ? "s" : ""} 
                          {business.bmId && ` • ${business.bmId}`}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Balance */}
                <div className="col-span-3 flex flex-col items-end justify-center">
                  <div className="font-medium text-foreground">${formatCurrency(business.balance)}</div>
                  <div className="text-xs text-muted-foreground">${formatCurrency(business.balance)} USD</div>
                </div>

                {/* Allocation % */}
                <div className="col-span-2 flex items-center justify-end">
                  <div className="font-medium text-foreground">{business.allocationPercent.toFixed(2)}%</div>
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