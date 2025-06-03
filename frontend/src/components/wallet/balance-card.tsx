"use client"

import { Wallet } from 'lucide-react'

interface BalanceCardProps {
  balance?: number
}

export function BalanceCard({ balance = 5750.0 }: BalanceCardProps) {
  return (
    <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222] rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">${balance.toFixed(2)}</span>
            <span className="text-xs text-[#6941c6]/70 dark:text-[#b4a0ff]/70">+12.5% this month</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-muted-foreground">Available for ad campaigns and funding</p>
        </div>
        <div className="h-10 w-10 rounded-full bg-[#f9f5ff] dark:bg-[#1A1A1A] flex items-center justify-center border border-[#e9d7fe] dark:border-[#2A2A2A]">
          <Wallet className="h-5 w-5 text-[#6941c6] dark:text-[#b4a0ff]" />
        </div>
      </div>
    </div>
  )
}
