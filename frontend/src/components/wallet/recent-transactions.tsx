"use client"

import { ArrowDownIcon, ArrowUpIcon, ChevronRightIcon } from "lucide-react"
import Link from "next/link"
import { layout } from "../../lib/layout-utils"
import { formatCurrency, transactionColors } from "../../utils/format"

interface Transaction {
  id: string
  type: "deposit" | "withdrawal" | "transfer" | "ad-account-top-up"
  description: string
  amount: number
  date: string
  account: string
  status?: "completed" | "pending" | "failed"
}

interface RecentTransactionsProps {
  limit?: number
}

export function RecentTransactions({ limit = 5 }: RecentTransactionsProps) {
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
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${transactionColors.deposit.bg}`}>
            <ArrowDownIcon className={`h-4 w-4 ${transactionColors.deposit.icon}`} />
          </div>
        )
      case "withdrawal":
        return (
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${transactionColors.withdrawal.bg}`}>
            <ArrowUpIcon className={`h-4 w-4 ${transactionColors.withdrawal.icon}`} />
          </div>
        )
      case "transfer":
        return (
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${transactionColors.transfer.bg}`}>
            <ArrowUpIcon className={`h-4 w-4 ${transactionColors.transfer.icon}`} />
          </div>
        )
      case "ad-account-top-up":
        return (
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${transactionColors.spend.bg}`}>
            <ArrowUpIcon className={`h-4 w-4 ${transactionColors.spend.icon}`} />
          </div>
        )
      default:
        return null
    }
  }

  const getAmountColor = (type: string) => {
    return type === "deposit" ? "text-green-600" : "text-foreground"
  }

  const getAmountPrefix = (type: string) => {
    return type === "deposit" ? "+" : "-"
  }

  return (
    <div className="space-y-4">
      <div className={layout.flexBetween}>
        <h3 className="text-lg font-semibold">Transactions</h3>
        <Link
          href="/dashboard/wallet/transactions"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          See all <ChevronRightIcon className="ml-1 h-4 w-4" />
        </Link>
      </div>
      <div className={layout.stackMedium}>
        {transactions.slice(0, limit).map((transaction) => (
          <div key={transaction.id} className={layout.flexBetween}>
            <div className="flex items-center gap-3">
              {getTransactionIcon(transaction.type)}
              <div>
                <p className="text-sm font-medium text-foreground">{transaction.description}</p>
                <p className="text-xs text-muted-foreground">{transaction.account}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-medium ${getAmountColor(transaction.type)}`}>
                {getAmountPrefix(transaction.type)}{formatCurrency(transaction.amount)}
              </p>
              <p className="text-xs text-muted-foreground">{transaction.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
