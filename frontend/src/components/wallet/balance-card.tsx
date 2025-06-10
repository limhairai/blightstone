"use client"

import { Wallet } from 'lucide-react'
import { formatCurrency, MOCK_FINANCIAL_DATA } from '@/lib/mock-data'
import { typographyTokens } from '@/lib/design-tokens'

interface BalanceCardProps {
  balance?: number
  growth?: number
}

export function BalanceCard({ balance = MOCK_FINANCIAL_DATA.walletBalance, growth = MOCK_FINANCIAL_DATA.monthlyGrowth }: BalanceCardProps) {
  return (
    <div className="bg-muted/30 border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-baseline gap-3">
            <span className={typographyTokens.patterns.balanceLarge}>${formatCurrency(balance)}</span>
            <span className={`${typographyTokens.patterns.bodySmall} text-[#b4a0ff] font-medium`}>+{growth}% this month</span>
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
