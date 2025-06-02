"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  CreditCard,
  BarChart3,
  ExternalLink,
  Edit,
  Archive,
  Trash2,
  Users,
  Clock,
  PieChart,
  Download,
  ChevronDown,
  Filter,
} from "lucide-react"
import { colors } from "@/lib/design-tokens"
import { AccountTopUpDialog } from "@/components/account-top-up-dialog"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"

// Mock data for a single account
const mockAccountData = {
  "1": {
    id: "1",
    name: "Primary Ad Account",
    accountId: "123456789",
    businessManagerId: "987654321",
    timezone: "America/New_York (UTC-04:00)",
    status: "active" as const,
    balance: "$750.00",
    spendLimit: "$1,000",
    dateAdded: "Oct 15, 2023",
    spendToday: "$45.20",
    spendThisWeek: "$320.75",
    spendThisMonth: "$680.50",
    transactions: [
      {
        id: "tx1",
        date: "Apr 28, 2025",
        type: "Top Up",
        description: "Manual balance top up",
        amount: "+$250.00",
        balanceAfter: "$750.00",
        status: "Completed",
        paymentMethod: "Bank Transfer",
      },
      {
        id: "tx2",
        date: "Apr 15, 2025",
        type: "Top Up",
        description: "Manual balance top up",
        amount: "+$500.00",
        balanceAfter: "$500.00",
        status: "Completed",
        paymentMethod: "Credit Card",
      },
      {
        id: "tx3",
        date: "Apr 01, 2025",
        type: "Withdraw",
        description: "Manual withdrawal",
        amount: "-$100.00",
        balanceAfter: "$0.00",
        status: "Completed",
        paymentMethod: "Bank Transfer",
      },
      {
        id: "tx4",
        date: "Mar 28, 2025",
        type: "Top Up",
        description: "Manual balance top up",
        amount: "+$100.00",
        balanceAfter: "$100.00",
        status: "Completed",
        paymentMethod: "Credit Card",
      },
    ],
    performanceData: {
      spend: 680.5,
      impressions: 125000,
      clicks: 3750,
      conversions: 85,
      ctr: 3.0,
      cpc: 0.18,
    },
    users: [
      { id: "user1", name: "John Doe", email: "john@example.com", role: "Admin" },
      { id: "user2", name: "Jane Smith", email: "jane@example.com", role: "Editor" },
    ],
    billingSettings: {
      billingThreshold: "$500.00",
      paymentMethod: "Visa ending in 4242",
      billingEmail: "billing@example.com",
    },
  },
  "2": {
    id: "2",
    name: "Secondary Campaign",
    accountId: "987654321",
    businessManagerId: "987654321",
    timezone: "Europe/London (UTC+01:00)",
    status: "active" as const,
    balance: "$1,200.00",
    spendLimit: "$2,500",
    dateAdded: "Nov 02, 2023",
    spendToday: "$78.50",
    spendThisWeek: "$425.30",
    spendThisMonth: "$980.25",
    transactions: [],
    performanceData: {
      spend: 980.25,
      impressions: 200000,
      clicks: 6200,
      conversions: 120,
      ctr: 3.1,
      cpc: 0.16,
    },
    users: [{ id: "user1", name: "John Doe", email: "john@example.com", role: "Admin" }],
    billingSettings: {
      billingThreshold: "$1000.00",
      paymentMethod: "Mastercard ending in 5555",
      billingEmail: "billing@example.com",
    },
  },
  "3": {
    id: "3",
    name: "Test Account",
    accountId: "456789123",
    businessManagerId: "123789456",
    timezone: "Asia/Tokyo (UTC+09:00)",
    status: "active" as const,
    balance: "$500.00",
    spendLimit: "$500",
    dateAdded: "Dec 10, 2023",
    spendToday: "$12.40",
    spendThisWeek: "$85.60",
    spendThisMonth: "$210.30",
    transactions: [],
    performanceData: {
      spend: 210.3,
      impressions: 45000,
      clicks: 1200,
      conversions: 25,
      ctr: 2.7,
      cpc: 0.18,
    },
    users: [],
    billingSettings: {
      billingThreshold: "$200.00",
      paymentMethod: "Bank Transfer",
      billingEmail: "test@example.com",
    },
  },
  "4": {
    id: "4",
    name: "Product Launch",
    accountId: "567891234",
    businessManagerId: "987654321",
    timezone: "America/Los_Angeles (UTC-07:00)",
    status: "active" as const,
    balance: "$3,200.00",
    spendLimit: "$5,000",
    dateAdded: "Jan 05, 2024",
    spendToday: "$125.80",
    spendThisWeek: "$780.45",
    spendThisMonth: "$1,850.20",
    transactions: [],
    performanceData: {
      spend: 1850.2,
      impressions: 320000,
      clicks: 9500,
      conversions: 210,
      ctr: 3.0,
      cpc: 0.19,
    },
    users: [],
    billingSettings: {
      billingThreshold: "$1000.00",
      paymentMethod: "AmEx ending in 1234",
      billingEmail: "product@example.com",
    },
  },
  "5": {
    id: "5",
    name: "New Marketing Campaign",
    accountId: "234567890",
    businessManagerId: "123789456",
    timezone: "Europe/Berlin (UTC+02:00)",
    status: "pending" as const,
    balance: "$0.00",
    spendLimit: "$1,500",
    dateAdded: "Apr 25, 2025",
    spendToday: "$0.00",
    spendThisWeek: "$0.00",
    spendThisMonth: "$0.00",
    transactions: [],
    performanceData: {
      spend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0,
      cpc: 0,
    },
    users: [],
    billingSettings: {
      billingThreshold: "$500.00",
      paymentMethod: "Pending",
      billingEmail: "marketing@example.com",
    },
  },
  "6": {
    id: "6",
    name: "Q3 Promotion",
    accountId: "345678901",
    businessManagerId: "987654321",
    timezone: "Australia/Sydney (UTC+10:00)",
    status: "pending" as const,
    balance: "$0.00",
    spendLimit: "$2,000",
    dateAdded: "Apr 27, 2025",
    spendToday: "$0.00",
    spendThisWeek: "$0.00",
    spendThisMonth: "$0.00",
    transactions: [],
    performanceData: {
      spend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0,
      cpc: 0,
    },
    users: [],
    billingSettings: {
      billingThreshold: "$750.00",
      paymentMethod: "Pending",
      billingEmail: "promo@example.com",
    },
  },
}

