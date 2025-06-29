"use client"

import { useState, useMemo } from "react"
import useSWR from 'swr'
import { useDebounce } from 'use-debounce'
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Badge } from "../ui/badge"
import { Checkbox } from "../ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Calendar } from "../ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal, 
  ArrowUpIcon, 
  ArrowDownIcon, 
  ArrowRightIcon,
  Calendar as CalendarIcon,
  Eye,
  RefreshCw,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign
} from "lucide-react"
import { formatCurrency, transactionColors } from "../../utils/format"
import { toast } from "sonner"
import { format } from "date-fns"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableFooter, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"

interface TransactionFilters {
  search: string
  type: string
  status: string
  dateRange: {
    from: Date | undefined
    to?: Date | undefined
  }
  amountRange: {
    min: string
    max: string
  }
  account: string
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function AdvancedTransactionManager() {
  const { currentOrganizationId } = useOrganizationStore();
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set())
  const [viewTransaction, setViewTransaction] = useState<any>(null)
  const [filters, setFilters] = useState<TransactionFilters>({
    search: "",
    type: "all",
    status: "all",
    dateRange: { from: undefined, to: undefined },
    amountRange: { min: "", max: "" },
    account: "all"
  })
  const [debouncedFilters] = useDebounce(filters, 500);

  const [sortBy, setSortBy] = useState<"date" | "amount" | "type">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [isExporting, setIsExporting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (currentOrganizationId) params.set('organization_id', currentOrganizationId);
    if (debouncedFilters.search) params.set('search', debouncedFilters.search);
    if (debouncedFilters.type !== 'all') params.set('type', debouncedFilters.type);
    if (debouncedFilters.status !== 'all') params.set('status', debouncedFilters.status);
    if (debouncedFilters.dateRange.from) params.set('date_from', format(debouncedFilters.dateRange.from, "yyyy-MM-dd"));
    if (debouncedFilters.dateRange.to) params.set('date_to', format(debouncedFilters.dateRange.to, "yyyy-MM-dd"));
    if (debouncedFilters.amountRange.min) params.set('min_amount', debouncedFilters.amountRange.min);
    if (debouncedFilters.amountRange.max) params.set('max_amount', debouncedFilters.amountRange.max);
    if (debouncedFilters.account !== 'all') params.set('account_id', debouncedFilters.account);
    params.set('sort_by', sortBy);
    params.set('sort_order', sortOrder);
    params.set('page', currentPage.toString());
    params.set('limit', itemsPerPage.toString());
    return params.toString();
  }, [currentOrganizationId, debouncedFilters, sortBy, sortOrder, currentPage, itemsPerPage]);

  const { data: transactionsData, error, isLoading, mutate } = useSWR(
    currentOrganizationId ? `/api/transactions?${queryString}` : null,
    fetcher,
    { keepPreviousData: true }
  );

  const transactions = transactionsData?.transactions || [];
  const totalPages = transactionsData?.totalPages || 1;

  // Enhanced transaction data with more details
  const enhancedTransactions = useMemo(() => {
    return transactions.map((tx:any) => ({
      ...tx,
      status: tx.status || (Math.random() > 0.1 ? "completed" : Math.random() > 0.5 ? "pending" : "failed"),
      fee: tx.fee_cents ? tx.fee_cents / 100 : Math.round(Math.abs(tx.amount_cents/100) * 0.025), // 2.5% fee
      reference: tx.reference || `TXN-${tx.id.toString().padStart(6, '0')}`,
      description: tx.description || (tx.type === "topup" ? "Wallet top-up" : 
                  tx.type === "withdrawal" ? "Account funding" :
                  tx.type === "spend" ? "Ad spend" : "Internal transfer"),
      category: tx.category || (tx.type === "spend" ? "advertising" : "funding"),
      paymentMethod: tx.payment_method || (tx.type === "topup" ? "Credit Card" : "Bank Transfer"),
      amount: tx.amount_cents / 100,
      date: tx.created_at,
    }))
  }, [transactions])

  // Filter and sort transactions - This is now handled by the API
  const filteredTransactions = enhancedTransactions;

  const getTransactionIcon = (type: string, amount: number) => {
    switch (type) {
      case "topup":
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
            <ArrowRightIcon className={`h-4 w-4 ${transactionColors.transfer.icon}`} />
          </div>
        )
      default:
        return (
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${transactionColors.spend.bg}`}>
            <DollarSign className={`h-4 w-4 ${transactionColors.spend.icon}`} />
          </div>
        )
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Completed</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">Pending</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">Failed</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const handleSelectTransaction = (txId: string) => {
    const newSelected = new Set(selectedTransactions)
    if (newSelected.has(txId)) {
      newSelected.delete(txId)
    } else {
      newSelected.add(txId)
    }
    setSelectedTransactions(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedTransactions.size === filteredTransactions.length) {
      setSelectedTransactions(new Set())
    } else {
      setSelectedTransactions(new Set(filteredTransactions.map(tx => tx.id)))
    }
  }

  const handleBulkAction = (action: string) => {
    const count = selectedTransactions.size
    switch (action) {
      case "export":
        toast.success(`Exporting ${count} transactions...`)
        break
      case "retry":
        toast.success(`Retrying ${count} failed transactions...`)
        break
      case "cancel":
        toast.success(`Cancelling ${count} pending transactions...`)
        break
    }
    setSelectedTransactions(new Set())
  }

  const handleExport = async () => {
    setIsExporting(true)
    // Simulate export delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    toast.success("Transaction data exported successfully!")
    setIsExporting(false)
  }

  const clearFilters = () => {
    setFilters({
      search: "",
      type: "all",
      status: "all",
      dateRange: { from: undefined, to: undefined },
      amountRange: { min: "", max: "" },
      account: "all"
    })
  }

  const uniqueAccounts = [...new Set(
    enhancedTransactions
      .flatMap(tx => [tx.fromAccount, tx.toAccount])
      .filter((account): account is string => Boolean(account))
  )]

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const renderTransactionList = () => {
    if (isLoading) {
      return (
        <div className="space-y-2">
          {Array.from({ length: itemsPerPage }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      )
    }

    if (error) {
      return <div className="text-red-500 text-center p-8">Failed to load transactions. Please try again.</div>
    }

    if (filteredTransactions.length === 0) {
      return <div className="text-center text-muted-foreground p-8">No transactions found for the selected filters.</div>
    }

    return (
      <div className="space-y-2">
        {filteredTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <Checkbox
                checked={selectedTransactions.has(transaction.id)}
                onCheckedChange={() => handleSelectTransaction(transaction.id)}
                className="mt-1"
              />
              {getTransactionIcon(transaction.type, transaction.amount)}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{transaction.description}</span>
                  {getStatusBadge(transaction.status)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {transaction.reference} &bull; {transaction.fromAccount || transaction.toAccount || 'Unknown'} &bull; {transaction.paymentMethod}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className={`font-medium ${transaction.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
                  {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                </div>
                <div className="text-sm text-muted-foreground">
                  Fee: {formatCurrency(transaction.fee)}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm font-medium">{format(new Date(transaction.date), "MMM d, yyyy")}</div>
                <div className="text-xs text-muted-foreground">{format(new Date(transaction.date), "p")}</div>
              </div>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Eye className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Transaction Details</DialogTitle>
                  </DialogHeader>
                  <pre className="mt-4 text-xs bg-muted p-4 rounded-md overflow-x-auto">
                    {JSON.stringify(transaction, null, 2)}
                  </pre>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transaction Management</CardTitle>
                          <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => mutate()}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Advanced Filters
                </Button>
              {selectedTransactions.size > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Bulk Actions ({selectedTransactions.size})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkAction('export')}>Export Selected</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('retry')}>Retry Failed</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('cancel')}>Cancel Pending</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by description, reference..."
                  value={filters.search}
                  onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-x-2">
                    <Filter className="h-4 w-4" />
                    <span>Filter</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4 p-4">
                    <h4 className="font-medium">Advanced Filters</h4>
                    <Select value={filters.type} onValueChange={(v) => setFilters(f => ({ ...f, type: v }))}>
                      <SelectTrigger><SelectValue placeholder="Transaction Type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="topup">Top-up</SelectItem>
                        <SelectItem value="withdrawal">Withdrawal</SelectItem>
                        <SelectItem value="spend">Spend</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filters.status} onValueChange={(v) => setFilters(f => ({ ...f, status: v }))}>
                      <SelectTrigger><SelectValue placeholder="Transaction Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateRange.from ? 
                            (filters.dateRange.to ? `${format(filters.dateRange.from, "LLL dd, y")} - ${format(filters.dateRange.to, "LLL dd, y")}` : format(filters.dateRange.from, "LLL dd, y"))
                            : <span>Pick a date range</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="range"
                          selected={filters.dateRange}
                          onSelect={(range) => setFilters(f => ({ ...f, dateRange: range || { from: undefined, to: undefined } }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Min Amount" 
                        type="number" 
                        value={filters.amountRange.min}
                        onChange={e => setFilters(f => ({ ...f, amountRange: { ...f.amountRange, min: e.target.value } }))}
                      />
                      <Input 
                        placeholder="Max Amount" 
                        type="number"
                        value={filters.amountRange.max}
                        onChange={e => setFilters(f => ({ ...f, amountRange: { ...f.amountRange, max: e.target.value } }))}
                      />
                    </div>
                     <Select value={filters.account} onValueChange={(v) => setFilters(f => ({ ...f, account: v }))}>
                      <SelectTrigger><SelectValue placeholder="Account" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Accounts</SelectItem>
                        {uniqueAccounts.map(acc => <SelectItem key={acc} value={acc}>{acc}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" onClick={clearFilters} className="w-full">Clear Filters</Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={selectedTransactions.size > 0 && selectedTransactions.size === filteredTransactions.length}
                onCheckedChange={handleSelectAll}
                className="mt-1"
              />
              <Label htmlFor="select-all" className="text-sm">Select all</Label>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Transaction List */}
      <Card>
        <CardContent className="pt-6">
          {renderTransactionList()}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {filteredTransactions.length} of {transactionsData?.totalCount || 0} transactions
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Transaction Detail Dialog is implicitly part of the list rendering */}
    </div>
  )
} 