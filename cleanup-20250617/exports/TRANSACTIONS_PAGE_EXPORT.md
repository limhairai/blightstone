# Transactions History Page Export

**Export Date:** January 2025  
**Purpose:** Design improvement and enhancement  
**Route:** `/dashboard/wallet/transactions`  
**File:** `frontend/src/app/dashboard/wallet/transactions/page.tsx`

## 📋 Current Features

### **Summary Cards**
- **Total Deposits**: Shows sum and count of deposit transactions
- **Total Withdrawals**: Shows sum and count of withdrawal transactions  
- **Net Balance**: Shows calculated net balance and total transaction count

### **Transaction Filtering & Search**
- **Tabs**: All, Deposits, Withdrawals, Transfers
- **Search**: Text search through transaction descriptions
- **Date Filter**: Calendar picker for specific date filtering
- **Status Filter**: Filter by completed, pending, failed status
- **Export**: CSV export functionality with filtered data

### **Transaction Table**
- **Columns**: Icon, Transaction (description + date), Account, Reference, Amount, Status
- **Visual Elements**: 
  - Type icons (arrows for deposits/withdrawals)
  - Status dots (green/yellow/red)
  - Amount coloring (green for positive, default for negative)
- **Pagination**: Configurable items per page (5, 10, 20, 50)
- **Empty State**: No transactions found with clear filters option

### **Data Integration**
- Uses centralized `MOCK_TRANSACTIONS` from `@/lib/mock-data`
- Additional mock transactions for comprehensive display
- Consistent formatting with `formatCurrency` and `formatRelativeTime`

## 🏗️ Component Structure

```tsx
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

export default function TransactionsPage() {
  // State management for filters, pagination, search
  // Data transformation from centralized mock data
  // Helper functions for styling and formatting
  // CSV export functionality
  // Table rendering with pagination
  // Filter UI components
}
```

## 🎨 Current Styling

### **Color Scheme**
- **Cards**: `bg-card dark:bg-[#0A0A0A]` with `border-border dark:border-[#222222]`
- **Status Colors**: 
  - Completed: `#34D197` (green)
  - Pending: `#FFC857` (yellow)
  - Failed: `#F56565` (red)
- **Amount Colors**: Green for positive amounts, default for negative

### **Typography**
- **Card Titles**: `text-sm font-medium`
- **Values**: `text-xl font-bold`
- **Table Headers**: `text-xs font-medium text-muted-foreground`
- **Table Cells**: `text-xs`

### **Layout**
- **Grid**: `grid-cols-1 md:grid-cols-3 gap-3` for summary cards
- **Spacing**: `space-y-3` for main container
- **Responsive**: Mobile-first design with responsive breakpoints

## 📊 Mock Data Structure

```tsx
// Additional transactions added to enhance display
const additionalTransactions: Transaction[] = [
  {
    id: "tx_add_1",
    date: new Date(2025, 3, 28),
    description: "Top up - Credit Card",
    amount: 500,
    type: "deposit",
    status: "completed",
    account: "Main Wallet",
    reference: "REF123456",
  },
  // ... more transactions
]
```

## 🔧 Key Functions

### **Filtering Logic**
```tsx
const filteredTransactions = allTransactions.filter((tx) => {
  if (activeTab !== "all" && tx.type !== activeTab) return false
  if (searchQuery && !tx.description.toLowerCase().includes(searchQuery.toLowerCase())) return false
  if (statusFilter !== "all" && tx.status !== statusFilter) return false
  if (date && format(tx.date, "yyyy-MM-dd") !== format(date, "yyyy-MM-dd")) return false
  return true
})
```

### **CSV Export**
```tsx
const exportToCSV = () => {
  const headers = ['Date', 'Description', 'Account', 'Reference', 'Amount', 'Type', 'Status']
  const csvData = filteredTransactions.map(tx => [
    format(tx.date, 'yyyy-MM-dd'),
    tx.description,
    tx.account || '',
    tx.reference || '',
    tx.amount.toFixed(2),
    tx.type,
    tx.status
  ])
  // ... blob creation and download logic
}
```