export default function AccountDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const accountId = params.id as string
  const [account, setAccount] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call to fetch account details
    setTimeout(() => {
      setAccount(mockAccountData[accountId as keyof typeof mockAccountData] || null)
      setLoading(false)
    }, 500)
  }, [accountId])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-pulse text-[#6C6C6C]">Loading account details...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!account) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <h2 className="text-xl font-semibold mb-4">Account not found</h2>
          <Button onClick={() => router.push("/accounts")}>Back to Accounts</Button>
        </div>
      </DashboardLayout>
    )
  }

  const spendPercentage =
    (Number.parseFloat(account.spendThisMonth.replace("$", "")) /
      Number.parseFloat(account.spendLimit.replace("$", ""))) *
    100

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/accounts")}
              className="bg-secondary/20 rounded-full h-8 w-8 flex items-center justify-center"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{account.name}</h1>
              <p className="text-sm text-muted-foreground">Account ID: {account.accountId}</p>
            </div>
            <Badge
              variant="outline"
              className={`
                ${account.status === "active" ? "bg-green-950/30 text-green-400 border-green-900/50" : ""}
                ${account.status === "pending" ? "bg-yellow-950/30 text-yellow-400 border-yellow-900/50" : ""}
                ${account.status === "disabled" ? "bg-red-950/30 text-red-400 border-red-900/50" : ""}
              `}
            >
              {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="border-border bg-secondary/20">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in Platform
            </Button>
            <AccountTopUpDialog
              accountId={account.id}
              accountName={account.name}
              currentBalance={account.balance}
              className={`${colors.primaryGradient} text-black hover:opacity-90`}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="bg-secondary/20 border-border">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="bg-secondary/20 border-border">
            <Users className="h-4 w-4 mr-2" />
            Manage Users
          </Button>
          <Button variant="outline" size="sm" className="bg-secondary/20 border-border">
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </Button>
          <Button variant="outline" size="sm" className="bg-secondary/20 border-border text-red-400 hover:text-red-300">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className={`${colors.cardGradient} border ${colors.cardBorder}`}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-3">
                <div className="text-sm text-muted-foreground">Balance</div>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{account.balance}</div>
              <div className="mt-2 text-xs text-muted-foreground">Updated {new Date().toLocaleDateString()}</div>
            </CardContent>
          </Card>

          <Card className={`${colors.cardGradient} border ${colors.cardBorder}`}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-3">
                <div className="text-sm text-muted-foreground">Monthly Spend</div>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{account.spendThisMonth}</div>
              <div className="mt-2">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span>of {account.spendLimit} limit</span>
                  <span>{Math.round(spendPercentage)}%</span>
                </div>
                <Progress
                  value={spendPercentage}
                  className="h-1.5 bg-secondary/50"
                  indicatorClassName={`${spendPercentage > 80 ? "bg-red-500" : "bg-blue-500"}`}
                />
              </div>
            </CardContent>
          </Card>

          <Card className={`${colors.cardGradient} border ${colors.cardBorder}`}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-3">
                <div className="text-sm text-muted-foreground">Today's Spend</div>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{account.spendToday}</div>
              <div className="mt-2 text-xs text-muted-foreground flex items-center">
                <span className={account.spendThisWeek > account.spendToday ? "text-green-400" : "text-red-400"}>
                  {account.spendThisWeek} this week
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full bg-secondary/20 p-1 rounded-md h-auto">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-secondary/50 data-[state=active]:text-white px-4 py-1.5 h-auto rounded-sm"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="transactions"
              className="data-[state=active]:bg-secondary/50 data-[state=active]:text-white px-4 py-1.5 h-auto rounded-sm"
            >
              Transactions
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="data-[state=active]:bg-secondary/50 data-[state=active]:text-white px-4 py-1.5 h-auto rounded-sm"
            >
              Performance
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-secondary/50 data-[state=active]:text-white px-4 py-1.5 h-auto rounded-sm"
            >
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Account Information */}
              <div className="md:col-span-2">
                <Card className={`${colors.cardGradient} border ${colors.cardBorder}`}>
                  <CardHeader className="pb-2">
                    <CardTitle>Account Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Account ID</div>
                        <div className="font-mono">{account.accountId}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Business Manager ID</div>
                        <div className="font-mono">{account.businessManagerId}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Status</div>
                        <div className="capitalize">{account.status}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Date Added</div>
                        <div>{account.dateAdded}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Timezone</div>
                        <div>{account.timezone}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Spend Limit</div>
                        <div>{account.spendLimit}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className={`${colors.cardGradient} border ${colors.cardBorder} mt-6`}>
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>Last 4 transactions</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 text-xs bg-secondary/20">
                      View All
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {account.transactions && account.transactions.length > 0 ? (
                      <div className="space-y-4">
                        {account.transactions.slice(0, 4).map((transaction) => (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between p-3 rounded-md bg-secondary/10 hover:bg-secondary/20 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-full ${
                                  transaction.type === "Top Up"
                                    ? "bg-green-950/30 text-green-400"
                                    : "bg-red-950/30 text-red-400"
                                }`}
                              >
                                {transaction.type === "Top Up" ? (
                                  <CreditCard className="h-4 w-4" />
                                ) : (
                                  <CreditCard className="h-4 w-4" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium">{transaction.type}</div>
                                <div className="text-xs text-muted-foreground">{transaction.date}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div
                                className={`font-medium ${transaction.type === "Top Up" ? "text-green-400" : "text-red-400"}`}
                              >
                                {transaction.amount}
                              </div>
                              <div className="text-xs text-muted-foreground">{transaction.paymentMethod}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8">
                        <div className="bg-secondary/20 p-3 rounded-full mb-3">
                          <CreditCard className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">No transaction history available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Secondary Column */}
              <div className="space-y-6">
                {/* Users */}
                <Card className={`${colors.cardGradient} border ${colors.cardBorder}`}>
                  <CardHeader className="pb-2">
                    <CardTitle>Users</CardTitle>
                    <CardDescription>Access management</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {account.users && account.users.length > 0 ? (
                      <div className="space-y-3">
                        {account.users.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-2 rounded-md bg-secondary/10 hover:bg-secondary/20 transition-colors"
                          >
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-xs text-muted-foreground">{user.email}</div>
                            </div>
                            <Badge variant="outline" className="bg-secondary/20 border-secondary">
                              {user.role}
                            </Badge>
                          </div>
                        ))}
                        <Button variant="ghost" size="sm" className="w-full mt-2 text-xs bg-secondary/20">
                          <Users className="h-3 w-3 mr-2" />
                          Manage Users
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6">
                        <div className="bg-secondary/20 p-3 rounded-full mb-3">
                          <Users className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground mb-3">No users assigned</p>
                        <Button variant="outline" size="sm" className="bg-secondary/20 border-secondary">
                          <Users className="h-3 w-3 mr-2" />
                          Add Users
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Billing Details */}
                <Card className={`${colors.cardGradient} border ${colors.cardBorder}`}>
                  <CardHeader className="pb-2">
                    <CardTitle>Billing Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Payment Method</div>
                      <div className="flex items-center">{account.billingSettings.paymentMethod}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Billing Email</div>
                      <div>{account.billingSettings.billingEmail}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Billing Threshold</div>
                      <div>{account.billingSettings.billingThreshold}</div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full text-xs bg-secondary/20">
                      <Edit className="h-3 w-3 mr-2" />
                      Update Billing
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="mt-6">
            <Card className={`${colors.cardGradient} border ${colors.cardBorder}`}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>View and manage account transactions</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="bg-secondary/20 border-secondary">
                        <Filter className="h-3 w-3 mr-2" />
                        Filter
                        <ChevronDown className="h-3 w-3 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#0a0a0a] border-border">
                      <DropdownMenuItem className="hover:bg-secondary/20">All Transactions</DropdownMenuItem>
                      <DropdownMenuItem className="hover:bg-secondary/20">Top Ups</DropdownMenuItem>
                      <DropdownMenuItem className="hover:bg-secondary/20">Withdrawals</DropdownMenuItem>
                      <DropdownMenuItem className="hover:bg-secondary/20">Ad Spend</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="outline" size="sm" className="bg-secondary/20 border-secondary">
                    <Download className="h-3 w-3 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {account.transactions && account.transactions.length > 0 ? (
                  <div className="rounded-md border border-border overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-secondary/20 text-xs uppercase">
                        <tr>
                          <th className="px-4 py-3 text-left">Date</th>
                          <th className="px-4 py-3 text-left">Type</th>
                          <th className="px-4 py-3 text-left">Description</th>
                          <th className="px-4 py-3 text-left">Amount</th>
                          <th className="px-4 py-3 text-left">Balance After</th>
                          <th className="px-4 py-3 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {account.transactions.map((transaction) => (
                          <tr key={transaction.id} className="hover:bg-secondary/10">
                            <td className="px-4 py-3 text-sm">{transaction.date}</td>
                            <td className="px-4 py-3 text-sm">{transaction.type}</td>
                            <td className="px-4 py-3 text-sm">{transaction.description}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={transaction.type === "Top Up" ? "text-green-400" : "text-red-400"}>
                                {transaction.amount}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">{transaction.balanceAfter}</td>
                            <td className="px-4 py-3 text-sm">
                              <Badge
                                variant="outline"
                                className={
                                  transaction.status === "Completed"
                                    ? "bg-green-950/30 text-green-400 border-green-900/50"
                                    : transaction.status === "Pending"
                                      ? "bg-yellow-950/30 text-yellow-400 border-yellow-900/50"
                                      : "bg-red-950/30 text-red-400 border-red-900/50"
                                }
                              >
                                {transaction.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="bg-secondary/20 p-4 rounded-full mb-4">
                      <CreditCard className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mb-4">No transaction history available for this account</p>
                    <Button
                      onClick={() => {}}
                      className="bg-gradient-to-r from-[#b19cd9] to-[#f8c4b4] text-black hover:opacity-90"
                    >
                      Top Up Account
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="mt-6">
            <Card className={`${colors.cardGradient} border ${colors.cardBorder}`}>
              <CardHeader className="pb-2">
                <CardTitle>Performance Overview</CardTitle>
                <CardDescription>Account metrics and analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-md bg-secondary/10">
                    <div className="text-sm text-muted-foreground mb-1">Impressions</div>
                    <div className="text-2xl font-bold">{account.performanceData.impressions.toLocaleString()}</div>
                  </div>
                  <div className="p-4 rounded-md bg-secondary/10">
                    <div className="text-sm text-muted-foreground mb-1">Clicks</div>
                    <div className="text-2xl font-bold">{account.performanceData.clicks.toLocaleString()}</div>
                  </div>
                  <div className="p-4 rounded-md bg-secondary/10">
                    <div className="text-sm text-muted-foreground mb-1">Conversions</div>
                    <div className="text-2xl font-bold">{account.performanceData.conversions.toLocaleString()}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-md bg-secondary/10">
                    <div className="text-sm text-muted-foreground mb-1">CTR (Click-Through Rate)</div>
                    <div className="text-2xl font-bold">{account.performanceData.ctr}%</div>
                  </div>
                  <div className="p-4 rounded-md bg-secondary/10">
                    <div className="text-sm text-muted-foreground mb-1">CPC (Cost Per Click)</div>
                    <div className="text-2xl font-bold">${account.performanceData.cpc}</div>
                  </div>
                </div>

                <div className="mt-8 flex justify-center">
                  <div className="bg-secondary/20 p-4 rounded-full mb-4">
                    <PieChart className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>

                <div className="text-center text-muted-foreground">
                  Advanced analytics and visualizations coming soon.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <Card className={`${colors.cardGradient} border ${colors.cardBorder}`}>
              <CardHeader className="pb-2">
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account configurations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-3">General Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Account Name</label>
                      <input
                        type="text"
                        defaultValue={account.name}
                        className="w-full bg-secondary/20 border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#b19cd9]/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                      <select
                        defaultValue={account.status}
                        className="w-full bg-secondary/20 border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#b19cd9]/50"
                      >
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="disabled">Disabled</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Spending Limits</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Daily Spend Limit</label>
                      <input
                        type="text"
                        defaultValue={account.spendLimit.replace("$", "")}
                        className="w-full bg-secondary/20 border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#b19cd9]/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Monthly Budget</label>
                      <input
                        type="text"
                        defaultValue={(Number.parseFloat(account.spendLimit.replace("$", "")) * 4).toFixed(2)}
                        className="w-full bg-secondary/20 border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#b19cd9]/50"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Billing Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Billing Email</label>
                      <input
                        type="email"
                        defaultValue={account.billingSettings.billingEmail}
                        className="w-full bg-secondary/20 border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#b19cd9]/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Billing Threshold</label>
                      <input
                        type="text"
                        defaultValue={account.billingSettings.billingThreshold.replace("$", "")}
                        className="w-full bg-secondary/20 border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#b19cd9]/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" className="bg-secondary/20 border-border">
                    Cancel
                  </Button>
                  <Button className="bg-gradient-to-r from-[#b19cd9] to-[#f8c4b4] text-black hover:opacity-90">
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
