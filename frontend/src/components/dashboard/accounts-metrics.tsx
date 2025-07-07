import { formatCurrency } from "../../lib/utils"
import { CreditCard, Wallet, TrendingUp, AlertCircle } from "lucide-react"
import { useAdAccounts } from "../../lib/swr-config"

export function AccountsMetrics() {
  const { data: accounts = [], isLoading } = useAdAccounts()
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
            <div className="h-16 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    )
  }
  
  const totalAccounts = accounts.length
  const activeAccounts = accounts.filter((account: any) => account.status === "active").length
  const totalBalance = accounts.reduce((total: any, account: any) => total + (account.balance || 0), 0)
  const totalSpent = accounts.reduce((total: any, account: any) => total + (account.spent || 0), 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Accounts */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="h-8 w-8 rounded-md bg-blue-500/10 flex items-center justify-center">
            <CreditCard className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{totalAccounts}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
        </div>
        <div className="mt-3">
          <div className="text-sm font-medium">Ad Accounts</div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-[#00c853] mr-1.5"></div>
              <span className="text-xs text-muted-foreground">{activeAccounts} active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Total Balance */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="h-8 w-8 rounded-md bg-emerald-500/10 flex items-center justify-center">
            <Wallet className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">${formatCurrency(totalBalance)}</div>
            <div className="text-xs text-muted-foreground">USD</div>
          </div>
        </div>
        <div className="mt-3">
          <div className="text-sm font-medium">Total Balance</div>
          <div className="text-xs text-muted-foreground mt-1">Across all accounts</div>
        </div>
      </div>

      {/* Total Spent */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="h-8 w-8 rounded-md bg-purple-500/10 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">${formatCurrency(totalSpent)}</div>
            <div className="text-xs text-muted-foreground">This month</div>
          </div>
        </div>
        <div className="mt-3">
          <div className="text-sm font-medium">Total Spent</div>
          <div className="flex items-center mt-1">
            <TrendingUp className="h-3 w-3 text-emerald-500 mr-1" />
            <span className="text-xs text-emerald-500">+8.2%</span>
            <span className="text-xs text-muted-foreground ml-1">vs last month</span>
          </div>
        </div>
      </div>

      {/* Issues */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="h-8 w-8 rounded-md bg-orange-500/10 flex items-center justify-center">
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">2</div>
            <div className="text-xs text-muted-foreground">Issues</div>
          </div>
        </div>
        <div className="mt-3">
          <div className="text-sm font-medium">Account Issues</div>
          <div className="text-xs text-muted-foreground mt-1">Require attention</div>
        </div>
      </div>
    </div>
  )
}
