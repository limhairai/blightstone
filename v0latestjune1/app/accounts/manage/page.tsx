"use client"

import type React from "react"

import { DashboardLayout } from "@/components/dashboard-layout"
import { colors } from "@/lib/design-tokens"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AccountTopUpDialog } from "@/components/account-top-up-dialog"
import { useState } from "react"
import Link from "next/link"
import { Search, PlusCircle, ChevronDown, PlusIcon } from "lucide-react"

// Mock data
const mockAccounts = [
  {
    id: "1",
    name: "Primary Marketing",
    accountId: "act_12345678",
    status: "active",
    users: 5,
    billings: 2,
    type: "Business",
    partner: "Meta",
    currency: "USD",
    ads: 24,
    estimated: "$3,450.00",
    holds: "$0.00",
    balance: "$2,750.00",
    totalSpend: "$12,450.00",
    spendToday: "$350.00",
    spendLimit: "$5,000.00",
    usagePercent: 55,
    hasIssues: false,
  },
  {
    id: "2",
    name: "Secondary Campaign",
    accountId: "act_87654321",
    status: "active",
    users: 3,
    billings: 1,
    type: "Personal",
    partner: "Meta",
    currency: "USD",
    ads: 12,
    estimated: "$1,200.00",
    holds: "$0.00",
    balance: "$950.00",
    totalSpend: "$5,600.00",
    spendToday: "$120.00",
    spendLimit: "$2,000.00",
    usagePercent: 48,
    hasIssues: false,
  },
  {
    id: "3",
    name: "Product Launch",
    accountId: "act_23456789",
    status: "idle",
    users: 4,
    billings: 1,
    type: "Business",
    partner: "Meta",
    currency: "USD",
    ads: 8,
    estimated: "$800.00",
    holds: "$0.00",
    balance: "$650.00",
    totalSpend: "$3,200.00",
    spendToday: "$0.00",
    spendLimit: "$1,500.00",
    usagePercent: 0,
    hasIssues: false,
  },
  {
    id: "4",
    name: "Summer Promotion",
    accountId: "act_34567890",
    status: "active",
    users: 2,
    billings: 1,
    type: "Business",
    partner: "TikTok",
    currency: "USD",
    ads: 15,
    estimated: "$1,800.00",
    holds: "$0.00",
    balance: "$1,200.00",
    totalSpend: "$7,890.00",
    spendToday: "$220.00",
    spendLimit: "$3,000.00",
    usagePercent: 73,
    hasIssues: true,
  },
  {
    id: "5",
    name: "Holiday Campaign",
    accountId: "act_45678901",
    status: "disabled",
    users: 3,
    billings: 1,
    type: "Business",
    partner: "Meta",
    currency: "USD",
    ads: 0,
    estimated: "$0.00",
    holds: "$0.00",
    balance: "$0.00",
    totalSpend: "$4,560.00",
    spendToday: "$0.00",
    spendLimit: "$0.00",
    usagePercent: 0,
    hasIssues: true,
  },
]

// Mock transaction data
const mockTransactions = [
  {
    id: "tx_1",
    accountId: "1",
    date: "2025-04-29",
    type: "top-up",
    amount: "$500.00",
    description: "Manual top-up",
    status: "completed",
    balanceAfter: "$2,750.00",
  },
  {
    id: "tx_2",
    accountId: "1",
    date: "2025-04-25",
    type: "spend",
    amount: "-$125.50",
    description: "Ad campaign spend",
    status: "completed",
    balanceAfter: "$2,250.00",
  },
  {
    id: "tx_3",
    accountId: "1",
    date: "2025-04-20",
    type: "top-up",
    amount: "$1,000.00",
    description: "Automatic top-up",
    status: "completed",
    balanceAfter: "$2,375.50",
  },
  {
    id: "tx_4",
    accountId: "2",
    date: "2025-04-28",
    type: "top-up",
    amount: "$250.00",
    description: "Manual top-up",
    status: "completed",
    balanceAfter: "$950.00",
  },
  {
    id: "tx_5",
    accountId: "2",
    date: "2025-04-22",
    type: "spend",
    amount: "-$75.00",
    description: "Ad campaign spend",
    status: "completed",
    balanceAfter: "$700.00",
  },
]

