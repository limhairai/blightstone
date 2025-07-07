import { formatCurrency } from "../../lib/utils"
import { Building2, CreditCard, Wallet, TrendingUp } from "lucide-react"
import { useBusinessManagers, useAdAccounts } from "../../lib/swr-config"

export function BusinessesMetrics() {
  const { data: businesses = [], isLoading: businessesLoading } = useBusinessManagers()
  const { data: accounts = [], isLoading: accountsLoading } = useAdAccounts(null)
  
  if (businessesLoading || accountsLoading) {
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
  
  const totalBusinesses = businesses.length
  const activeBusinesses = businesses.filter((b: any) => b.status === "active").length
  const pendingBusinesses = businesses.filter((b: any) => b.status === "pending").length
  const totalBalance = accounts.reduce((total: any, account: any) => total + (account.balance || 0), 0)
  const totalAccounts = accounts.length
  const totalSpend = accounts.reduce((total: any, account: any) => total + (account.spent || 0), 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Businesses */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="h-8 w-8 rounded-md bg-[#c4b5fd]/10 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-[#c4b5fd]" />
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{totalBusinesses}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
        </div>
        <div className="mt-3">
          <div className="text-sm font-medium">Businesses</div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-[#00c853] mr-1.5"></div>
              <span className="text-xs text-muted-foreground">{activeBusinesses} active</span>
            </div>
            {pendingBusinesses > 0 && (
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1.5"></div>
                <span className="text-xs text-muted-foreground">{pendingBusinesses} pending</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ad Accounts */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="h-8 w-8 rounded-md bg-blue-500/10 flex items-center justify-center">
            <CreditCard className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{totalAccounts}</div>
            <div className="text-xs text-muted-foreground">Accounts</div>
          </div>
        </div>
        <div className="mt-3">
          <div className="text-sm font-medium">Ad Accounts</div>
          <div className="text-xs text-muted-foreground mt-1">Across all businesses</div>
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
          <div className="text-xs text-muted-foreground mt-1">Combined across accounts</div>
        </div>
      </div>

      {/* Monthly Spend */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="h-8 w-8 rounded-md bg-purple-500/10 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">${formatCurrency(totalSpend)}</div>
            <div className="text-xs text-muted-foreground">This month</div>
          </div>
        </div>
        <div className="mt-3">
          <div className="text-sm font-medium">Monthly Spend</div>
          <div className="flex items-center mt-1">
            <TrendingUp className="h-3 w-3 text-emerald-500 mr-1" />
            <span className="text-xs text-emerald-500">+12.5%</span>
            <span className="text-xs text-muted-foreground ml-1">vs last month</span>
          </div>
        </div>
      </div>
    </div>
  )
}
