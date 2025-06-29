"use client"

import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency, getTotalAccountsBalance } from "@/utils/format"
import { MOCK_ACCOUNTS } from "@/data/mock-accounts"
import { DollarSign, CreditCard, TrendingUp, AlertCircle } from "lucide-react"

export function CompactHeaderMetrics() {
  const totalBalance = getTotalAccountsBalance()
  const activeAccounts = MOCK_ACCOUNTS.filter((account) => account.status === "active").length
  const totalSpent = MOCK_ACCOUNTS.reduce((sum, account) => sum + account.spent, 0)
  const pendingAccounts = MOCK_ACCOUNTS.filter((account) => account.status === "pending").length

  const metrics = [
    {
      title: "Total Balance",
      value: `$${formatCurrency(totalBalance)}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
    {
      title: "Active Accounts",
      value: activeAccounts.toString(),
      icon: CreditCard,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      title: "Monthly Spend",
      value: `$${formatCurrency(totalSpent)}`,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
    },
    {
      title: "Pending Setup",
      value: pendingAccounts.toString(),
      icon: AlertCircle,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950/20",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <Card key={metric.title} className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{metric.title}</p>
                <p className="text-2xl font-bold text-foreground">{metric.value}</p>
              </div>
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <metric.icon className={`h-5 w-5 ${metric.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
