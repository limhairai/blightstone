"use client"

import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/utils/format"
import { DollarSign, CreditCard, TrendingUp, AlertCircle } from "lucide-react"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { useAuth } from "@/contexts/AuthContext"
import { useAdAccounts } from "@/lib/swr-config"

export function CompactHeaderMetrics() {
  const { session } = useAuth();
  const { currentOrganizationId } = useOrganizationStore();
  
  const { data: accData, isLoading } = useAdAccounts(currentOrganizationId);

  const accounts = accData?.accounts || [];
  const totalAccounts = accounts.length;
  const activeAccounts = accounts.filter((account: any) => account.status === "active").length;
  const pendingAccounts = accounts.filter((account: any) => account.status === "pending").length;
  
  // Calculate total available spend using spend_cap - amount_spent
  const totalAvailableSpend = accounts.reduce((total: number, account: any) => {
    const spendCap = (account.spend_cap_cents || 0) / 100;
    const spent = (account.spend_cents || 0) / 100;
    const availableSpend = spendCap > 0 ? Math.max(0, spendCap - spent) : (account.balance_cents || 0) / 100;
    return total + availableSpend;
  }, 0);

  // Calculate total spent
  const totalSpent = accounts.reduce((total: number, account: any) => {
    // Use spend_cents from API response
    return total + ((account.spend_cents || 0) / 100);
  }, 0);

  const metrics = [
    {
      title: "Available Spend",
      value: `${formatCurrency(totalAvailableSpend)}`,
      icon: DollarSign,
              color: "text-[#34D197]",
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
      value: `${formatCurrency(totalSpent)}`,
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border bg-card animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="h-4 w-20 bg-muted rounded"></div>
                  <div className="h-8 w-16 bg-muted rounded"></div>
                </div>
                <div className="h-9 w-9 bg-muted rounded-lg"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

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