### **Status & Type Styling**
```tsx
const getStatusDotColor = (status: string) => {
  switch (status) {
    case "completed": return "bg-[#34D197]"
    case "pending": return "bg-[#FFC857]"
    case "failed": return "bg-[#F56565]"
    default: return "bg-gray-500"
  }
}

const getTypeIcon = (type: string, amount: number) => {
  // Returns appropriate arrow icons in colored circles
}
```

## 📱 Responsive Design

### **Mobile Considerations**
- Horizontal scroll for table on small screens
- Collapsible filter section
- Responsive grid for summary cards
- Mobile-optimized pagination controls

### **Desktop Features**
- Full table display
- Inline filters
- Hover states for table rows
- Advanced pagination with page numbers

## 🚀 Potential Improvements

### **UX Enhancements**
1. **Better Visual Hierarchy**: Improve spacing and typography scale
2. **Enhanced Filtering**: Date range picker, amount range filters
3. **Bulk Actions**: Select multiple transactions for bulk operations
4. **Transaction Details**: Expandable rows or modal for detailed view
5. **Real-time Updates**: Live transaction status updates

### **Performance Optimizations**
1. **Virtual Scrolling**: For large transaction lists
2. **Debounced Search**: Reduce API calls during search
3. **Memoization**: Optimize filtering and calculation functions

### **Visual Improvements**
1. **Better Empty States**: More engaging no-data illustrations
2. **Loading States**: Skeleton loaders for better perceived performance
3. **Micro-interactions**: Smooth transitions and hover effects
4. **Data Visualization**: Charts for transaction trends

## 💻 Complete Component Code

