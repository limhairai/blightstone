"use client"

import { useState } from "react"

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic'
import { ArrowDownIcon, ArrowUpIcon, CalendarIcon, DownloadIcon, FilterIcon, SearchIcon, SlidersHorizontal, Receipt } from 'lucide-react'
import { Button } from "../../../components/ui/button"
import { Card, CardHeader } from "../../../components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../components/ui/tabs"
import { Input } from "../../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "../../../components/ui/popover"
import { Calendar } from "../../../components/ui/calendar"
import { format } from "date-fns"
import { formatCurrency, MOCK_BUSINESSES } from "../../../lib/mock-data"
import { useDemoState } from "../../../contexts/DemoStateContext"
import { usePageTitle } from "../../../components/core/simple-providers"
import { useEffect } from "react"
import { ErrorBoundary } from "../../../components/ui/error-boundary"

// Transaction interface with business information
interface Transaction {
  id: string
  date: Date
  description: string
  amount: number
  type: "deposit" | "withdrawal" | "transfer"
  status: "completed" | "pending" | "failed"
  account?: string
  reference?: string
  businessId?: string
  businessName?: string
}

// Business interface for filtering
interface Business {
  id: string
  name: string
}

export default function TransactionsPage() {
  const { setPageTitle } = usePageTitle()
  const { state } = useDemoState()
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [businessFilter, setBusinessFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    setPageTitle("Transactions")
  }, [setPageTitle])

  // Get businesses for the filter dropdown
  const businesses: Business[] = MOCK_BUSINESSES.map((business) => ({
    id: business.id,
    name: business.name,
  }))

  // Helper function to generate status
  const generateStatus = (): "completed" | "pending" | "failed" => {
    const rand = Math.random()
    if (rand > 0.1) return "completed"
    if (rand > 0.05) return "pending" 
    return "failed"
  }

  // Convert demo state transactions to component format and add business information
  const allTransactions: Transaction[] = state.transactions.map((tx) => {
    // Map transaction to business based on account name or create business associations
    let businessId: string | undefined
    let businessName: string | undefined
    
    // Simple mapping based on account names - you can make this more sophisticated
    if (tx.account.includes("TechFlow") || tx.account.includes("Primary")) {
      businessId = "1"
      businessName = "TechFlow Solutions"
    } else if (tx.account.includes("Digital") || tx.account.includes("Secondary")) {
      businessId = "2" 
      businessName = "Digital Marketing Co"
    } else if (tx.account.includes("Startup") || tx.account.includes("Campaign")) {
      businessId = "3"
      businessName = "StartupHub Inc"
    }

    return {
      id: tx.id.toString(),
      date: new Date(tx.timestamp),
      description: tx.name,
      amount: tx.amount,
      type: tx.type === "spend" ? "withdrawal" : tx.type,
      status: generateStatus(),
      account: tx.account,
      reference: `REF${tx.id.toString().padStart(6, '0')}`,
      businessId,
      businessName,
    }
  }).sort((a, b) => b.date.getTime() - a.date.getTime()) // Sort by date descending

  // Filter transactions based on active tab and filters
  const filteredTransactions = allTransactions.filter((tx) => {
    // Filter by tab
    if (activeTab !== "all" && tx.type !== activeTab) return false

    // Filter by search query
    if (searchQuery && !tx.description.toLowerCase().includes(searchQuery.toLowerCase())) return false

    // Filter by status
    if (statusFilter !== "all" && tx.status !== statusFilter) return false

    // Filter by business
    if (businessFilter !== "all") {
      if (businessFilter === "main" && tx.businessId) return false
      if (businessFilter !== "main" && tx.businessId !== businessFilter) return false
    }

    // Filter by date
    if (date && format(tx.date, "yyyy-MM-dd") !== format(date, "yyyy-MM-dd")) return false

    return true
  })

  // Calculate metrics using real data
  const completedTransactions = allTransactions.filter((tx) => tx.status === "completed").length
  const pendingTransactions = allTransactions.filter((tx) => tx.status === "pending").length
  const totalVolume = allTransactions
    .filter((tx) => tx.status === "completed")
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)

  // Calculate summary using consistent data
  const totalDeposits = allTransactions.filter((tx) => tx.type === "deposit").reduce((sum, tx) => sum + tx.amount, 0)
  const totalWithdrawals = Math.abs(
    allTransactions.filter((tx) => tx.type === "withdrawal").reduce((sum, tx) => sum + tx.amount, 0),
  )
  const netBalance = totalDeposits - totalWithdrawals
  const totalTransactions = allTransactions.length

  // Count transactions by type
  const depositCount = allTransactions.filter((tx) => tx.type === "deposit").length
  const withdrawalCount = allTransactions.filter((tx) => tx.type === "withdrawal").length

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
        return null
    }
  }

  // Export CSV functionality
  const exportToCSV = () => {
    const headers = ["Date", "Description", "Business", "Account", "Reference", "Amount", "Type", "Status"]
    const csvData = filteredTransactions.map((tx) => [
      format(tx.date, "yyyy-MM-dd"),
      tx.description,
      tx.businessName || "Main Wallet",
      tx.account || "",
      tx.reference || "",
      tx.amount.toFixed(2),
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
    return (
      <>
        {paginatedTransactions.length > 0 ? (
          <div className="rounded-md border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 dark:bg-muted/50">
                    <th className="text-left p-2 text-xs font-medium text-muted-foreground"></th>
                    <th className="text-left p-2 text-xs font-medium text-muted-foreground">Transaction</th>
                    <th className="text-left p-2 text-xs font-medium text-muted-foreground">Business</th>
                    <th className="text-left p-2 text-xs font-medium text-muted-foreground">Account</th>
                    <th className="text-left p-2 text-xs font-medium text-muted-foreground">Reference</th>
                    <th className="text-right p-2 text-xs font-medium text-muted-foreground">Amount</th>
                    <th className="text-right p-2 text-xs font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((tx) => (
                    <tr key={tx.id} className="border-t border-border hover:bg-muted/20 dark:hover:bg-muted/20">
                      <td className="pl-2 py-2 w-8">{getTypeIcon(tx.type, tx.amount)}</td>
                      <td className="py-2 text-xs">
                        <div className="font-medium">{tx.description}</div>
                        <div className="text-xs text-muted-foreground">{format(tx.date, "MMM dd, yyyy")}</div>
                      </td>
                      <td className="p-2 text-xs">{tx.businessName || "Main Wallet"}</td>
                      <td className="p-2 text-xs">{tx.account}</td>
                      <td className="p-2 text-xs font-mono">{tx.reference}</td>
                      <td className="p-2 text-xs text-right">
                        <span className={getAmountColor(tx.amount)}>
                          {tx.amount > 0 ? "+" : ""}
                          {tx.amount.toFixed(2)} USD
                        </span>
                      </td>
                      <td className="p-2 text-xs text-right text-muted-foreground">
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
              className="mt-4"
              onClick={() => {
                setSearchQuery("")
                setStatusFilter("all")
                setBusinessFilter("all")
                setDate(undefined)
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
                      className="w-8 h-8 p-0"
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
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header with metrics matching accounts page */}
        <div className="space-y-4">
          {/* Tab-like navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="text-foreground bg-accent">
                  <Receipt className="h-4 w-4 mr-2" />
                  Transactions
                </Button>
              </div>
            </div>

            <Button variant="outline" className="h-9" onClick={exportToCSV}>
              <DownloadIcon className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {/* Compact Metrics matching businesses page exactly */}
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
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                TOTAL VOLUME
              </div>
              <div className="text-sm font-semibold">${formatCurrency(totalVolume)}</div>
            </div>
          </div>
        </div>

        {/* Tabs and Filters */}
        <div className="space-y-4">
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
                            <Button variant="outline" className="h-8 border-dashed text-xs">
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

                    <Button variant="outline" size="icon" className="md:hidden h-8 w-8">
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
      </div>
    </ErrorBoundary>
  )
} 