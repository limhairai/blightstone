"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { formatCurrency } from "../../utils/format"
import { ChevronUp, ChevronDown, ArrowDownLeft, ArrowUpRight, ArrowRightLeft, Clock, Download, Filter, Check } from "lucide-react"
import { useOrganizationStore } from '@/lib/stores/organization-store'
import { Skeleton } from "../ui/skeleton"
import { useTransactions } from '@/lib/swr-config'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "../ui/dropdown-menu"

interface TransactionHistoryProps {
  limit?: number
  showFilters?: boolean
}

export function TransactionsHistory({ limit, showFilters = true }: TransactionHistoryProps) {
  const { currentOrganizationId } = useOrganizationStore()
  const [isExpanded, setIsExpanded] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)

  // Use optimized hooks with server-side pagination and filtering
  const { data: transactionsData, isLoading } = useTransactions(
    currentOrganizationId,
    !limit ? {
      status: statusFilter !== "all" ? statusFilter : undefined,
      type: typeFilter !== "all" ? typeFilter : undefined,
      // page: currentPage, // Removed - not supported by useTransactions
      // limit: itemsPerPage // Removed - not supported by useTransactions
    } : undefined
  );

  const transactions = transactionsData?.transactions || [];
  const totalTransactions = transactionsData?.totalCount || 0;
  const totalPages = transactionsData?.totalPages || 1;
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, typeFilter]);
  
  // For limited view, use client-side filtering and pagination
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

  const getTransactionColor = (type: string, amount: number) => {
    // From wallet perspective: money coming IN is green, money going OUT is white/neutral
    if (amount > 0) {
      // Money coming into wallet (deposits, refunds)
      return "text-[#34D197]"
    } else {
      // Money leaving wallet (ad account topups, withdrawals)
      return "text-foreground"
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                      <Filter className="h-3 w-3 mr-1" />
                      Filter
                      {(statusFilter !== "all" || typeFilter !== "all") && (
                        <div className="ml-1 w-1.5 h-1.5 bg-secondary rounded-full" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Status</div>
                    <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                      <Check className={`h-3 w-3 mr-2 ${statusFilter === "all" ? "opacity-100" : "opacity-0"}`} />
                      All Status
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("completed")}>
                      <Check className={`h-3 w-3 mr-2 ${statusFilter === "completed" ? "opacity-100" : "opacity-0"}`} />
                      Completed
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("pending")}>
                      <Check className={`h-3 w-3 mr-2 ${statusFilter === "pending" ? "opacity-100" : "opacity-0"}`} />
                      Pending
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("processing")}>
                      <Check className={`h-3 w-3 mr-2 ${statusFilter === "processing" ? "opacity-100" : "opacity-0"}`} />
                      Processing
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("failed")}>
                      <Check className={`h-3 w-3 mr-2 ${statusFilter === "failed" ? "opacity-100" : "opacity-0"}`} />
                      Failed
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Type</div>
                    <DropdownMenuItem onClick={() => setTypeFilter("all")}>
                      <Check className={`h-3 w-3 mr-2 ${typeFilter === "all" ? "opacity-100" : "opacity-0"}`} />
                      All Types
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTypeFilter("deposit")}>
                      <Check className={`h-3 w-3 mr-2 ${typeFilter === "deposit" ? "opacity-100" : "opacity-0"}`} />
                      Deposits
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTypeFilter("transfer")}>
                      <Check className={`h-3 w-3 mr-2 ${typeFilter === "transfer" ? "opacity-100" : "opacity-0"}`} />
                      Transfers
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTypeFilter("withdrawal")}>
                      <Check className={`h-3 w-3 mr-2 ${typeFilter === "withdrawal" ? "opacity-100" : "opacity-0"}`} />
                      Withdrawals
                    </DropdownMenuItem>
                    {(statusFilter !== "all" || typeFilter !== "all") && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => {
                          setStatusFilter("all");
                          setTypeFilter("all");
                          setCurrentPage(1);
                        }}>
                          Clear Filters
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
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
                    <div className={`p-2 rounded-lg bg-muted/30 ${getTransactionColor(transaction.type, transaction.amount_cents)}`}>
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
                      <div className={`font-semibold ${getTransactionColor(transaction.type, transaction.amount_cents)}`}>
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

          {/* Pagination Controls - only show if not using limit and there are multiple pages */}
          {!limit && totalPages > 1 && (
            <div className="px-6 py-4 bg-muted/10 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalTransactions)} of {totalTransactions} transactions
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1 || isLoading}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages || isLoading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Show more button if there are more transactions (only for limited view) */}
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