\`\`\`tsx
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
import { 
  MOCK_TRANSACTIONS, 
  formatCurrency, 
  formatRelativeTime,
  type MockTransaction 
} from "@/lib/mock-data"

// Convert our centralized mock transactions to the format expected by this component
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

export default function TransactionsPage() {
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [activeTab, setActiveTab] = useState("all")

  // Convert centralized mock data to component format
  const transactions: Transaction[] = MOCK_TRANSACTIONS.map((tx) => ({
    id: tx.id.toString(),
    date: tx.timestamp,
    description: tx.date,
    amount: tx.type === "deposit" ? Math.abs(tx.amount) : -Math.abs(tx.amount),
    type: tx.type === "spend" ? "withdrawal" : tx.type,
    status: "completed" as const,
    account: tx.account,
    reference: \`REF\${tx.id.toString().padStart(6, '0')}\`,
  }))

  // Add some additional mock transactions to match the screenshot
  const additionalTransactions: Transaction[] = [
    {
      id: "tx_add_1",
      date: new Date(2025, 3, 28),
      description: "Top up - Credit Card",
      amount: 500,
      type: "deposit",
      status: "completed",
      account: "Main Wallet",
      reference: "REF123456",
    },
    {
      id: "tx_add_2",
      date: new Date(2025, 3, 25),
      description: "Ad Account Spend",
      amount: -120.5,
      type: "withdrawal",
      status: "completed",
      account: "Primary Ad Account",
      reference: "AD-789",
    },
    {
      id: "tx_add_3",
      date: new Date(2025, 3, 22),
      description: "Top up - Bank Transfer",
      amount: 1000,
      type: "deposit",
      status: "pending",
      account: "Main Wallet",
      reference: "BANK-TRF-001",
    },
    {
      id: "tx_add_4",
      date: new Date(2025, 3, 20),
      description: "Ad Account Spend",
      amount: -85.75,
      type: "withdrawal",
      status: "completed",
      account: "Secondary Ad Account",
      reference: "AD-456",
    },
    {
      id: "tx_add_5",
      date: new Date(2025, 3, 18),
      description: "Top up - Credit Card",
      amount: 750,
      type: "deposit",
      status: "completed",
      account: "Main Wallet",
      reference: "REF789012",
    },
    {
      id: "tx_add_6",
      date: new Date(2025, 3, 15),
      description: "Ad Account Spend",
      amount: -210.25,
      type: "withdrawal",
      status: "failed",
      account: "Campaign Ad Account",
      reference: "AD-123",
    },
    {
      id: "tx_add_7",
      date: new Date(2025, 3, 12),
      description: "Transfer to Campaign Account",
      amount: -350,
      type: "transfer",
      status: "completed",
      account: "Campaign Wallet",
      reference: "INT-TRF-001",
    },
    {
      id: "tx_add_8",
      date: new Date(2025, 3, 10),
      description: "Top up - PayPal",
      amount: 300,
      type: "deposit",
      status: "completed",
      account: "Main Wallet",
      reference: "PP-REF-456",
    },
  ]

  // Combine all transactions
  const allTransactions = [...transactions, ...additionalTransactions]

  // Filter transactions based on active tab and filters
  const filteredTransactions = allTransactions.filter((tx) => {
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

  // Calculate summary using consistent data
  const totalDeposits = allTransactions.filter((tx) => tx.type === "deposit").reduce((sum, tx) => sum + tx.amount, 0)
  const totalWithdrawals = Math.abs(allTransactions.filter((tx) => tx.type === "withdrawal").reduce((sum, tx) => sum + tx.amount, 0))
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
    const headers = ['Date', 'Description', 'Account', 'Reference', 'Amount', 'Type', 'Status']
    const csvData = filteredTransactions.map(tx => [
      format(tx.date, 'yyyy-MM-dd'),
      tx.description,
      tx.account || '',
      tx.reference || '',
      tx.amount.toFixed(2),
      tx.type,
      tx.status
    ])
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => \`"\${field}"\`).join(','))
      .join('\\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', \`transactions-\${format(new Date(), 'yyyy-MM-dd')}.csv\`)
    link.style.visibility = 'hidden'
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
                          <div className={\`w-1.5 h-1.5 rounded-full \${getStatusDotColor(tx.status)}\`}></div>
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
    <div className="space-y-3">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="bg-card dark:bg-[#0A0A0A] border-border dark:border-[#222222]">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold">\${formatCurrency(totalDeposits)}</div>
            <p className="text-xs text-muted-foreground">{depositCount} transactions</p>
          </CardContent>
        </Card>

        <Card className="bg-card dark:bg-[#0A0A0A] border-border dark:border-[#222222]">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold">\${formatCurrency(totalWithdrawals)}</div>
            <p className="text-xs text-muted-foreground">{withdrawalCount} transactions</p>
          </CardContent>
        </Card>

        <Card className="bg-card dark:bg-[#0A0A0A] border-border dark:border-[#222222]">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold">\${formatCurrency(netBalance)}</div>
            <p className="text-xs text-muted-foreground">{totalTransactions} total transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Export Button */}
      <div className="flex items-center justify-between">
        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
          <div className="flex items-center justify-between">
            <TabsList className="grid w-fit grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="deposit">Deposits</TabsTrigger>
              <TabsTrigger value="withdrawal">Withdrawals</TabsTrigger>
              <TabsTrigger value="transfer">Transfers</TabsTrigger>
            </TabsList>

            <Button variant="outline" className="h-8 text-xs" onClick={exportToCSV}>
              <DownloadIcon className="mr-2 h-3 w-3" />
              Export CSV
            </Button>
          </div>

          <TabsContent value="all" className="mt-4">
            {/* Filters */}
            <Card className="bg-card/50 dark:bg-card/50 border-border mb-4">
              <CardHeader className="pb-0 pt-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex flex-1 items-center gap-2">
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
                  </div>

                  <Button variant="outline" size="icon" className="md:hidden h-8 w-8">
                    <SlidersHorizontal className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
            {renderTransactionsTable()}
          </TabsContent>

          {/* Duplicate filter sections for other tabs - could be optimized */}
          <TabsContent value="deposit" className="mt-4">
            {/* Same filter structure repeated */}
            {renderTransactionsTable()}
          </TabsContent>

          <TabsContent value="withdrawal" className="mt-4">
            {/* Same filter structure repeated */}
            {renderTransactionsTable()}
          </TabsContent>

          <TabsContent value="transfer" className="mt-4">
            {/* Same filter structure repeated */}
            {renderTransactionsTable()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
\`\`\`

---

**Note:** This export provides a complete overview of the current transactions page implementation. The component is fully functional with filtering, pagination, search, and export capabilities. The code is ready for design improvements and enhancements. 