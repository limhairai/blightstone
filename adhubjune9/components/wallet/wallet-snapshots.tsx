"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/utils/format"
import { ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, Send, ArrowLeftRight, Bell } from "lucide-react"

export function WalletSnapshots() {
  const accounts = [
    {
      name: "Primary",
      type: "Current account",
      balance: 5750.0,
      currency: "USD",
    },
    {
      name: "Business Reserve",
      type: "business-reserve",
      balance: 0.0,
      currency: "USD",
    },
  ]

  const actions = [
    { icon: ArrowDownToLine, label: "Deposit", variant: "outline" as const },
    { icon: ArrowUpFromLine, label: "Withdraw", variant: "outline" as const },
    { icon: ArrowRightLeft, label: "Receive", variant: "outline" as const },
    { icon: Send, label: "Send", variant: "outline" as const },
    { icon: ArrowLeftRight, label: "Between", variant: "outline" as const },
  ]

  return (
    <div className="space-y-6">
      {/* Account Snapshots */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Account snapshots</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {accounts.map((account, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
            >
              <div>
                <div className="font-medium text-foreground">{account.name}</div>
                {account.type === "Current account" ? (
                  <span className="text-xs text-[#b4a0ff]">{account.type}</span>
                ) : (
                  <span className="text-xs text-muted-foreground">{account.type}</span>
                )}
              </div>
              <div className="text-right">
                <div className="font-medium">
                  ${formatCurrency(account.balance)} {account.currency}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-5 gap-2">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant}
            size="sm"
            className="flex flex-col items-center gap-1 h-16 p-2 border-border hover:bg-muted/50"
          >
            <action.icon className="h-4 w-4" />
            <span className="text-xs">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Alerts Section */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#b4a0ff]/10">
              <Bell className="h-4 w-4 text-[#b4a0ff]" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">Alerts</div>
              <div className="text-xs text-muted-foreground">Set up and manage alerts to track fund movements</div>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">
              →
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
