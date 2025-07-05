"use client"

import { useState, useEffect, useMemo } from "react"
import { useDebounce } from 'use-debounce'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarIcon,
  DownloadIcon,
  FilterIcon,
  SearchIcon,
  SlidersHorizontal,
  Receipt,
} from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Card, CardHeader } from "../../../components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../components/ui/tabs"
import { Input } from "../../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "../../../components/ui/popover"
import { Calendar } from "../../../components/ui/calendar"
import { format } from "date-fns"
import { formatCurrency } from "../../../utils/format"

import { useOrganizationStore } from "@/lib/stores/organization-store"
import { useAuth } from "@/contexts/AuthContext"
import { useTransactions } from "@/lib/swr-config"

// Transaction interface matching our database structure
interface Transaction {
  id?: string // May be undefined in some cases
  transaction_id?: string // Semantic ID field
  display_id?: string // User-friendly display ID
  organization_id: string
  wallet_id?: string
  ad_account_id?: string
  type: string
  amount_cents: number
  status: string
  description: string
  metadata?: {
    [key: string]: any
    stripe_payment_intent_id?: string
    account_id?: string
    account_name?: string
    topup_request_display_id?: string
  }
  created_at: string
  updated_at: string
  transaction_date?: string // Alternative date field
  businesses?: {
    id: string
    name: string
  }
  ad_accounts?: {
    id: string
    name: string
    account_id: string
  }
}

// Business interface for filtering
interface Business {
  id: string
  name: string
}

