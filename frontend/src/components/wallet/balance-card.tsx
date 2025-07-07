"use client"

import { Wallet } from 'lucide-react'
import { formatCurrency } from "../../utils/format"
import { typographyTokens } from "../../lib/design-tokens"
import { useOrganizationStore } from '@/lib/stores/organization-store'
import { useCurrentOrganization } from '@/lib/swr-config'

interface BalanceCardProps {
  balance?: number
  growth?: number
}

export function BalanceCard({ balance, growth }: BalanceCardProps) {
  const { currentOrganizationId } = useOrganizationStore();
  // Use the proper authenticated hook
  const { data: orgData } = useCurrentOrganization(currentOrganizationId);

  const organization = orgData?.organizations?.[0];
  const availableBalance = (organization?.balance_cents ?? 0) / 100; // Use balance_cents which is available balance
  const totalBalance = (organization?.total_balance_cents ?? 0) / 100;
  const reservedBalance = (organization?.reserved_balance_cents ?? 0) / 100;
  
  const actualBalance = balance ?? availableBalance
  const actualGrowth = growth ?? 0 // TODO: Calculate from transaction history
  
  return (
    <div className="bg-muted/30 border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-baseline gap-3">
            <span className={typographyTokens.patterns.balanceLarge}>{formatCurrency(actualBalance)}</span>
            {actualGrowth > 0 && (
              <span className={`${typographyTokens.patterns.bodySmall} text-[#b4a0ff] font-medium`}>
                +{actualGrowth}% this month
              </span>
            )}
          </div>
          <div className="space-y-1">
            <p className={typographyTokens.patterns.mutedMedium}>Available for ad account funding</p>
            {reservedBalance > 0 && (
              <p className={`${typographyTokens.patterns.bodySmall} text-orange-600`}>
                {formatCurrency(reservedBalance)} processing for allocation
              </p>
            )}
          </div>
        </div>
        <div className="h-12 w-12 rounded-lg bg-muted/50 flex items-center justify-center border">
          <Wallet className="h-6 w-6 text-[#b4a0ff]" />
        </div>
      </div>
    </div>
  )
}
