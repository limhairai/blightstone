import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/utils/format"
import { CreditCard, CheckCircle, Clock, TrendingUp } from "lucide-react"

export function WalletQuickStats() {
  const stats = [
    {
      label: "Total Accounts",
      value: "12",
      icon: CreditCard,
    },
    {
      label: "Active Accounts",
      value: "8",
      icon: CheckCircle,
    },
    {
      label: "Pending Transactions",
      value: "3",
      icon: Clock,
    },
    {
      label: "Monthly Spend",
      value: `$${formatCurrency(2450.0)}`,
      icon: TrendingUp,
    },
  ]

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-foreground">Quick Stats</CardTitle>
        <p className="text-sm text-muted-foreground">Overview of your wallet activity</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-md bg-muted/50 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
              <span className="text-lg font-semibold text-foreground">{stat.value}</span>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