export default function TransactionsPage() {
  const { session } = useAuth()
  const { currentOrganizationId } = useOrganizationStore()
  
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [businessFilter, setBusinessFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [activeTab, setActiveTab] = useState("all")

  // Set the page title
  useEffect(() => {
    document.title = "Transactions | AdHub"
  }, [])

  // Use optimized transactions hook with filters
  const { data: transactionsData, error, isLoading } = useTransactions({
    type: activeTab !== 'all' ? activeTab : undefined,
    search: debouncedSearchQuery || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    business_id: businessFilter !== 'all' ? businessFilter : undefined,
    date: date ? format(date, 'yyyy-MM-dd') : undefined,
  })
  
  const allTransactions = transactionsData?.transactions || []

  // Extract businesses from transactions for filter options
  const businesses: Business[] = useMemo(() => {
    const businessMap = new Map<string, Business>()
    allTransactions.forEach((tx: Transaction) => {
      if (tx.businesses?.id && tx.businesses?.name) {
        businessMap.set(tx.businesses.id, {
          id: tx.businesses.id,
          name: tx.businesses.name
        })
      }
    })
    return Array.from(businessMap.values())
  }, [allTransactions])

  // Filter transactions based on active tab and filters (client-side for pagination)
  const filteredTransactions = allTransactions.filter((tx: Transaction) => {
    // Additional client-side filtering if needed
    return true
  })

  // Calculate summary metrics
  const totalDeposits = allTransactions
    .filter((tx: Transaction) => ['deposit', 'topup'].includes(tx.type) && tx.status === 'completed')
    .reduce((sum: number, tx: Transaction) => sum + Math.abs(tx.amount_cents), 0) / 100

  const totalWithdrawals = allTransactions
    .filter((tx: Transaction) => tx.type === 'withdrawal' && tx.status === 'completed')
    .reduce((sum: number, tx: Transaction) => sum + Math.abs(tx.amount_cents), 0) / 100

  const totalTransactions = allTransactions.length
  const completedTransactions = allTransactions.filter((tx: Transaction) => tx.status === 'completed').length
  const pendingTransactions = allTransactions.filter((tx: Transaction) => tx.status === 'pending').length
  const totalVolume = allTransactions
    .filter((tx: Transaction) => tx.status === 'completed')
    .reduce((sum: number, tx: Transaction) => sum + Math.abs(tx.amount_cents), 0) / 100

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Get status dot color
  const getStatusDotColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-[#34D197]"
      case "pending":
        return "bg-[#FFC857]"
      case "failed":
        return "bg-[#F56565]"
      default:
        return "bg-gray-500"
    }
  }

  // Get amount color
  const getAmountColor = (amount: number) => {
    return amount > 0 ? "text-[#34D197]" : "text-foreground"
  }

  // Transaction type styling
  const getTypeIcon = (type: string, amount: number) => {
    switch (type) {
      case "deposit":
      case "topup":
        return (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-950/30 text-[#34D197]">
            <ArrowDownIcon className="h-3 w-3" />
          </div>
        )
      case "withdrawal":
        return (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-950/30 text-rose-400">
            <ArrowUpIcon className="h-3 w-3" />
          </div>
        )
      case "transfer":
        return (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-950/30 text-blue-400">
            {amount > 0 ? <ArrowDownIcon className="h-3 w-3" /> : <ArrowUpIcon className="h-3 w-3" />}
          </div>
        )
      default:
        return (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-950/30 text-gray-400">
            <Receipt className="h-3 w-3" />
          </div>
        )
    }
  }

  // Clean up transaction description for better readability
  const getCleanDescription = (tx: Transaction) => {
    const desc = tx.description
    
    // Handle new display_id format (e.g., "Ad Account Top-up TR-A1B2C3 completed")
    if (desc.includes('Ad Account Top-up') && desc.includes('completed')) {
      const displayIdMatch = desc.match(/TR-[A-Z0-9]{6}/)
      if (displayIdMatch) {
        return `Ad Account Top-up ${displayIdMatch[0]} completed`
      }
      return 'Ad Account Top-up completed'
    }
    
    // Handle legacy topup request completed messages - need to distinguish wallet vs ad account
    if (desc.startsWith('Topup request completed:')) {
      // Check if this is an ad account transaction by looking at metadata
      if (tx.metadata?.ad_account_id || tx.metadata?.ad_account_name || tx.metadata?.topup_request_id) {
        return 'Ad Account Top-up completed'
      }
      // Otherwise it's a wallet transaction
      return 'Wallet Top-up completed'
    }
    
    // Handle Stripe wallet top-ups
    if (desc.includes('Stripe Wallet Top-up')) {
      const match = desc.match(/\$[\d,]+\.?\d*/)
      if (match) {
        return `Wallet Top-up - ${match[0]}`
      }
      return 'Wallet Top-up'
    }
    
    // Handle ad account top-ups (legacy format)
    if (desc.includes('Ad Account Top-up')) {
      const match = desc.match(/\$[\d,]+\.?\d*/)
      if (match) {
        return `Ad Account Top-up - ${match[0]}`
      }
      return 'Ad Account Top-up'
    }
    
    // Return original description if no patterns match
    return desc
  }

  // Get business or wallet name for display
  const getSourceName = (tx: Transaction) => {
    // For wallet top-ups (Stripe), show "Wallet"
    if (['deposit'].includes(tx.type) && tx.metadata?.stripe_payment_intent_id) {
      return "Wallet"
    }
    
    // For ad account top-ups, show business name if available
    if (tx.businesses?.name) {
      return tx.businesses.name
    }
    
    // For ad account transactions, try to get from metadata
    if (tx.metadata?.account_name || tx.ad_accounts?.name) {
      return tx.metadata.account_name || tx.ad_accounts?.name
    }
    
    // Default to Wallet for wallet transactions
    return "Wallet"
  }

  // Get destination account for display
  const getDestinationName = (tx: Transaction) => {
    // For ad account transactions, prioritize showing the actual ad account
    // Check metadata first since that's where ad account info is stored
    if (tx.metadata?.ad_account_id || tx.metadata?.ad_account_name) {
      // Try to get ad account name from metadata
      if (tx.metadata?.ad_account_name) {
        return tx.metadata.ad_account_name
      }
      
      // Show ad account ID if available
      if (tx.metadata?.ad_account_id) {
        return `Ad Account ${tx.metadata.ad_account_id.substring(0, 8)}`
      }
    }
    
    // Legacy check for ad_account_id field (in case it's set)
    if (tx.ad_account_id) {
      // Try to get ad account name first
      if (tx.ad_accounts?.name) {
        return tx.ad_accounts.name
      }
      
      // Try to get from metadata
      if (tx.metadata?.account_name) {
        return tx.metadata.account_name
      }
      
      // Try to get account ID from metadata
      if (tx.metadata?.account_id) {
        return `Ad Account ${tx.metadata.account_id.substring(0, 8)}`
      }
      
      // Show ad account ID if available
      return `Ad Account ${tx.ad_account_id.substring(0, 8)}`
    }
    
    // For wallet deposits without ad account
    if (['deposit'].includes(tx.type) && !tx.ad_account_id && !tx.metadata?.ad_account_id) {
      return "Organization Wallet"
    }
    
    // Default to Organization Wallet
    return "Organization Wallet"
  }

  // Get simplified reference for display
  const getTransactionReference = (tx: Transaction) => {
    // Prioritize display_id if available
    if (tx.display_id) {
      return tx.display_id
    }
    
    // For Stripe transactions, show shortened payment intent ID
    if (tx.metadata?.stripe_payment_intent_id) {
      const piId = tx.metadata.stripe_payment_intent_id
      return piId.startsWith('pi_') ? piId.substring(3, 11) : piId.substring(0, 8)
    }
    
    // For ad account transactions, use account ID if available
    if (tx.metadata?.account_id) {
      return tx.metadata.account_id.substring(0, 8)
    }
    
    // Use transaction_id (semantic ID) as fallback
    if (tx.transaction_id) {
      return tx.transaction_id.substring(0, 8)
    }
    
    // Use regular id as final fallback
    if (tx.id) {
      return tx.id.substring(0, 8)
    }
    
    // Final fallback if no ID is available
    return "—"
  }

  // Export CSV functionality
  const exportToCSV = () => {
    const headers = ["Date", "Description", "Source", "Destination", "Reference", "Amount", "Type", "Status"]
    const csvData = filteredTransactions.map((tx: Transaction) => [
      format(new Date(tx.created_at), "yyyy-MM-dd"),
      getCleanDescription(tx),
      getSourceName(tx),
      getDestinationName(tx),
      getTransactionReference(tx),
      (tx.amount_cents / 100).toFixed(2),
      tx.type,
      tx.status,
    ])

    const csvContent = [headers, ...csvData].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `transactions-${format(new Date(), "yyyy-MM-dd")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function renderTransactionsTable() {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading transactions...</div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-red-500">Error loading transactions: {error.message}</div>
        </div>
      )
    }

    return (
      <>
        {paginatedTransactions.length > 0 ? (
        <div className="rounded-md border border-border overflow-hidden">
          <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 dark:bg-muted/50">
                    <th className="h-10 px-4 text-left align-middle font-medium text-xs text-muted-foreground"></th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-xs text-muted-foreground">Description</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-xs text-muted-foreground">Source</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-xs text-muted-foreground">Destination</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-xs text-muted-foreground">Reference</th>
                    <th className="h-10 px-4 text-right align-middle font-medium text-xs text-muted-foreground">Amount</th>
                    <th className="h-10 px-4 text-right align-middle font-medium text-xs text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                  {paginatedTransactions.map((tx: Transaction, index: number) => (
                    <tr key={tx.transaction_id || tx.id || `tx-${index}`} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="p-4 align-middle w-8">{getTypeIcon(tx.type, tx.amount_cents)}</td>
                      <td className="p-4 align-middle text-sm">
                        <div className="font-medium">{getCleanDescription(tx)}</div>
                        <div className="text-xs text-muted-foreground">{format(new Date(tx.created_at), "MMM dd, yyyy")}</div>
                      </td>
                      <td className="p-4 align-middle text-sm">{getSourceName(tx)}</td>
                      <td className="p-4 align-middle text-sm">{getDestinationName(tx)}</td>
                      <td className="p-4 align-middle text-sm font-mono text-muted-foreground">{getTransactionReference(tx)}</td>
                      <td className="p-4 align-middle text-sm text-right">
                        <span className={getAmountColor(tx.amount_cents)}>
                          {tx.amount_cents > 0 ? "+" : ""}
                          {formatCurrency(Math.abs(tx.amount_cents) / 100)}
                      </span>
                    </td>
                      <td className="p-4 align-middle text-sm text-right text-muted-foreground">
                        <div className="flex items-center justify-end gap-1">
                          <span>{tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}</span>
                          <div className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(tx.status)}`}></div>
                        </div>
                      </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted/20 dark:bg-muted/20 p-3 mb-4">
              <FilterIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium mb-2">No transactions found</h3>
            <p className="text-xs text-muted-foreground max-w-md">
              No transactions match your current filters. Try adjusting your search criteria or clear filters to see all
              transactions.
            </p>
            <Button
              variant="outline"
              className="mt-4 bg-transparent"
              onClick={() => {
                setSearchQuery("")
                setStatusFilter("all")
                setBusinessFilter("all")
                setDate(undefined)
                setActiveTab("all")
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* Pagination */}
        {filteredTransactions.length > 0 && (
          <div className="flex items-center justify-between mt-3">
            <div className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length}{" "}
              transactions
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNumber = i + 1
                  return (
                    <Button
                      key={i}
                      variant={pageNumber === currentPage ? "default" : "outline"}
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => setCurrentPage(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  )
                })}

                {totalPages > 5 && (
                  <>
                    <span className="text-muted-foreground">...</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-8 h-8 p-0 bg-transparent"
                      onClick={() => setCurrentPage(totalPages)}
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>

              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number.parseInt(value))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 / page</SelectItem>
                  <SelectItem value="10">10 / page</SelectItem>
                  <SelectItem value="20">20 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="text-foreground bg-accent">
              <Receipt className="h-4 w-4 mr-2" />
              Transactions
            </Button>
          </div>
        </div>

        <Button variant="outline" className="h-9 bg-transparent" onClick={exportToCSV}>
          <DownloadIcon className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Compact Metrics */}
      <div className="flex items-center gap-8">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            TOTAL TRANSACTIONS
          </div>
          <div className="text-sm font-semibold">
            {totalTransactions} ({completedTransactions} completed)
          </div>
        </div>
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">TOTAL VOLUME</div>
          <div className="text-sm font-semibold">${formatCurrency(totalVolume)}</div>
        </div>
      </div>

      {/* Tabs and Filters */}
      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-fit grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="deposit">Deposits</TabsTrigger>
              <TabsTrigger value="withdrawal">Withdrawals</TabsTrigger>
              <TabsTrigger value="transfer">Transfers</TabsTrigger>
            </TabsList>

        <TabsContent value="all" className="mt-4">
          {/* Filters */}
          <Card className="bg-card/50 dark:bg-card/50 border-border mb-4">
            <CardHeader className="pb-0 pt-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex flex-1 flex-col md:flex-row md:items-center gap-2">
                  <div className="relative flex-1 max-w-sm">
                    <SearchIcon className="absolute left-2.5 top-2.5 h-3 w-3 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search transactions..."
                      className="pl-8 bg-background/50 dark:bg-background/50 h-8 text-xs"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                        <Button variant="outline" className="h-8 border-dashed text-xs bg-transparent">
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                      </PopoverContent>
                    </Popover>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={businessFilter} onValueChange={setBusinessFilter}>
                      <SelectTrigger className="w-[160px] h-8 text-xs">
                        <SelectValue placeholder="Filter by business" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Businesses</SelectItem>
                        <SelectItem value="main">Main Wallet</SelectItem>
                        {businesses.map((business) => (
                          <SelectItem key={business.id} value={business.id}>
                            {business.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button variant="outline" size="icon" className="md:hidden h-8 w-8 bg-transparent">
                  <SlidersHorizontal className="h-3 w-3" />
                         </Button>
          </div>
            </CardHeader>
          </Card>
          {renderTransactionsTable()}
        </TabsContent>

        <TabsContent value="deposit" className="mt-4">
          {renderTransactionsTable()}
        </TabsContent>

        <TabsContent value="withdrawal" className="mt-4">
          {renderTransactionsTable()}
        </TabsContent>

        <TabsContent value="transfer" className="mt-4">
          {renderTransactionsTable()}
        </TabsContent>
        </Tabs>
      </div>
  )
} 