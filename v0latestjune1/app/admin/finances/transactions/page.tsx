import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Calendar,
  Download,
  Filter,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  DollarSign,
} from "lucide-react"
import { colors } from "@/lib/design-tokens"

// Transaction type definitions
type TransactionType = "deposit" | "withdrawal" | "transfer" | "fee" | "refund"
type TransactionStatus = "completed" | "pending" | "failed"

interface Transaction {
  id: string
  date: string
  clientName: string
  clientId: string
  accountName: string
  accountId: string
  amount: string
  type: TransactionType
  status: TransactionStatus
  description: string
}

export default function AdminTransactionsPage() {
  // This would come from an API in a real application
  const transactions: Transaction[] = [
    {
      id: "txn_001",
      date: "Apr 28, 2025",
      clientName: "Acme Corporation",
      clientId: "client_001",
      accountName: "Summer Campaign 2025",
      accountId: "acc_001",
      amount: "$5,000.00",
      type: "deposit",
      status: "completed",
      description: "Account Top-Up",
    },
    {
      id: "txn_002",
      date: "Apr 27, 2025",
      clientName: "TechStart Inc.",
      clientId: "client_002",
      accountName: "Product Launch Q2",
      accountId: "acc_002",
      amount: "$175.00",
      type: "fee",
      status: "completed",
      description: "Platform Fee",
    },
    {
      id: "txn_003",
      date: "Apr 26, 2025",
      clientName: "Global Media Group",
      clientId: "client_003",
      accountName: "Brand Awareness",
      accountId: "acc_003",
      amount: "$2,500.00",
      type: "deposit",
      status: "completed",
      description: "Account Top-Up",
    },
    {
      id: "txn_004",
      date: "Apr 25, 2025",
      clientName: "Acme Corporation",
      clientId: "client_001",
      accountName: "Multiple Accounts",
      accountId: "acc_004",
      amount: "$1,000.00",
      type: "transfer",
      status: "completed",
      description: "Transfer Between Accounts",
    },
    {
      id: "txn_005",
      date: "Apr 24, 2025",
      clientName: "TechStart Inc.",
      clientId: "client_002",
      accountName: "Retargeting Campaign",
      accountId: "acc_005",
      amount: "$500.00",
      type: "withdrawal",
      status: "pending",
      description: "Refund Processing",
    },
    {
      id: "txn_006",
      date: "Apr 23, 2025",
      clientName: "Global Media Group",
      clientId: "client_003",
      accountName: "Social Media Campaign",
      accountId: "acc_006",
      amount: "$750.00",
      type: "fee",
      status: "completed",
      description: "Monthly Service Fee",
    },
    {
      id: "txn_007",
      date: "Apr 22, 2025",
      clientName: "Startup Ventures",
      clientId: "client_004",
      accountName: "Lead Generation",
      accountId: "acc_007",
      amount: "$350.00",
      type: "refund",
      status: "pending",
      description: "Partial Refund",
    },
    {
      id: "txn_008",
      date: "Apr 21, 2025",
      clientName: "Enterprise Solutions",
      clientId: "client_005",
      accountName: "Q2 Marketing",
      accountId: "acc_008",
      amount: "$3,200.00",
      type: "deposit",
      status: "completed",
      description: "Initial Deposit",
    },
    {
      id: "txn_009",
      date: "Apr 20, 2025",
      clientName: "Local Business Co.",
      clientId: "client_006",
      accountName: "Local Promotion",
      accountId: "acc_009",
      amount: "$125.00",
      type: "fee",
      status: "failed",
      description: "Processing Fee - Failed",
    },
    {
      id: "txn_010",
      date: "Apr 19, 2025",
      clientName: "E-commerce Shop",
      clientId: "client_007",
      accountName: "Product Ads",
      accountId: "acc_010",
      amount: "$1,800.00",
      type: "deposit",
      status: "completed",
      description: "Campaign Funding",
    },
  ]

  // Function to get type badge
  const getTypeBadge = (type: TransactionType) => {
    switch (type) {
      case "deposit":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            Deposit
          </Badge>
        )
      case "withdrawal":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
            Withdrawal
          </Badge>
        )
      case "transfer":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            Transfer
          </Badge>
        )
      case "fee":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
            Fee
          </Badge>
        )
      case "refund":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            Refund
          </Badge>
        )
    }
  }

  // Function to get status badge
  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            Completed
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Pending
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            Failed
          </Badge>
        )
    }
  }

  // Function to get type icon
  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case "deposit":
        return <ArrowDownToLine className="h-4 w-4 text-green-600" />
      case "withdrawal":
        return <ArrowUpFromLine className="h-4 w-4 text-amber-600" />
      case "transfer":
        return <RefreshCw className="h-4 w-4 text-blue-600" />
      case "fee":
        return <DollarSign className="h-4 w-4 text-purple-600" />
      case "refund":
        return <ArrowUpFromLine className="h-4 w-4 text-red-600" />
    }
  }

  return (
    <AdminLayout title="Transaction Management">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className={`${colors.cardGradient} ${colors.cardBorder} border`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${colors.textMuted} text-sm`}>Total Transactions</p>
                  <h3 className="text-2xl font-bold mt-1">1,248</h3>
                  <p className="text-xs mt-1 text-[#b4a0ff]">Last 30 days</p>
                </div>
                <div className="h-12 w-12 bg-[#1A1A1A] rounded-full flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 text-[#b4a0ff]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${colors.cardGradient} ${colors.cardBorder} border`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${colors.textMuted} text-sm`}>Total Volume</p>
                  <h3 className="text-2xl font-bold mt-1">$124,350.00</h3>
                  <p className="text-xs mt-1 text-[#b4a0ff]">Last 30 days</p>
                </div>
                <div className="h-12 w-12 bg-[#1A1A1A] rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-[#b4a0ff]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${colors.cardGradient} ${colors.cardBorder} border`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${colors.textMuted} text-sm`}>Avg. Transaction</p>
                  <h3 className="text-2xl font-bold mt-1">$1,850.00</h3>
                  <p className="text-xs mt-1 text-[#b4a0ff]">+3.7% from last month</p>
                </div>
                <div className="h-12 w-12 bg-[#1A1A1A] rounded-full flex items-center justify-center">
                  <ArrowDownToLine className="h-6 w-6 text-[#b4a0ff]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${colors.cardGradient} ${colors.cardBorder} border`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${colors.textMuted} text-sm`}>Pending Transactions</p>
                  <h3 className="text-2xl font-bold mt-1">12</h3>
                  <p className="text-xs mt-1 text-[#b4a0ff]">Requires attention</p>
                </div>
                <div className="h-12 w-12 bg-[#1A1A1A] rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-[#b4a0ff]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card className={`${colors.cardGradient} ${colors.cardBorder} border`}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Transaction History</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Button variant="default" size="sm" className="h-8 bg-[#b4a0ff] text-black hover:bg-[#a090ef]">
                <span>Sync with Airtable</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search transactions..." className="pl-9 bg-[#111111] border-[#1A1A1A]" />
                </div>
                <div className="flex gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[130px] bg-[#111111] border-[#1A1A1A]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="deposit">Deposits</SelectItem>
                      <SelectItem value="withdrawal">Withdrawals</SelectItem>
                      <SelectItem value="transfer">Transfers</SelectItem>
                      <SelectItem value="fee">Fees</SelectItem>
                      <SelectItem value="refund">Refunds</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[130px] bg-[#111111] border-[#1A1A1A]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" className="border-[#1A1A1A]">
                    <Calendar className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Table */}
              <div className="rounded-md border border-[#1A1A1A] overflow-hidden">
                <Table>
                  <TableHeader className="bg-[#111111]">
                    <TableRow className="hover:bg-[#1A1A1A] border-b border-[#1A1A1A]">
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id} className="hover:bg-[#1A1A1A] border-b border-[#1A1A1A]">
                        <TableCell className="font-mono text-xs">{transaction.id}</TableCell>
                        <TableCell>{transaction.date}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{transaction.clientName}</p>
                            <p className="text-xs text-muted-foreground">{transaction.clientId}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{transaction.accountName}</p>
                            <p className="text-xs text-muted-foreground">{transaction.accountId}</p>
                          </div>
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(transaction.type)}
                            {getTypeBadge(transaction.type)}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                        <TableCell className="text-right font-medium">{transaction.amount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Showing 10 of 1,248 transactions</p>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-[#1A1A1A]">
                    1
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-[#1A1A1A] bg-[#1A1A1A]">
                    2
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-[#1A1A1A]">
                    3
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-[#1A1A1A]">
                    ...
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-[#1A1A1A]">
                    125
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