export default function AccountsManagePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [currentTab, setCurrentTab] = useState("all")
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["active", "idle", "disabled"])
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)

  // Filter accounts based on search query and current tab
  const filteredAccounts = mockAccounts.filter((account) => {
    const matchesSearch =
      account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.accountId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.status.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTab =
      currentTab === "all" ||
      (currentTab === "meta" && account.partner === "Meta") ||
      (currentTab === "tiktok" && account.partner === "TikTok")

    const matchesStatus = selectedStatuses.includes(account.status)

    return matchesSearch && matchesTab && matchesStatus
  })

  // Calculate summary metrics
  const allAccounts = filteredAccounts.length
  const totalBalance = filteredAccounts.reduce((sum, account) => {
    const balance = Number.parseFloat(account.balance.replace(/[^0-9.-]+/g, "") || "0")
    return sum + balance
  }, 0)

  const metaAccounts = filteredAccounts.filter((account) => account.partner === "Meta").length
  const metaBalance = filteredAccounts
    .filter((account) => account.partner === "Meta")
    .reduce((sum, account) => {
      const balance = Number.parseFloat(account.balance.replace(/[^0-9.-]+/g, "") || "0")
      return sum + balance
    }, 0)

  const tiktokAccounts = filteredAccounts.filter((account) => account.partner === "TikTok").length
  const tiktokBalance = filteredAccounts
    .filter((account) => account.partner === "TikTok")
    .reduce((sum, account) => {
      const balance = Number.parseFloat(account.balance.replace(/[^0-9.-]+/g, "") || "0")
      return sum + balance
    }, 0)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleSelectAccount = (accountId: string, checked: boolean) => {
    if (checked) {
      setSelectedAccounts([...selectedAccounts, accountId])
    } else {
      setSelectedAccounts(selectedAccounts.filter((id) => id !== accountId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAccounts(filteredAccounts.map((account) => account.id))
    } else {
      setSelectedAccounts([])
    }
  }

  const toggleStatusFilter = (status: string) => {
    if (selectedStatuses.includes(status)) {
      setSelectedStatuses(selectedStatuses.filter((s) => s !== status))
    } else {
      setSelectedStatuses([...selectedStatuses, status])
    }
  }

  const clearStatusFilters = () => {
    setSelectedStatuses([])
  }

  // Get transactions for the current tab
  const getTransactionsContent = () => {
    const transactions = mockTransactions.filter((tx) => currentTab === "all" || tx.accountId === selectedAccountId)

    if (transactions.length === 0) {
      return (
        <div className="py-12 text-center">
          <p className="text-gray-400 mb-4">No transactions found for this account.</p>
          <AccountTopUpDialog
            accountId={selectedAccountId || "1"}
            accountName={
              selectedAccountId ? mockAccounts.find((a) => a.id === selectedAccountId)?.name || "Account" : "Account"
            }
            currentBalance={
              selectedAccountId ? mockAccounts.find((a) => a.id === selectedAccountId)?.balance || "$0.00" : "$0.00"
            }
          >
            <Button
              className={`${colors.primaryGradient} text-black px-3 py-1 h-9 text-xs font-medium hover:opacity-90`}
            >
              <PlusIcon className="h-3 w-3 mr-1" /> Top Up Account
            </Button>
          </AccountTopUpDialog>
        </div>
      )
    }

    return (
      <div className="mt-4 bg-[#0a0a0a] border border-[#222222] rounded-md overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#222222] bg-[#0a0a0a]">
              <th className="px-4 py-3 text-left text-sm font-medium text-[#888888]">DATE</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#888888]">TYPE</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#888888]">DESCRIPTION</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-[#888888]">AMOUNT</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-[#888888]">BALANCE AFTER</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#888888]">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-b border-[#222222] hover:bg-[#1A1A1A]">
                <td className="px-4 py-3 text-sm">
                  {new Date(tx.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="px-4 py-3 capitalize">{tx.type}</td>
                <td className="px-4 py-3">{tx.description}</td>
                <td
                  className={`px-4 py-3 text-right font-medium ${tx.type === "top-up" ? "text-green-400" : "text-red-400"}`}
                >
                  {tx.amount}
                </td>
                <td className="px-4 py-3 text-right font-medium">{tx.balanceAfter}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className={`
                      rounded-full px-2 py-0.5 text-xs font-medium
                      ${tx.status === "completed" ? "bg-green-950/30 text-green-400 border-green-900/50" : ""}
                      ${tx.status === "pending" ? "bg-yellow-950/30 text-yellow-400 border-yellow-900/50" : ""}
                      ${tx.status === "failed" ? "bg-red-950/30 text-red-400 border-red-900/50" : ""}
                    `}
                  >
                    {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 px-4">
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col space-y-1">
            <h1 className="text-2xl font-medium">Ad Accounts</h1>
            <p className="text-[#888888]">Manage your advertising accounts across platforms</p>
          </div>

          <Tabs defaultValue="all" className="w-full" onValueChange={setCurrentTab}>
            <div className="flex justify-between items-center border-b border-[#222222]">
              <TabsList className="bg-transparent">
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-[#b4a0ff] data-[state=active]:text-white rounded-none px-4 py-2"
                >
                  Summary
                </TabsTrigger>
                <TabsTrigger
                  value="meta"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-[#b4a0ff] data-[state=active]:text-white rounded-none px-4 py-2"
                >
                  Transactions
                </TabsTrigger>
              </TabsList>

              <Link href="/account-application">
                <Button className={`${colors.primaryGradient} text-black hover:opacity-90`}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Request New Account
                </Button>
              </Link>
            </div>

            {currentTab === "all" ? (
              <>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className={`${colors.cardGradient} border ${colors.cardBorder}`}>
                    <CardContent className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-[#888888]">All accounts</span>
                        <span className="text-lg font-medium">{allAccounts}</span>
                        <span className="text-sm text-[#888888] mt-2">Total balance</span>
                        <span className="text-lg font-medium">${totalBalance.toFixed(2)} USD</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={`${colors.cardGradient} border ${colors.cardBorder}`}>
                    <CardContent className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-[#888888]">Meta accounts</span>
                        <span className="text-lg font-medium">{metaAccounts}</span>
                        <span className="text-sm text-[#888888] mt-2">Total balance</span>
                        <span className="text-lg font-medium">${metaBalance.toFixed(2)} USD</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={`${colors.cardGradient} border ${colors.cardBorder}`}>
                    <CardContent className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-[#888888]">TikTok accounts</span>
                        <span className="text-lg font-medium">{tiktokAccounts}</span>
                        <span className="text-sm text-[#888888] mt-2">Total balance</span>
                        <span className="text-lg font-medium">${tiktokBalance.toFixed(2)} USD</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-6">
                  <div className="flex flex-col space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666666]" />
                      <Input
                        placeholder="Search via account name, ID, or status..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="pl-10 bg-[#0a0a0a] border-[#222222] h-10"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Select>
                        <SelectTrigger className="w-[180px] bg-[#0a0a0a] border-[#222222]">
                          <SelectValue placeholder="Account type" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0a0a0a] border-[#222222]">
                          <SelectItem value="all">All types</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="personal">Personal</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select>
                        <SelectTrigger className="w-[180px] bg-[#0a0a0a] border-[#222222]">
                          <SelectValue placeholder="Monthly spend" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0a0a0a] border-[#222222]">
                          <SelectItem value="all">All amounts</SelectItem>
                          <SelectItem value="low">Under $1,000</SelectItem>
                          <SelectItem value="medium">$1,000 - $5,000</SelectItem>
                          <SelectItem value="high">Over $5,000</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select>
                        <SelectTrigger className="w-[180px] bg-[#0a0a0a] border-[#222222]">
                          <SelectValue placeholder="Limit usage" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0a0a0a] border-[#222222]">
                          <SelectItem value="all">All usage</SelectItem>
                          <SelectItem value="low">Under 25%</SelectItem>
                          <SelectItem value="medium">25% - 75%</SelectItem>
                          <SelectItem value="high">Over 75%</SelectItem>
                        </SelectContent>
                      </Select>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="border-[#222222] bg-[#0a0a0a]">
                            Status
                            <ChevronDown className="ml-2 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#0a0a0a] border-[#222222]">
                          <DropdownMenuItem
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => toggleStatusFilter("active")}
                          >
                            <input
                              type="checkbox"
                              checked={selectedStatuses.includes("active")}
                              readOnly
                              className="rounded-sm"
                            />
                            <span>Active</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => toggleStatusFilter("idle")}
                          >
                            <input
                              type="checkbox"
                              checked={selectedStatuses.includes("idle")}
                              readOnly
                              className="rounded-sm"
                            />
                            <span>Idle</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => toggleStatusFilter("disabled")}
                          >
                            <input
                              type="checkbox"
                              checked={selectedStatuses.includes("disabled")}
                              readOnly
                              className="rounded-sm"
                            />
                            <span>Disabled</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {selectedStatuses.length > 0 && (
                        <div className="flex items-center gap-2 bg-[#b4a0ff]/20 px-3 py-1.5 rounded-md">
                          <span className="text-sm text-[#b4a0ff]">
                            {selectedStatuses.length} status filters selected
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-[#b4a0ff] hover:bg-[#b4a0ff]/20"
                            onClick={clearStatusFilters}
                          >
                            ×
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 bg-[#0a0a0a] border border-[#222222] rounded-md overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#222222] bg-[#0a0a0a]">
                          <th className="px-4 py-3 text-left">
                            <input
                              type="checkbox"
                              checked={
                                filteredAccounts.length > 0 && selectedAccounts.length === filteredAccounts.length
                              }
                              onChange={(e) => handleSelectAll(e.target.checked)}
                              className="rounded-sm"
                            />
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-[#888888]">
                            ACCOUNT NAME
                            <span className="ml-1 inline-block">↑</span>
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-[#888888]">ACCOUNT ID</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-[#888888]">USERS</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-[#888888]">
                            SPEND
                            <span className="ml-1 inline-block">↓</span>
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-[#888888]">LIMIT USAGE</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-[#888888]">STATUS</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-[#888888]">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAccounts.map((account) => (
                          <tr key={account.id} className="border-b border-[#222222] hover:bg-[#1A1A1A]">
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedAccounts.includes(account.id)}
                                onChange={(e) => handleSelectAccount(account.id, e.target.checked)}
                                className="rounded-sm"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                <div>
                                  <div className="font-medium">{account.name}</div>
                                  <div className="text-xs text-[#888888]">{account.partner}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-[#888888]">{account.accountId}</td>
                            <td className="px-4 py-3">{account.users}</td>
                            <td className="px-4 py-3 font-medium">{account.balance}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col">
                                <div className="flex justify-between text-xs mb-1">
                                  <span>{account.usagePercent}%</span>
                                  <span>{account.spendLimit}</span>
                                </div>
                                <div className="w-full bg-[#222222] rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full ${
                                      account.usagePercent > 75
                                        ? "bg-red-500"
                                        : account.usagePercent > 50
                                          ? "bg-yellow-500"
                                          : "bg-green-500"
                                    }`}
                                    style={{ width: `${account.usagePercent}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant="outline"
                                className={`
                                  rounded-full px-2 py-0.5 text-xs font-medium
                                  ${account.status === "active" ? "bg-green-950/30 text-green-400 border-green-900/50" : ""}
                                  ${account.status === "paused" || account.status === "idle" ? "bg-yellow-950/30 text-yellow-400 border-yellow-900/50" : ""}
                                  ${account.status === "disabled" ? "bg-red-950/30 text-red-400 border-red-900/50" : ""}
                                `}
                              >
                                {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 flex items-center gap-2">
                              <AccountTopUpDialog
                                accountId={account.accountId}
                                accountName={account.name}
                                currentBalance={account.balance}
                              >
                                <Button
                                  size="sm"
                                  className={`${colors.primaryGradient} text-black px-3 py-1 h-7 text-xs font-medium hover:opacity-90`}
                                >
                                  <PlusIcon className="h-3 w-3 mr-1" /> Top Up
                                </Button>
                              </AccountTopUpDialog>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                •••
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-[#222222]">
                        &lt;&lt;
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-[#222222]">
                        &lt;
                      </Button>
                      <span className="text-sm text-[#888888]">Page 1 of 1</span>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-[#222222]">
                        &gt;
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-[#222222]">
                        &gt;&gt;
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[#888888]">Rows per page:</span>
                      <Select defaultValue="10">
                        <SelectTrigger className="w-[70px] h-8 bg-[#0a0a0a] border-[#222222]">
                          <SelectValue placeholder="10" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0a0a0a] border-[#222222]">
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-6">
                <h2 className="text-xl font-medium mb-4">Transaction History</h2>
                <p className="text-[#888888] mb-6">View all transactions for your ad accounts</p>

                {getTransactionsContent()}
              </div>
            )}
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  )
}
