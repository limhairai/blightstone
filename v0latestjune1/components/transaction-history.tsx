"use client"

import { useState } from "react"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarIcon,
  DownloadIcon,
  FilterIcon,
  SearchIcon,
  SlidersHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"

interface Transaction {
  id: string
  date: Date
  description: string
  amount: number
  type: "deposit" | "withdrawal" | "transfer"
  status: "completed" | "pending" | "failed"
  account?: string
  reference?: string
}

export function TransactionHistory() {
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [activeTab, setActiveTab] = useState("all")

  // Mock data
  const transactions: Transaction[] = [
    {
      id: "tx1",
      date: new Date(2025, 3, 28),
      description: "Top up - Credit Card",
      amount: 500,
      type: "deposit",
      status: "completed",
      account: "Main Wallet",
      reference: "REF123456",
    },
    {
      id: "tx2",
      date: new Date(2025, 3, 25),
      description: "Ad Account Spend - Facebook",
      amount: -120.5,
      type: "withdrawal",
      status: "completed",
      account: "Facebook Ads",
      reference: "FB-AD-789",
    },
    {
      id: "tx3",
      date: new Date(2025, 3, 22),
      description: "Top up - Bank Transfer",
      amount: 1000,
      type: "deposit",
      status: "pending",
      account: "Main Wallet",
      reference: "BANK-TRF-001",
    },
    {
      id: "tx4",
      date: new Date(2025, 3, 20),
      description: "Ad Account Spend - Google",
      amount: -85.75,
      type: "withdrawal",
      status: "completed",
      account: "Google Ads",
      reference: "GOOG-AD-456",
    },
    {
      id: "tx5",
      date: new Date(2025, 3, 18),
      description: "Top up - Credit Card",
      amount: 750,
      type: "deposit",
      status: "completed",
      account: "Main Wallet",
      reference: "REF789012",
    },
    {
      id: "tx6",
      date: new Date(2025, 3, 15),
      description: "Ad Account Spend - TikTok",
      amount: -210.25,
      type: "withdrawal",
      status: "failed",
      account: "TikTok Ads",
      reference: "TT-AD-123",
    },
    {
      id: "tx7",
      date: new Date(2025, 3, 12),
      description: "Transfer to Campaign Account",
      amount: -350,
      type: "transfer",
      status: "completed",
      account: "Campaign Wallet",
      reference: "INT-TRF-001",
    },
    {
      id: "tx8",
      date: new Date(2025, 3, 10),
      description: "Top up - PayPal",
      amount: 300,
      type: "deposit",
      status: "completed",
      account: "Main Wallet",
      reference: "PP-REF-456",
    },
    {
      id: "tx9",
      date: new Date(2025, 3, 8),
      description: "Ad Account Spend - LinkedIn",
      amount: -175.5,
      type: "withdrawal",
      status: "completed",
      account: "LinkedIn Ads",
      reference: "LI-AD-789",
    },
    {
      id: "tx10",
      date: new Date(2025, 3, 5),
      description: "Transfer from Reserve Account",
      amount: 500,
      type: "transfer",
      status: "completed",
      account: "Main Wallet",
      reference: "INT-TRF-002",
    },
  ]

  // Filter transactions based on active tab and filters
  const filteredTransactions = transactions.filter((tx) => {
    // Filter by tab
    if (activeTab !== "all" && tx.type !== activeTab) return false

    // Filter by search query
    if (searchQuery && !tx.description.toLowerCase().includes(searchQuery.toLowerCase())) return false

    // Filter by status
    if (statusFilter !== "all" && tx.status !== statusFilter) return false

    // Filter by date
    if (date && format(tx.date, "yyyy-MM-dd") !== format(date, "yyyy-MM-dd")) return false

    return true
  })

  // Calculate summary
  const totalDeposits = transactions.filter((tx) => tx.type === "deposit").reduce((sum, tx) => sum + tx.amount, 0)

  const totalWithdrawals = transactions.filter((tx) => tx.type === "withdrawal").reduce((sum, tx) => sum + tx.amount, 0)

  const totalTransfers = transactions.filter((tx) => tx.type === "transfer").reduce((sum, tx) => sum + tx.amount, 0)

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
            {amount > 0 ? <ArrowDownIcon className="h-4 w-4" /> : <ArrowUpIcon className="h-4 w-4" />}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="relative">
      {/* Export button positioned absolutely in the top right */}
      <div className="absolute top-0 right-0 z-10">
        <Button variant="outline" size="sm" className="h-8">
          <DownloadIcon className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards - start at the top with no extra spacing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-0">
        <Card className="bg-card/50 dark:bg-card/50 border-border">
          <CardHeader className="pb-1 pt-3">
            <CardDescription>Total Deposits</CardDescription>
            <CardTitle className="text-2xl text-foreground">${totalDeposits.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <div className="text-xs text-muted-foreground">
              {transactions.filter((tx) => tx.type === "deposit").length} transactions
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 dark:bg-card/50 border-border">
          <CardHeader className="pb-1 pt-3">
            <CardDescription>Total Withdrawals</CardDescription>
            <CardTitle className="text-2xl text-foreground">${Math.abs(totalWithdrawals).toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <div className="text-xs text-muted-foreground">
              {transactions.filter((tx) => tx.type === "withdrawal").length} transactions
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 dark:bg-card/50 border-border">
          <CardHeader className="pb-1 pt-3">
            <CardDescription>Net Balance</CardDescription>
            <CardTitle className="text-2xl text-foreground">
              ${(totalDeposits + totalWithdrawals + totalTransfers).toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <div className="text-xs text-muted-foreground">{transactions.length} total transactions</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Tabs - more compact */}
      <Card className="bg-card/50 dark:bg-card/50 border-border mt-4">
        <CardHeader className="pb-0 pt-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search transactions..."
                  className="pl-8 bg-background/50 dark:bg-background/50 h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9 border-dashed">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" size="icon" className="md:hidden h-9 w-9">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-3">
          <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="deposit">Deposits</TabsTrigger>
              <TabsTrigger value="withdrawal">Withdrawals</TabsTrigger>
              <TabsTrigger value="transfer">Transfers</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
              {renderTransactionsTable()}
            </TabsContent>

            <TabsContent value="deposit" className="mt-0">
              {renderTransactionsTable()}
            </TabsContent>

            <TabsContent value="withdrawal" className="mt-0">
              {renderTransactionsTable()}
            </TabsContent>

            <TabsContent value="transfer" className="mt-0">
              {renderTransactionsTable()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )

  function renderTransactionsTable() {
    return (
      <>
        {paginatedTransactions.length > 0 ? (
          <div className="rounded-md border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 dark:bg-muted/50">
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground"></th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Transaction</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Account</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Reference</th>
                    <th className="text-right p-3 text-xs font-medium text-muted-foreground">Amount</th>
                    <th className="text-right p-3 text-xs font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((tx) => (
                    <tr key={tx.id} className="border-t border-border hover:bg-muted/20 dark:hover:bg-muted/20">
                      <td className="pl-3 py-3 w-10">{getTypeIcon(tx.type, tx.amount)}</td>
                      <td className="py-3 text-sm">
                        <div>{tx.description}</div>
                        <div className="text-xs text-muted-foreground">{format(tx.date, "MMM dd, yyyy")}</div>
                      </td>
                      <td className="p-3 text-sm">{tx.account}</td>
                      <td className="p-3 text-sm font-mono text-xs">{tx.reference}</td>
                      <td className="p-3 text-sm text-right">
                        <span className={getAmountColor(tx.amount)}>
                          {tx.amount > 0 ? "+" : ""}
                          {tx.amount.toFixed(2)} USD
                        </span>
                      </td>
                      <td className="p-3 text-sm text-right text-muted-foreground">
                        <div className="flex items-center justify-end gap-2">
                          <span>{tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}</span>
                          <div className={`w-2 h-2 rounded-full ${getStatusDotColor(tx.status)}`}></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted/20 dark:bg-muted/20 p-3 mb-4">
              <FilterIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No transactions found</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              No transactions match your current filters. Try adjusting your search criteria or clear filters to see all
              transactions.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery("")
                setStatusFilter("all")
                setDate(undefined)
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* Pagination */}
        {filteredTransactions.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
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
}
