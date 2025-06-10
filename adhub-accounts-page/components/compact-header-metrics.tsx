import { MOCK_ACCOUNTS } from "@/data/mock-accounts"

export function CompactHeaderMetrics() {
  const totalAccounts = MOCK_ACCOUNTS.length
  const totalBalance = MOCK_ACCOUNTS.reduce((total, account) => total + account.balance, 0)
  const accountLimit = 50

  return (
    <div className="flex items-center gap-8 text-sm">
      <div>
        <span className="text-muted-foreground uppercase tracking-wide text-xs font-medium">Total Accounts</span>
        <div className="text-foreground font-semibold">
          {totalAccounts} / {accountLimit}
        </div>
      </div>
      <div>
        <span className="text-muted-foreground uppercase tracking-wide text-xs font-medium">Total Balance</span>
        <div className="text-foreground font-semibold">${totalBalance.toLocaleString()}</div>
      </div>
    </div>
  )
}
