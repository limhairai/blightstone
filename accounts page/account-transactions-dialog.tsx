"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/utils/format"
import { ArrowUpRight, ArrowDownLeft, Calendar, DollarSign } from "lucide-react"
import type { MockAccount } from "@/types/account"

interface Transaction {
  id: string
  type: "top_up" | "withdrawal"
  amount: number
  date: string
  time: string
  status: "completed" | "pending" | "failed"
  description: string
  reference?: string
}

interface AccountTransactionsDialogProps {
  account: MockAccount | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AccountTransactionsDialog({ account, open, onOpenChange }: AccountTransactionsDialogProps) {
  if (!account) return null

  // Mock transaction data
  const transactions: Transaction[] = [
    {
      id: "txn_001",
      type: "top_up",
      amount: 1000.0,
      date: "Dec 15, 2024",
      time: "2:30 PM",
      status: "completed",
      description: "Manual top-up from main balance",
      reference: "TXN-2024-001",
    },
    {
      id: "txn_002",
      type: "top_up",
      amount: 500.0,
      date: "Dec 10, 2024",
      time: "10:15 AM",
      status: "completed",
      description: "Automatic top-up (low balance trigger)",
      reference: "TXN-2024-002",
    },
    {
      id: "txn_003",
      type: "withdrawal",
      amount: 250.0,
      date: "Dec 8, 2024",
      time: "4:45 PM",
      status: "completed",
      description: "Withdrawal to main balance",
      reference: "TXN-2024-003",
    },
    {
      id: "txn_004",
      type: "top_up",
      amount: 2000.0,
      date: "Dec 1, 2024",
      time: "9:00 AM",
      status: "completed",
      description: "Initial account funding",
      reference: "TXN-2024-004",
    },
    {
      id: "txn_005",
      type: "top_up",
      amount: 750.0,
      date: "Nov 28, 2024",
      time: "3:20 PM",
      status: "pending",
      description: "Manual top-up from main balance",
      reference: "TXN-2024-005",
    },
  ]

  const getTransactionIcon = (type: string) => {
    return type === "top_up" ? (
      <ArrowDownLeft className="h-4 w-4 text-green-600" />
    ) : (
      <ArrowUpRight className="h-4 w-4 text-blue-500" />
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            Completed
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            Pending
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            Failed
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const totalTopUps = transactions
    .filter((t) => t.type === "top_up" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0)

  const totalWithdrawals = transactions
    .filter((t) => t.type === "withdrawal" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card border-border max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-[#c4b5fd]" />
            Transaction History
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            {account.name} • {account.adAccount}
          </div>
        </DialogHeader>

        <div className="space-y-6 flex-1 overflow-hidden">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Current Balance</div>
              <div className="text-lg font-semibold text-foreground">${formatCurrency(account.balance)}</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Total Top-ups</div>
              <div className="text-lg font-semibold text-green-600">${formatCurrency(totalTopUps)}</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Total Withdrawals</div>
              <div className="text-lg font-semibold text-blue-500">${formatCurrency(totalWithdrawals)}</div>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Transaction List */}
          <div className="space-y-3 flex-1 overflow-y-auto">
            <h4 className="text-sm font-medium text-foreground">Recent Transactions</h4>
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {transaction.type === "top_up" ? "Top Up" : "Withdrawal"}
                        </span>
                        {getStatusBadge(transaction.status)}
                      </div>
                      <div className="text-xs text-muted-foreground">{transaction.description}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {transaction.date} at {transaction.time}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-sm font-semibold ${
                        transaction.type === "top_up" ? "text-green-600" : "text-blue-500"
                      }`}
                    >
                      {transaction.type === "top_up" ? "+" : "-"}${formatCurrency(transaction.amount)}
                    </div>
                    {transaction.reference && (
                      <div className="text-xs text-muted-foreground font-mono">{transaction.reference}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-border"></div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
