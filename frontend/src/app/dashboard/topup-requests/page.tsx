"use client"

import { useState, useEffect, useMemo } from "react"
import { useDebounce } from 'use-debounce'
import { useAuth } from "../../../contexts/AuthContext"
import { useOrganizationStore } from "../../../lib/stores/organization-store"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { Input } from "../../../components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import { Label } from "../../../components/ui/label"

import { Card, CardHeader } from "../../../components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "../../../components/ui/popover"
import { Calendar } from "../../../components/ui/calendar"
import type { ColumnDef } from "@tanstack/react-table"
import { formatDistanceToNow, format } from "date-fns"
import { 
  Search, 
  Clock, 
  CheckCircle, 
  X, 
  Eye, 
  LayoutGrid, 
  DollarSign, 
  Loader2, 
  AlertTriangle,
  Receipt,
  RefreshCw,
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarIcon,
  DownloadIcon,
  FilterIcon,
  SearchIcon,
  SlidersHorizontal
} from "lucide-react"
import { formatCurrency } from "../../../utils/format"
import { toast } from "sonner"
import type { TopupRequest, TopupRequestStatus } from "../../../types/topup-request"
import { useSWRConfig } from 'swr'
import { useTopupRequests, useTransactions } from "../../../lib/swr-config"
import { mutate } from 'swr'

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

