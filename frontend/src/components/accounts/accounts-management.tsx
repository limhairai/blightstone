"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs"
import { Card, CardContent } from "../ui/card"
import { Search, PlusCircle, ChevronDown, PlusIcon } from "lucide-react"
import Link from "next/link"
import { gradients } from "../../lib/design-system"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { Badge } from "../ui/badge"

import { CreateAdAccountDialog } from "./create-ad-account-dialog"
import { TopUpDialog } from "./top-up-dialog"
import { BusinessAccountsTable } from "./business-accounts-table"
import { AccountsCardGrid } from "./accounts-card-grid"
import { formatCurrency } from "../../utils/format"

export function AccountsManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [currentTab, setCurrentTab] = useState("all")
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["active", "pending", "pending", "error"])
  const [isTopUpDialogOpen, setIsTopUpDialogOpen] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)

  // Use empty array for production mode - will be replaced with real data from API
  const mockAccounts: any[] = []

  // Filter accounts based on search query and current tab
  const filteredAccounts = mockAccounts.filter((account) => {
    const matchesSearch =
      account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (account.accountId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.status.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = selectedStatuses.includes(account.status)

    return matchesSearch && matchesStatus
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

  const handleTopUp = (accountId: string) => {
    setSelectedAccountId(accountId)
    setIsTopUpDialogOpen(true)
  }

  const selectedAccount = selectedAccountId ? mockAccounts.find((account) => account.id === selectedAccountId) : null

  const accounts = filteredAccounts
  const onSelectAll = handleSelectAll
  const onSelectAccount = handleSelectAccount
  const onTopUp = handleTopUp

  return (
    <div className="space-y-3">
      <div className="flex flex-col space-y-1">
        <h1 className="text-2xl font-medium">Ad Accounts</h1>
        <p className="text-xs text-[#888888]">Manage your advertising accounts across platforms</p>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setCurrentTab}>
        <div className="flex justify-between items-center border-b border-[#222222]">
          <TabsList className="bg-transparent">
            <TabsTrigger
              value="all"
              className="data-[state=active]:border-b-2 data-[state=active]:border-[#b4a0ff] data-[state=active]:text-white rounded-none px-3 py-1 text-xs"
            >
              Summary
            </TabsTrigger>
            <TabsTrigger
              value="meta"
              className="data-[state=active]:border-b-2 data-[state=active]:border-[#b4a0ff] data-[state=active]:text-white rounded-none px-3 py-1 text-xs"
            >
              Transactions
            </TabsTrigger>
          </TabsList>

          <Link href="/account-application">
            <Button className={`${gradients.primary} text-primary-foreground hover:opacity-90 h-8 text-xs`}>
              <PlusCircle className="h-3 w-3 mr-1" />
              Request New Account
            </Button>
          </Link>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className={`${gradients.cardGradient} border border-border`}>
            <CardContent className="p-3">
              <div className="flex flex-col">
                <span className="text-xs text-[#888888]">Ad accounts</span>
                <span className="text-sm font-medium">{allAccounts}</span>
                <span className="text-xs text-[#888888] mt-1">Total balance</span>
                <span className="text-sm font-medium">${totalBalance.toFixed(2)} USD</span>
              </div>
            </CardContent>
          </Card>

          <Card className={`${gradients.cardGradient} border border-border`}>
            <CardContent className="p-3">
              <div className="flex flex-col">
                <span className="text-xs text-[#888888]">Active accounts</span>
                <span className="text-sm font-medium">{filteredAccounts.filter(acc => acc.status === 'active').length}</span>
                <span className="text-xs text-[#888888] mt-1">Monthly spend</span>
                <span className="text-sm font-medium">${(totalBalance * 0.3).toFixed(2)} USD</span>
              </div>
            </CardContent>
          </Card>

          <Card className={`${gradients.cardGradient} border border-border`}>
            <CardContent className="p-3">
              <div className="flex flex-col">
                <span className="text-xs text-[#888888]">Pending accounts</span>
                <span className="text-sm font-medium">{filteredAccounts.filter(acc => acc.status === 'pending').length}</span>
                <span className="text-xs text-[#888888] mt-1">Available credit</span>
                <span className="text-sm font-medium">${(50000 - totalBalance).toFixed(2)} USD</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className={`${gradients.cardGradient} border border-border`}>
            <CardContent className="p-3">
              <div className="flex flex-col">
                <span className="text-xs text-[#888888]">Meta accounts</span>
                <span className="text-sm font-medium">{metaAccounts}</span>
                <span className="text-xs text-[#888888] mt-1">Meta balance</span>
                <span className="text-sm font-medium">${metaBalance.toFixed(2)} USD</span>
              </div>
            </CardContent>
          </Card>

          <Card className={`${gradients.cardGradient} border border-border`}>
            <CardContent className="p-3">
              <div className="flex flex-col">
                <span className="text-xs text-[#888888]">TikTok accounts</span>
                <span className="text-sm font-medium">{tiktokAccounts}</span>
                <span className="text-xs text-[#888888] mt-1">TikTok balance</span>
                <span className="text-sm font-medium">${tiktokBalance.toFixed(2)} USD</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4">
          <div className="flex flex-col space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-[#666666]" />
              <Input
                placeholder="Search via account name, ID, or status..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-8 bg-[#0a0a0a] border-[#222222] h-8 text-xs"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Select>
                <SelectTrigger className="w-[140px] bg-[#0a0a0a] border-[#222222] h-8 text-xs">
                  <SelectValue placeholder="Account type" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0a] border-[#222222]">
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger className="w-[140px] bg-[#0a0a0a] border-[#222222] h-8 text-xs">
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
                <SelectTrigger className="w-[140px] bg-[#0a0a0a] border-[#222222] h-8 text-xs">
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
                  <Button variant="outline" className="border-[#222222] bg-[#0a0a0a] h-8 text-xs">
                    Status
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#0a0a0a] border-[#222222]">
                  <DropdownMenuItem
                    className="flex items-center gap-2 cursor-pointer text-xs"
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
                    className="flex items-center gap-2 cursor-pointer text-xs"
                    onClick={() => toggleStatusFilter("under_review")}
                  >
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes("under_review")}
                      readOnly
                      className="rounded-sm"
                    />
                    <span>Under Review</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center gap-2 cursor-pointer text-xs"
                    onClick={() => toggleStatusFilter("paused")}
                  >
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes("paused")}
                      readOnly
                      className="rounded-sm"
                    />
                    <span>Paused</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center gap-2 cursor-pointer text-xs"
                    onClick={() => toggleStatusFilter("suspended")}
                  >
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes("suspended")}
                      readOnly
                      className="rounded-sm"
                    />
                    <span>Suspended</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {selectedStatuses.length > 0 && (
                <div className="flex items-center gap-2 bg-[#b4a0ff]/20 px-2 py-1 rounded-md">
                  <span className="text-xs text-[#b4a0ff]">{selectedStatuses.length} status filters selected</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 text-[#b4a0ff] hover:bg-[#b4a0ff]/20"
                    onClick={clearStatusFilters}
                  >
                    ×
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 bg-[#0a0a0a] border border-[#222222] rounded-md overflow-hidden">
            <div className="w-full overflow-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#222222] bg-[#0a0a0a]">
                    <th className="px-2 py-2 text-left">
                      <input
                        type="checkbox"
                        checked={accounts.length > 0 && selectedAccounts.length === accounts.length}
                        onChange={(e) => onSelectAll(e.target.checked)}
                        className="rounded-sm"
                      />
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-[#888888]">
                      ACCOUNT NAME
                      <span className="ml-1 inline-block">↑</span>
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-[#888888]">ACCOUNT ID</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-[#888888]">USERS</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-[#888888]">
                      SPEND
                      <span className="ml-1 inline-block">↓</span>
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-[#888888]">LIMIT USAGE</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-[#888888]">STATUS</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-[#888888]">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.map((account) => (
                    <tr key={account.id} className="border-b border-[#222222] hover:bg-[#1A1A1A]">
                      <td className="px-2 py-2">
                        <input
                          type="checkbox"
                          checked={selectedAccounts.includes(account.id)}
                          onChange={(e) => onSelectAccount(account.id, e.target.checked)}
                          className="rounded-sm"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex flex-col">
                          <div className="font-medium text-xs">{account.name}</div>
                          <div className="text-xs text-[#888888]">{account.partner}</div>
                        </div>
                      </td>
                      <td className="px-2 py-2 font-mono text-xs text-[#888888]">{account.accountId}</td>
                      <td className="px-2 py-2 text-xs">{account.users}</td>
                      <td className="px-2 py-2 font-medium text-xs">{account.balance}</td>
                      <td className="px-2 py-2">
                        <div className="flex flex-col">
                          <div className="flex justify-between text-xs mb-1">
                            <span>{account.usagePercent}%</span>
                            <span>{account.spendLimit}</span>
                          </div>
                          <div className="w-full bg-[#222222] rounded-full h-1">
                            <div
                              className={`h-1 rounded-full ${
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
                      <td className="px-2 py-2">
                        <Badge
                          variant="outline"
                          className={`
                            rounded-full px-2 py-1 text-xs font-medium
                            ${account.status === "active" ? "bg-green-950/30 text-green-400 border-green-900/50" : ""}
                            ${
                              account.status === "paused" || account.status === "under_review"
                                ? "bg-yellow-950/30 text-yellow-400 border-yellow-900/50"
                                : ""
                            }
                            ${account.status === "suspended" || account.status === "disabled" ? "bg-red-950/30 text-red-400 border-red-900/50" : ""}
                          `}
                        >
                          {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-2 py-2 flex items-center gap-1">
                        <Button
                          onClick={() => onTopUp(account.id)}
                          size="sm"
                          className={`${gradients.primary} text-primary-foreground px-2 py-1 h-6 text-xs font-medium hover:opacity-90`}
                        >
                          <PlusIcon className="h-3 w-3 mr-1" /> Top Up
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-xs">
                          •••
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-6 w-6 p-0 border-[#222222] text-xs">
                &lt;&lt;
              </Button>
              <Button variant="outline" size="sm" className="h-6 w-6 p-0 border-[#222222] text-xs">
                &lt;
              </Button>
              <span className="text-xs text-[#888888]">Page 1 of 1</span>
              <Button variant="outline" size="sm" className="h-6 w-6 p-0 border-[#222222] text-xs">
                &gt;
              </Button>
              <Button variant="outline" size="sm" className="h-6 w-6 p-0 border-[#222222] text-xs">
                &gt;&gt;
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#888888]">Rows per page:</span>
              <Select defaultValue="10">
                <SelectTrigger className="w-[60px] h-6 bg-[#0a0a0a] border-[#222222] text-xs">
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
      </Tabs>

      {selectedAccount && (
        <TopUpDialog
          open={isTopUpDialogOpen}
          onOpenChange={setIsTopUpDialogOpen}
          trigger={<></>}
          account={{
            id: selectedAccount.id,
            name: selectedAccount.name,
            adAccount: selectedAccount.accountId || selectedAccount.id,
            balance: parseFloat(selectedAccount.balance.replace('$', '').replace(',', '')),
            currency: 'USD'
          }}
          onSuccess={() => setIsTopUpDialogOpen(false)}
        />
      )}
    </div>
  )
}
