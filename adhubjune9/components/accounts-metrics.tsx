import { MOCK_ACCOUNTS } from "@/data/mock-accounts"
import { formatCurrency } from "@/utils/format"
import { CreditCard, FolderKanban, Wallet } from "lucide-react"

export default function AccountsMetrics() {
  const totalAccounts = MOCK_ACCOUNTS.length
  const totalBalance = MOCK_ACCOUNTS.reduce((total, account) => total + account.balance, 0)
  const businesses = 3
  const accountLimit = 50

  const metrics = [
    {
      title: "Total accounts",
      value: totalAccounts.toString(),
      limit: accountLimit.toString(),
      percentage: (totalAccounts / accountLimit) * 100,
      icon: CreditCard,
      trend: null,
    },
    {
      title: "Businesses",
      value: businesses.toString(),
      icon: FolderKanban,
      trend: null,
    },
    {
      title: "Total balance",
      value: `$${formatCurrency(totalBalance)} USD`,
      icon: Wallet,
      trend: null,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 mb-4">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:border-border/60"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">{metric.title}</p>
              <div className="flex items-baseline">
                <h3 className="text-2xl font-bold tracking-tight text-foreground">
                  {metric.value}
                  {metric.limit && (
                    <span className="ml-1 text-sm font-medium text-muted-foreground">/ {metric.limit}</span>
                  )}
                </h3>
              </div>
              {metric.percentage !== undefined && (
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted mt-2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] transition-all duration-500"
                    style={{ width: `${metric.percentage}%` }}
                  />
                </div>
              )}
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <metric.icon className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
