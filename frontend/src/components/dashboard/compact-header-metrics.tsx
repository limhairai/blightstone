"use client"

import useSWR from 'swr'
import { formatCurrency } from "@/lib/utils"
import { TrendingUp, Wallet, CreditCard, Loader2 } from "lucide-react"
import { useOrganizationStore } from '@/lib/stores/organization-store'

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function CompactHeaderMetrics() {
  const { currentOrganizationId } = useOrganizationStore();
  const { data: accData, isLoading } = useSWR(
    currentOrganizationId ? `/api/ad-accounts?organization_id=${currentOrganizationId}` : null,
    fetcher
  );

  const accounts = accData?.accounts || [];
  const totalAccounts = accounts.length
  const activeAccounts = accounts.filter((account) => account.status === "active").length
  const totalBalance = accounts.reduce((total, account) => total + (account.balance_cents ? account.balance_cents / 100 : 0), 0)

  if (isLoading) {
    return (
      <div className="flex items-center gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-2 animate-pulse">
            <div className="h-8 w-8 rounded-md bg-muted"></div>
            <div>
              <div className="h-4 w-10 rounded-md bg-muted mb-1"></div>
              <div className="h-3 w-12 rounded-md bg-muted"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }
  
  return (
    <div className="flex items-center gap-6">
      {/* Total Accounts */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-md bg-blue-500/10 flex items-center justify-center">
          <CreditCard className="h-4 w-4 text-blue-500" />
        </div>
        <div>
          <div className="text-sm font-medium text-foreground">{totalAccounts}</div>
          <div className="text-xs text-muted-foreground">Accounts</div>
        </div>
      </div>

      {/* Active Accounts */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-md bg-emerald-500/10 flex items-center justify-center">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
        </div>
        <div>
          <div className="text-sm font-medium text-foreground">{activeAccounts}</div>
          <div className="text-xs text-muted-foreground">Active</div>
        </div>
      </div>

      {/* Total Balance */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-md bg-purple-500/10 flex items-center justify-center">
          <Wallet className="h-4 w-4 text-purple-500" />
        </div>
        <div>
          <div className="text-sm font-medium text-foreground">{formatCurrency(totalBalance)}</div>
          <div className="text-xs text-muted-foreground">Balance</div>
        </div>
      </div>
    </div>
  )
}
