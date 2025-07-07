"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { formatCurrency } from "../../utils/format"
import { ChevronUp, ChevronDown, Wallet, Clock } from "lucide-react"
import { useOrganizationStore } from '@/lib/stores/organization-store'
import { Skeleton } from "../ui/skeleton"
import { useCurrentOrganization } from '@/lib/swr-config'

interface BalanceItem {
  id: string
  name: string
  description: string
  amount: number
  icon: React.ReactNode
  color: string
}

export function BusinessBalancesTable() {
  const { currentOrganizationId } = useOrganizationStore()
  const [isExpanded, setIsExpanded] = useState(true)

  // Use optimized hooks instead of direct SWR calls
  const { data: orgData, isLoading: isOrgLoading } = useCurrentOrganization(currentOrganizationId);

  const organization = orgData?.organizations?.[0];
  const isLoading = isOrgLoading;

  // Calculate balances
  const totalBalance = (organization?.balance_cents ?? 0) / 100;
  const reservedBalance = (organization?.reserved_balance_cents ?? 0) / 100;
  const unallocatedBalance = totalBalance; // All balance is unallocated since we're not tracking individual BM allocations

  // Create balance items array
  const balanceItems: BalanceItem[] = [
    {
      id: "unallocated",
      name: "Unallocated Balance",
      description: "Available for ad account funding",
      amount: unallocatedBalance,
      icon: <Wallet className="h-4 w-4" />,
      color: "text-green-600"
    }
  ];

  // Only show reserved balance if it exists
  if (reservedBalance > 0) {
    balanceItems.push({
      id: "reserved",
      name: "Processing Balance",
      description: "Funds being allocated to accounts",
      amount: reservedBalance,
      icon: <Clock className="h-4 w-4" />,
      color: "text-orange-600"
    });
  }
  
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
          <CardTitle className="text-base font-semibold text-foreground">Wallet Balance Breakdown</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="h-8 w-8 p-0">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-0">
          {/* Balance Items */}
          <div className="divide-y divide-border">
            {balanceItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-muted/20 transition-colors"
              >
                {/* Balance Info */}
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted/30 ${item.color}`}>
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right">
                  <div className={`font-semibold ${item.color}`}>{formatCurrency(item.amount)}</div>
                  <div className="text-xs text-muted-foreground">{formatCurrency(item.amount)} USD</div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="px-6 py-4 bg-muted/10 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Total Balance</span>
              <span className="text-sm font-semibold text-foreground">{formatCurrency(totalBalance)}</span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
} 