export default function ClientTopupRequestsPage() {
  const { session } = useAuth()
  const { mutate } = useSWRConfig()
  const { currentOrganizationId } = useOrganizationStore()
  
  // Remove tab state - no longer needed
  
  // State management for filters and pagination
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [businessFilter, setBusinessFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("all")
  
  // ⚡ OPTIMIZED: Only fetch what we need based on transaction type filter
  const shouldLoadTopupRequests = transactionTypeFilter === 'all' || transactionTypeFilter === 'transfer'
  const shouldLoadTransactions = transactionTypeFilter === 'all' || transactionTypeFilter !== 'transfer'
  
  // Conditional data fetching
  const { data: requestsData, error: requestsError, isLoading: requestsLoading, mutate: mutateRequests } = useTopupRequests()
  const requests: TopupRequest[] = shouldLoadTopupRequests ? (Array.isArray(requestsData) ? requestsData : requestsData?.requests || []) : []
  
  const transactionsQuery = useTransactions(currentOrganizationId, {
    type: shouldLoadTransactions && transactionTypeFilter !== 'all' ? transactionTypeFilter : undefined,
    search: shouldLoadTransactions && debouncedSearchQuery ? debouncedSearchQuery : undefined,
    status: shouldLoadTransactions && statusFilter !== 'all' ? statusFilter : undefined,
    business_id: shouldLoadTransactions && businessFilter !== 'all' ? businessFilter : undefined,
    date: shouldLoadTransactions && date ? format(date, 'yyyy-MM-dd') : undefined,
  })
  
  // Use the query result only if we should load transactions
  const { data: transactionsData, error: transactionsError, isLoading: transactionsLoading, mutate: mutateTransactions } = transactionsQuery
  
  // ⚡ REMOVED: No need to trigger loading - data is prefetched and always available
  
  const allTransactions = transactionsData?.transactions || []
  
  // Convert requests to transaction-like format for unified display
  const requestsAsTransactions = requests.map(request => ({
    id: request.id,
    transaction_id: request.id,
    display_id: request.id,
    organization_id: request.organization_id,
    type: 'transfer', // Change from 'request' to 'transfer' since requests are transfers
    amount_cents: -Math.abs(request.amount_cents), // Negative because it's money leaving the main wallet
    status: request.status,
    description: `Top-up - ${request.ad_account_name || 'Account'}`,
    metadata: {
      ...request.metadata,
      ad_account_name: request.ad_account_name,
      ad_account_id: request.ad_account_id,
      business_manager_name: request.metadata?.business_manager_name,
      request_type: 'topup'
    },
    created_at: request.created_at,
    updated_at: request.updated_at || request.created_at,
    businesses: request.metadata?.business_manager_name ? {
      id: request.metadata?.business_manager_id || '',
      name: request.metadata.business_manager_name
    } : undefined
  }))
  
  // Combine transactions and requests based on filter
  const combinedData = transactionTypeFilter === 'all' 
    ? [...allTransactions, ...requestsAsTransactions]
    : transactionTypeFilter === 'transfer'
      ? [...allTransactions.filter((tx: Transaction) => tx.type === 'transfer'), ...requestsAsTransactions]
      : allTransactions.filter((tx: Transaction) => tx.type === transactionTypeFilter)
  
  // Dialog state for request details
  const [selectedRequest, setSelectedRequest] = useState<TopupRequest | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

  // Set the page title
  useEffect(() => {
    document.title = "Transactions | AdHub"
  }, [])

  const getStatusConfig = (status: TopupRequestStatus) => {
    switch (status) {
      case 'pending':
        return { color: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800", icon: Clock }
      case 'processing':
        return { color: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800", icon: Clock }
      case 'completed':
        return { color: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800", icon: CheckCircle }
      case 'failed':
        return { color: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800", icon: X }
      case 'cancelled':
        return { color: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800", icon: X }
      default:
        return { color: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800", icon: Clock }
    }
  }

  const handleViewDetails = (request: TopupRequest) => {
    setSelectedRequest(request)
    setShowDetailsDialog(true)
  }

  const handleCancelRequest = async (request: TopupRequest) => {
    try {
      const response = await fetch(`/api/topup-requests/${request.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          status: 'cancelled'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel request');
      }

      // Refresh the requests list using SWR
      await mutateRequests();
      
      // Refresh wallet balance and organization data
      if (currentOrganizationId) {
        await Promise.all([
          mutate(`/api/organizations?id=${currentOrganizationId}`),
          mutate('/api/organizations'),
          mutate(`org-${currentOrganizationId}`)
        ]);
      }
      
      toast.success("Request cancelled successfully");
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel request');
    }
  }

  // Transaction helper functions
  const handleRefreshTransactions = async () => {
    await Promise.all([
      mutateTransactions(),
      mutate('transactions'),
      mutate('/api/transactions'),
      mutate(`/api/organizations?id=${currentOrganizationId}`), // Refresh org data for wallet balance
    ])
  }

  // Extract businesses from combined data for filter options
  const businesses: Business[] = useMemo(() => {
    const businessMap = new Map<string, Business>()
    combinedData.forEach((tx: Transaction) => {
      if (tx.businesses?.id && tx.businesses?.name) {
        businessMap.set(tx.businesses.id, {
          id: tx.businesses.id,
          name: tx.businesses.name
        })
      }
    })
    return Array.from(businessMap.values())
  }, [combinedData])

  // Filter combined data based on filters (client-side for pagination)
  const filteredTransactions = combinedData.filter((tx: Transaction) => {
    // Additional client-side filtering if needed
    return true
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Get human-readable names instead of IDs
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
      return tx.metadata?.account_name || tx.ad_accounts?.name
    }
    
    // Default to Wallet for wallet transactions
    return "Wallet"
  }

  // Get destination account name instead of ID
  const getDestinationName = (tx: Transaction) => {
    // For ad account transactions, prioritize showing the actual ad account name
    if (tx.metadata?.ad_account_name) {
      return tx.metadata.ad_account_name
    }
    
    // Try to get ad account name from relations
    if (tx.ad_accounts?.name) {
      return tx.ad_accounts.name
    }
    
    // Try to get from metadata account_name
    if (tx.metadata?.account_name) {
      return tx.metadata.account_name
    }
    
    // For wallet deposits without ad account
    if (['deposit'].includes(tx.type) && !tx.ad_account_id && !tx.metadata?.ad_account_id) {
      return "Organization Wallet"
    }
    
    // Default to Organization Wallet
    return "Organization Wallet"
  }

  // Get clean transaction description
  const getCleanDescription = (tx: Transaction) => {
    const desc = tx.description
    
    // Handle new display_id format (e.g., "Ad Account Top-up TR-A1B2C3 completed")
    if (desc.includes('Ad Account Top-up') && desc.includes('completed')) {
      const displayIdMatch = desc.match(/TR-[A-Z0-9]{6}/)
      if (displayIdMatch) {
        return `Top-up ${displayIdMatch[0]} completed`
      }
              return 'Top-up completed'
    }
    
    // Handle legacy topup request completed messages
    if (desc.startsWith('Topup request completed:')) {
      if (tx.metadata?.ad_account_id || tx.metadata?.ad_account_name || tx.metadata?.topup_request_id) {
        return 'Top-up completed'
      }
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

  // Get transaction type icons
  const getTypeIcon = (type: string, amount: number, metadata?: any) => {
    // Check if this is a top-up request (transfer with request_type metadata)
    if (type === 'transfer' && metadata?.request_type === 'topup') {
      return (
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-950/30 text-orange-400">
          <Clock className="h-3 w-3" />
        </div>
      )
    }
    
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

  // Get status dot color
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

  // Get amount color - positive amounts are green (money coming in), negative amounts are white (money going out)
  const getAmountColor = (amount: number) => {
    return amount > 0 ? "text-[#34D197]" : "text-foreground"
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

  // Calculate summary metrics from combined data
  const totalDeposits = combinedData
    .filter((tx: Transaction) => ['deposit', 'topup'].includes(tx.type) && tx.status === 'completed')
    .reduce((sum: number, tx: Transaction) => sum + Math.abs(tx.amount_cents), 0) / 100

  const totalWithdrawals = combinedData
    .filter((tx: Transaction) => tx.type === 'withdrawal' && tx.status === 'completed')
    .reduce((sum: number, tx: Transaction) => sum + Math.abs(tx.amount_cents), 0) / 100

  const totalTransactions = combinedData.length
  const completedTransactions = combinedData.filter((tx: Transaction) => ['completed', 'fulfilled'].includes(tx.status)).length
  const pendingTransactions = combinedData.filter((tx: Transaction) => ['pending', 'processing'].includes(tx.status)).length
  const totalVolume = combinedData
    .filter((tx: Transaction) => ['completed', 'fulfilled'].includes(tx.status))
    .reduce((sum: number, tx: Transaction) => sum + Math.abs(tx.amount_cents), 0) / 100

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

    const csvContent = [headers, ...csvData].map((row) => row.map((field: any) => `"${field}"`).join(",")).join("\n")

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



  // Status filter options
  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "processing", label: "Processing" },
    { value: "completed", label: "Completed" },
    { value: "fulfilled", label: "Fulfilled" },
    { value: "failed", label: "Failed" },
    { value: "cancelled", label: "Cancelled" },
  ]

  // OPTIMIZATION: Only show loading for essential data (requests), not transactions
  if (requestsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading transactions...</span>
      </div>
    )
  }

  // Error state - only block for critical errors
  if (requestsError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">Failed to load transactions</h3>
          <p className="text-muted-foreground">Please try again later</p>
          <Button onClick={() => {
            mutateTransactions()
            mutateRequests()
          }} className="mt-2">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
            <div className="text-sm font-semibold">{formatCurrency(totalVolume)}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {transactionsLoading && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              Loading...
            </div>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefreshTransactions}
            disabled={transactionsLoading}
            className="h-9 bg-transparent"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${transactionsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" className="h-9 bg-transparent" onClick={exportToCSV}>
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="space-y-6">

        {/* Transaction Type Filters */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant={transactionTypeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setTransactionTypeFilter("all")}
            >
              All
            </Button>
            <Button
              variant={transactionTypeFilter === "deposit" ? "default" : "outline"}
              size="sm"
              onClick={() => setTransactionTypeFilter("deposit")}
            >
              Deposits
            </Button>
            <Button
              variant={transactionTypeFilter === "withdrawal" ? "default" : "outline"}
              size="sm"
              onClick={() => setTransactionTypeFilter("withdrawal")}
            >
              Withdrawals
            </Button>
            <Button
              variant={transactionTypeFilter === "transfer" ? "default" : "outline"}
              size="sm"
              onClick={() => setTransactionTypeFilter("transfer")}
            >
              Top Ups
            </Button>
          </div>
        </div>

        {/* Transaction Filters */}
        <div className="mb-4">
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
                      <SelectItem value="fulfilled">Fulfilled</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
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
          </div>

        {/* Transactions Table */}
        {transactionsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading transactions...</div>
          </div>
        ) : transactionsError ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-red-500">Error loading transactions: {transactionsError.message}</div>
          </div>
        ) : (
          <>
            {paginatedTransactions.length > 0 ? (
              <div className="overflow-hidden">
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
                        <th className="h-10 px-4 text-right align-middle font-medium text-xs text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTransactions.map((tx: Transaction, index: number) => (
                        <tr key={tx.transaction_id || tx.id || `tx-${index}`} className="border-t border-border hover:bg-muted/30 transition-colors">
                          <td className="p-4 align-middle w-8">{getTypeIcon(tx.type, tx.amount_cents, tx.metadata)}</td>
                          <td className="p-4 align-middle text-sm">
                            <div className="font-medium">{getCleanDescription(tx)}</div>
                            <div className="text-xs text-muted-foreground">{format(new Date(tx.created_at), "MMM dd, yyyy")}</div>
                          </td>
                          <td className="p-4 align-middle text-sm">{getSourceName(tx)}</td>
                          <td className="p-4 align-middle text-sm">{getDestinationName(tx)}</td>
                          <td className="p-4 align-middle text-sm font-mono text-muted-foreground">{getTransactionReference(tx)}</td>
                          <td className="p-4 align-middle text-sm text-right">
                            <span className={getAmountColor(tx.amount_cents)}>
                              {tx.amount_cents > 0 ? "+" : "-"}
                              {formatCurrency(Math.abs(tx.amount_cents) / 100)}
                            </span>
                          </td>
                          <td className="p-4 align-middle text-sm text-right text-muted-foreground">
                            <div className="flex items-center justify-end gap-1">
                              <span>{tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}</span>
                              <div className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(tx.status)}`}></div>
                            </div>
                          </td>
                          <td className="p-4 align-middle text-sm text-right">
                            {tx.metadata?.request_type === 'topup' ? (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    // Find the original request object
                                    const originalRequest = requests.find(r => r.id === tx.id)
                                    if (originalRequest) {
                                      handleViewDetails(originalRequest)
                                    }
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                {tx.status === 'pending' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      // Find the original request object
                                      const originalRequest = requests.find(r => r.id === tx.id)
                                      if (originalRequest) {
                                        handleCancelRequest(originalRequest)
                                      }
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
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
                  No transactions match your current filters. Try adjusting your search criteria or clear filters to see all transactions.
                </p>
                <Button
                  variant="outline"
                  className="mt-4 bg-transparent"
                  onClick={() => {
                    setSearchQuery("")
                    setStatusFilter("all")
                    setBusinessFilter("all")
                    setDate(undefined)
                    setTransactionTypeFilter("all")
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
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Top-up Details</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* Request Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Request ID</Label>
                  <div className="font-mono text-sm">{selectedRequest.id}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    {(() => {
                      const config = getStatusConfig(selectedRequest.status)
                      const Icon = config.icon
                      return (
                        <Badge className={`capitalize ${config.color} flex items-center gap-1 w-fit`}>
                          <Icon className="h-3 w-3" />
                          {selectedRequest.status}
                        </Badge>
                      )
                    })()}
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Account Information</Label>
                <div className="mt-2 p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Account Name:</span>
                    <span className="text-sm font-medium">{selectedRequest.ad_account_name || 'Not Available'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Account ID:</span>
                    <span className="text-sm font-mono">{selectedRequest.ad_account_id || 'Not Available'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Business Manager:</span>
                    <span className="text-sm font-medium">{selectedRequest.metadata?.business_manager_name || 'Not Available'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">BM ID:</span>
                    <span className="text-sm font-mono">{selectedRequest.metadata?.business_manager_id || 'Not Available'}</span>
                  </div>
                </div>
              </div>

              {/* Request Details */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Request Details</Label>
                <div className="mt-2 p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Amount:</span>
                    <span className="text-sm font-medium text-[#34D197]">{formatCurrency(selectedRequest.amount_cents / 100)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Requested:</span>
                    <span className="text-sm">{formatDistanceToNow(new Date(selectedRequest.created_at), { addSuffix: true })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Requested By:</span>
                    <span className="text-sm">{selectedRequest.requested_by || 'Unknown'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 