import { MOCK_ACCOUNTS, MOCK_FINANCIAL_DATA } from "@/lib/mock-data"
import { formatCurrency } from "@/lib/utils"
import { TrendingUp, Wallet, CreditCard } from "lucide-react"

export function CompactHeaderMetrics() {
  const totalAccounts = MOCK_ACCOUNTS.length
  const activeAccounts = MOCK_ACCOUNTS.filter((account) => account.status === "active").length
  const totalBalance = MOCK_ACCOUNTS.reduce((total, account) => total + account.balance, 0)

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
          <div className="text-sm font-medium text-foreground">${formatCurrency(totalBalance)}</div>
          <div className="text-xs text-muted-foreground">Balance</div>
        </div>
      </div>
    </div>
  )
}
