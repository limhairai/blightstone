"use client"

import { ArrowDownIcon, ArrowUpIcon, ChevronRightIcon } from "lucide-react"
import Link from "next/link"

interface Transaction {
  id: string
  type: "deposit" | "withdrawal" | "transfer" | "ad-account-top-up"
  description: string
  amount: number
  date: string
  account: string
  status?: "completed" | "pending" | "failed"
}

export function RecentTransactions() {
  // Mock data
  const transactions: Transaction[] = [
    {
      id: "tx1",
      type: "ad-account-top-up",
      description: "Meta Ads",
      amount: 251.77,
      date: "2025-05-22",
      account: "Meta Ads Primary",
    },
    {
      id: "tx2",
      type: "ad-account-top-up",
      description: "Meta Ads",
      amount: 531.45,
      date: "2025-05-21",
      account: "Meta Ads Secondary",
    },
    {
      id: "tx3",
      type: "ad-account-top-up",
      description: "Meta Ads",
      amount: 213.52,
      date: "2025-05-20",
      account: "Meta Ads Campaign",
    },
    {
      id: "tx4",
      type: "deposit",
      description: "Wallet",
      amount: 1025.15,
      date: "2025-05-19",
      account: "Main Wallet",
    },
    {
      id: "tx5",
      type: "ad-account-top-up",
      description: "Meta Ads",
      amount: 146.96,
      date: "2025-05-18",
      account: "Meta Ads Promotions",
    },
  ]

  // Get transaction icon based on type
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-950/30 text-[#34D197]">
            <ArrowDownIcon className="h-4 w-4" />
          </div>
        )
      case "withdrawal":
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-950/30 text-[#F56565]">
            <ArrowUpIcon className="h-4 w-4" />
          </div>
        )
      case "transfer":
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-950/30 text-blue-400">
            <ArrowUpIcon className="h-4 w-4" />
          </div>
        )
      case "ad-account-top-up":
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-950/30 text-[#F56565]">
            <ArrowUpIcon className="h-4 w-4" />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex items-center justify-between p-4">
        <h3 className="text-lg font-semibold">Transactions</h3>
        <Link
          href="/dashboard/wallet/transactions"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          See all <ChevronRightIcon className="ml-1 h-4 w-4" />
        </Link>
      </div>
      <div className="space-y-4 p-4 pt-0">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {getTransactionIcon(transaction.type)}
              <div>
                <p className="text-sm font-medium leading-none">{transaction.description}</p>
                <p className="text-sm text-muted-foreground">
                  {transaction.type === "ad-account-top-up" ? "Ad Account Top-up" : "Deposit"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-medium ${transaction.type === "deposit" ? "text-[#34D197]" : ""}`}>
                {transaction.type === "deposit" ? "+" : ""}${transaction.amount}
              </p>
              <p className="text-xs text-muted-foreground">{transaction.account}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
