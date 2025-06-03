"use client"

interface AccountsSummaryProps {
  totalAccounts: number
  metaAccounts: number
  tiktokAccounts: number
  totalBalance: number
  metaBalance: number
  tiktokBalance: number
}

export function AccountsSummary({
  totalAccounts,
  metaAccounts,
  tiktokAccounts,
  totalBalance,
  metaBalance,
  tiktokBalance,
}: AccountsSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* All Accounts */}
      <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222] rounded-lg p-4 shadow-sm">
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">All accounts</div>
        <div className="text-2xl font-bold">{totalAccounts}</div>
        <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">Total balance</div>
        <div className="text-lg font-semibold">${totalBalance.toFixed(2)} USD</div>
      </div>

      {/* Meta Accounts */}
      <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222] rounded-lg p-4 shadow-sm">
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Meta accounts</div>
        <div className="text-2xl font-bold">{metaAccounts}</div>
        <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">Total balance</div>
        <div className="text-lg font-semibold">${metaBalance.toFixed(2)} USD</div>
      </div>

      {/* TikTok Accounts */}
      <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222] rounded-lg p-4 shadow-sm">
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">TikTok accounts</div>
        <div className="text-2xl font-bold">{tiktokAccounts}</div>
        <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">Total balance</div>
        <div className="text-lg font-semibold">${tiktokBalance.toFixed(2)} USD</div>
      </div>
    </div>
  )
} 