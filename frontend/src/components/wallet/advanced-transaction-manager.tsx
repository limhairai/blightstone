"use client"

import { useState, useMemo } from "react"
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
import { formatCurrency, transactionColors } from "../../lib/mock-data"
import { useAppData } from "../../contexts/AppDataContext"
import { toast } from "sonner"
import { format } from "date-fns"

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

export function AdvancedTransactionManager() {
  const { state } = useAppData()
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
  const [sortBy, setSortBy] = useState<"date" | "amount" | "type">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [isExporting, setIsExporting] = useState(false)

  // Enhanced transaction data with more details
  const enhancedTransactions = useMemo(() => {
    return state.transactions.map(tx => ({
      ...tx,
      status: Math.random() > 0.1 ? "completed" : Math.random() > 0.5 ? "pending" : "failed",
      fee: Math.round(Math.abs(tx.amount) * 0.025), // 2.5% fee
      reference: `TXN-${tx.id.toString().padStart(6, '0')}`,
      description: tx.type === "topup" ? "Wallet top-up" : 
                  tx.type === "withdrawal" ? "Account funding" :
                  tx.type === "spend" ? "Ad spend" : "Internal transfer",
      category: tx.type === "spend" ? "advertising" : "funding",
      paymentMethod: tx.type === "topup" ? "Credit Card" : "Bank Transfer"
    }))
  }, [state.transactions])

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = enhancedTransactions.filter(tx => {
      // Search filter
      if (filters.search && !tx.description.toLowerCase().includes(filters.search.toLowerCase()) &&
          !tx.reference.toLowerCase().includes(filters.search.toLowerCase()) &&
          !(tx.fromAccount || tx.toAccount || '').toLowerCase().includes(filters.search.toLowerCase())) {
        return false
      }

      // Type filter
      if (filters.type !== "all" && tx.type !== filters.type) {
        return false
      }

      // Status filter
      if (filters.status !== "all" && tx.status !== filters.status) {
        return false
      }

      // Amount range filter
      if (filters.amountRange.min && Math.abs(tx.amount) < parseFloat(filters.amountRange.min)) {
        return false
      }
      if (filters.amountRange.max && Math.abs(tx.amount) > parseFloat(filters.amountRange.max)) {
        return false
      }

      // Account filter
      if (filters.account !== "all" && (tx.fromAccount || tx.toAccount) !== filters.account) {
        return false
      }

      // Date range filter
      if (filters.dateRange.from || filters.dateRange.to) {
        const txDate = new Date(tx.date)
        if (filters.dateRange.from && txDate < filters.dateRange.from) return false
        if (filters.dateRange.to && txDate > filters.dateRange.to) return false
      }

      return true
    })

    // Sort transactions
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
        case "amount":
          comparison = Math.abs(a.amount) - Math.abs(b.amount)
          break
        case "type":
          comparison = a.type.localeCompare(b.type)
          break
      }
      
      return sortOrder === "asc" ? comparison : -comparison
    })

    return filtered
  }, [enhancedTransactions, filters, sortBy, sortOrder])

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
      setSelectedTransactions(new Set(filteredTransactions.map(tx => tx.id.toString())))
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

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transaction Management</CardTitle>
            <div className="flex items-center gap-2">
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
              {selectedTransactions.size > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Bulk Actions ({selectedTransactions.size})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkAction("export")}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction("retry")}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry Failed
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction("cancel")}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Pending
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>

            {/* Type Filter */}
            <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="deposit">Deposits</SelectItem>
                <SelectItem value="withdrawal">Withdrawals</SelectItem>
                <SelectItem value="transfer">Transfers</SelectItem>
                <SelectItem value="spend">Ad Spend</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            {/* Account Filter */}
            <Select value={filters.account} onValueChange={(value) => setFilters(prev => ({ ...prev, account: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="All Accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {uniqueAccounts.map(account => (
                  <SelectItem key={account} value={account}>{account}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            {/* Amount Range */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="Min amount"
                type="number"
                value={filters.amountRange.min}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  amountRange: { ...prev.amountRange, min: e.target.value }
                }))}
                className="w-32"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                placeholder="Max amount"
                type="number"
                value={filters.amountRange.max}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  amountRange: { ...prev.amountRange, max: e.target.value }
                }))}
                className="w-32"
              />
            </div>

            {/* Date Range */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateRange.from ? (
                    filters.dateRange.to ? (
                      <>
                        {format(filters.dateRange.from, "LLL dd, y")} -{" "}
                        {format(filters.dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(filters.dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={filters.dateRange.from}
                  selected={filters.dateRange}
                  onSelect={(range) => setFilters(prev => ({ ...prev, dateRange: range || { from: undefined, to: undefined } }))}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            <Button variant="ghost" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Checkbox
                checked={selectedTransactions.size === filteredTransactions.length && filteredTransactions.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                {filteredTransactions.length} transactions
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Sort by Date</SelectItem>
                  <SelectItem value="amount">Sort by Amount</SelectItem>
                  <SelectItem value="type">Sort by Type</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={selectedTransactions.has(transaction.id.toString())}
                    onCheckedChange={() => handleSelectTransaction(transaction.id.toString())}
                  />
                  {getTransactionIcon(transaction.type, transaction.amount)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{transaction.description}</span>
                      {getStatusBadge(transaction.status)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {transaction.reference} • {transaction.fromAccount || transaction.toAccount || 'Unknown'} • {transaction.paymentMethod}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className={`font-medium ${transaction.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
                      {transaction.amount > 0 ? '+' : ''}${formatCurrency(Math.abs(transaction.amount))}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Fee: ${formatCurrency(transaction.fee)}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium">{transaction.date}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(transaction.date).toLocaleTimeString()}
                    </div>
                  </div>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => setViewTransaction(transaction)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Transaction Details</DialogTitle>
                      </DialogHeader>
                      {viewTransaction && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Reference</label>
                              <p className="font-mono">{viewTransaction.reference}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Status</label>
                              <div className="mt-1">{getStatusBadge(viewTransaction.status)}</div>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Amount</label>
                              <p className="text-lg font-semibold">
                                {viewTransaction.amount > 0 ? '+' : ''}${formatCurrency(Math.abs(viewTransaction.amount))}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Fee</label>
                              <p>${formatCurrency(viewTransaction.fee)}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Account</label>
                              <p>{viewTransaction.fromAccount || viewTransaction.toAccount || 'Unknown'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
                              <p>{viewTransaction.paymentMethod}</p>
                            </div>
                            <div className="col-span-2">
                              <label className="text-sm font-medium text-muted-foreground">Description</label>
                              <p>{viewTransaction.description}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 