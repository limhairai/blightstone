"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/utils/format"
import { Filter, Download, ArrowUpRight, CreditCard, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Transaction {
  id: string
  type: "top_up" | "spend" | "transfer"
  method: "credit_card" | "bank_transfer" | "ad_account"
  description: string
  amount: number
  date: string
  status: "completed" | "pending" | "failed"
  account?: string
}

export function WalletTransactions() {
  const [activeTab, setActiveTab] = useState("recent")
  const [timeFilter, setTimeFilter] = useState("all")

  const transactions: Transaction[] = [
    {
      id: "txn_001",
      type: "top_up",
      method: "credit_card",
      description: "Top up - Credit Card",
      amount: 500.0,
      date: "Apr 28, 2025",
      status: "completed",
    },
    {
      id: "txn_002",
      type: "spend",
      method: "ad_account",
      description: "Ad Account Spend",
      amount: -120.5,
      date: "Apr 25, 2025",
      status: "completed",
      account: "Primary Campaign Account",
    },
    {
      id: "txn_003",
      type: "top_up",
      method: "bank_transfer",
      description: "Top up - Bank Transfer",
      amount: 1000.0,
      date: "Apr 22, 2025",
      status: "pending",
    },
    {
      id: "txn_004",
      type: "spend",
      method: "ad_account",
      description: "Ad Account Spend",
      amount: -85.75,
      date: "Apr 20, 2025",
      status: "completed",
      account: "E-commerce Campaigns",
    },
    {
      id: "txn_005",
      type: "top_up",
      method: "credit_card",
      description: "Top up - Credit Card",
      amount: 750.0,
      date: "Apr 18, 2025",
      status: "completed",
    },
    {
      id: "txn_006",
      type: "spend",
      method: "ad_account",
      description: "Ad Account Spend",
      amount: -210.25,
      date: "Apr 15, 2025",
      status: "completed",
      account: "Brand Awareness Account",
    },
  ]

  const filteredTransactions = transactions.filter((transaction) => {
    if (activeTab === "pending") return transaction.status === "pending"
    if (activeTab === "recent") return transaction.status === "completed"
    return true // all transactions
  })

  const getTransactionIcon = (transaction: Transaction) => {
    if (transaction.type === "top_up") {
      return transaction.method === "credit_card" ? (
        <CreditCard className="h-4 w-4 text-emerald-500" />
      ) : (
        <Building2 className="h-4 w-4 text-emerald-500" />
      )
    } else {
      return <ArrowUpRight className="h-4 w-4 text-red-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-emerald-950/50 text-emerald-400 border-emerald-700">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></div>
            Completed
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-950/50 text-yellow-400 border-yellow-700">
            <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1.5"></div>
            Pending
          </Badge>
        )
      case "failed":
        return (
          <Badge className="bg-red-950/50 text-red-400 border-red-700">
            <div className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></div>
            Failed
          </Badge>
        )
      default:
        return null
    }
  }

  const tabs = [
    { id: "recent", label: "Recent" },
    { id: "pending", label: "Pending" },
    { id: "all", label: "All Transactions" },
  ]

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">Transactions</CardTitle>
            <p className="text-sm text-muted-foreground">Recent activity in your wallet</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "text-sm px-3 py-1.5 rounded-md transition-colors",
                  activeTab === tab.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                )}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-accent">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-32 h-8 bg-background border-border text-foreground">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all" className="text-popover-foreground hover:bg-accent">
                  All Time
                </SelectItem>
                <SelectItem value="7d" className="text-popover-foreground hover:bg-accent">
                  Last 7 days
                </SelectItem>
                <SelectItem value="30d" className="text-popover-foreground hover:bg-accent">
                  Last 30 days
                </SelectItem>
                <SelectItem value="90d" className="text-popover-foreground hover:bg-accent">
                  Last 90 days
                </SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-accent">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Table Header */}
        <div className="grid grid-cols-[1fr,120px,100px] gap-4 px-6 py-3 border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          <div>Transaction</div>
          <div className="text-right">Amount</div>
          <div className="text-right">Status</div>
        </div>

        {/* Transaction List */}
        <div className="divide-y divide-border">
          {filteredTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="grid grid-cols-[1fr,120px,100px] gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
            >
              {/* Transaction Details */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  {getTransactionIcon(transaction)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-foreground text-sm">{transaction.description}</div>
                  <div className="text-xs text-muted-foreground">{transaction.date}</div>
                  {transaction.account && (
                    <div className="text-xs text-muted-foreground truncate">→ {transaction.account}</div>
                  )}
                </div>
              </div>

              {/* Amount */}
              <div className="text-right">
                <span
                  className={cn("font-medium text-sm", transaction.amount > 0 ? "text-emerald-400" : "text-red-400")}
                >
                  {transaction.amount > 0 ? "+" : ""}${formatCurrency(Math.abs(transaction.amount))}
                </span>
              </div>

              {/* Status */}
              <div className="text-right">{getStatusBadge(transaction.status)}</div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground">No transactions found</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
