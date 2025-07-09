"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { formatCurrency } from "../../utils/format"
import { ChevronUp, ChevronDown, ArrowDownLeft, ArrowUpRight, ArrowRightLeft, Clock, Download, Filter } from "lucide-react"
import { useOrganizationStore } from '@/lib/stores/organization-store'
import { Skeleton } from "../ui/skeleton"
import { useTransactions } from '@/lib/swr-config'

interface TransactionHistoryProps {
  limit?: number
  showFilters?: boolean
}

export function TransactionsHistory({ limit = 10, showFilters = true }: TransactionHistoryProps) {
  const { currentOrganizationId } = useOrganizationStore()
  const [isExpanded, setIsExpanded] = useState(true)

  // Use optimized hooks instead of direct SWR calls
  const { data: transactionsData, isLoading } = useTransactions();

  const transactions = transactionsData?.transactions || [];
  const displayTransactions = limit ? transactions.slice(0, limit) : transactions;

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'topup':
        return <ArrowDownLeft className="h-4 w-4" />
      case 'withdrawal':
        return <ArrowUpRight className="h-4 w-4" />
      case 'transfer':
      case 'balance_transfer':
        return <ArrowRightLeft className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'topup':
        return "text-[#34D197]"
      case 'withdrawal':
        return "text-red-600"
      case 'transfer':
      case 'balance_transfer':
        return "text-blue-600"
      default:
        return "text-muted-foreground"
    }
  }

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case "completed":
      case "fulfilled":
        return "bg-[#34D197]"
      case "pending":
      case "processing":
        return "bg-[#FFC857]"
      case "failed":
      case "cancelled":
        return "bg-[#F56565]"
      default:
        return "bg-gray-500"
    }
  }

  const formatTransactionDescription = (transaction: any) => {
    if (transaction.description) {
      return transaction.description;
    }
    
    // Generate description based on type
    switch (transaction.type) {
      case 'deposit':
      case 'topup':
        return 'Wallet Top-up';
      case 'withdrawal':
        return 'Wallet Withdrawal';
      case 'transfer':
      case 'balance_transfer':
        return 'Balance Transfer';
      default:
        return 'Transaction';
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <Skeleton className="h-6 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground">Transactions History</CardTitle>
          <div className="flex items-center gap-2">
            {showFilters && (
              <>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                  <Filter className="h-3 w-3 mr-1" />
                  Filter
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="h-8 w-8 p-0">
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-0">
          {displayTransactions.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <div className="text-muted-foreground">No transactions found</div>
              <div className="text-sm text-muted-foreground mt-1">Your transaction history will appear here</div>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {displayTransactions.map((transaction: any) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-muted/20 transition-colors"
                >
                  {/* Transaction Info */}
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-muted/30 ${getTransactionColor(transaction.type)}`}>
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{formatTransactionDescription(transaction)}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Amount and Status */}
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <div className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                        {transaction.amount_cents > 0 ? '+' : ''}{formatCurrency(transaction.amount_cents / 100)}
                      </div>
                      <div className="text-xs text-muted-foreground">USD</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">
                        {(transaction.status || 'completed').charAt(0).toUpperCase() + (transaction.status || 'completed').slice(1)}
                      </span>
                      <div className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(transaction.status || 'completed')}`}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Show more button if there are more transactions */}
          {limit && transactions.length > limit && (
            <div className="px-6 py-4 bg-muted/10 border-t border-border">
              <Button variant="ghost" size="sm" className="w-full text-sm">
                View All Transactions ({transactions.length - limit} more)
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
} 