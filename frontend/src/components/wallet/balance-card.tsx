"use client"

import { Wallet } from 'lucide-react'
import { formatCurrency } from "../../utils/format"
import { typographyTokens } from "../../lib/design-tokens"
import useSWR from 'swr'
import { useOrganizationStore } from '@/lib/stores/organization-store'

interface BalanceCardProps {
  balance?: number
  growth?: number
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function BalanceCard({ balance, growth }: BalanceCardProps) {
  const { currentOrganizationId } = useOrganizationStore();
  const { data: orgData } = useSWR(
    currentOrganizationId ? `/api/organizations?id=${currentOrganizationId}` : null,
    fetcher
  );

  const walletBalance = orgData?.organizations?.[0]?.balance ?? 0;
  
  const actualBalance = balance ?? walletBalance
  const actualGrowth = growth ?? 0 // TODO: Calculate from transaction history
  
  return (
    <div className="bg-muted/30 border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-baseline gap-3">
            <span className={typographyTokens.patterns.balanceLarge}>${formatCurrency(actualBalance)}</span>
            {actualGrowth > 0 && (
              <span className={`${typographyTokens.patterns.bodySmall} text-[#b4a0ff] font-medium`}>
                +{actualGrowth}% this month
              </span>
            )}
          </div>
          <p className={typographyTokens.patterns.mutedMedium}>Available for ad campaigns and funding</p>
        </div>
        <div className="h-12 w-12 rounded-lg bg-muted/50 flex items-center justify-center border">
          <Wallet className="h-6 w-6 text-[#b4a0ff]" />
        </div>
      </div>
    </div>
  )
}
