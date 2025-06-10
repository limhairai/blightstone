"use client"

import type React from "react"

import { useState, useMemo, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/ui/status-badge"
import { AccountTransactionsDialog } from "@/components/dashboard/account-transactions-dialog"
import { WithdrawBalanceDialog } from "@/components/dashboard/withdraw-balance-dialog"
import { TopUpDialog } from "@/components/dashboard/top-up-dialog"
import { MOCK_BUSINESSES, type MockAccount } from "@/lib/mock-data"
import { formatCurrency } from "@/lib/utils"
import { MoreHorizontal, Eye, ArrowUpRight, ArrowDownLeft, Wallet, Pause, Play, Copy, Receipt, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { layout } from "@/lib/layout-utils"
import { contentTokens } from "@/lib/content-tokens"
import { useDemoState } from "@/contexts/DemoStateContext"
import { toast } from "sonner"
import { ViewDetailsDialog } from "@/components/dashboard/view-details-dialog"
import { BulkTopUpDialog } from "@/components/dashboard/bulk-top-up-dialog"

interface AccountsTableProps {
  initialBusinessFilter?: string
  businessId?: string
}

export function AccountsTable({ initialBusinessFilter = "all", businessId }: AccountsTableProps) {
  const { state, pauseAccount, resumeAccount, deleteAccount } = useDemoState()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [viewAccount, setViewAccount] = useState<any>(null)
  const [withdrawAccount, setWithdrawAccount] = useState<any>(null)
  const [transactionsAccount, setTransactionsAccount] = useState<any>(null)
  const [bulkTopUpOpen, setBulkTopUpOpen] = useState(false)
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    platform: "all",
    business: initialBusinessFilter
  })

  // Get business filter from URL params
  useEffect(() => {
    const businessParam = searchParams?.get('business')
    if (businessParam) {
      setFilters(prev => ({ ...prev, business: businessParam }))
    }
  }, [searchParams])

  // Transform accounts data
  const transformedAccounts = useMemo(() => {
    return state.accounts.map(account => ({
      id: account.id.toString(),
      name: account.name,
      accountId: account.adAccount,
      business: account.business,
      status: account.status === "paused" ? "inactive" : account.status as "active" | "pending" | "inactive" | "suspended",
      balance: account.balance,
      spendLimit: account.spendLimit,
      dateAdded: account.dateAdded,
      quota: Math.round((account.spent / account.quota) * 100),
      spent: account.spent,
      platform: account.platform,
    }))
  }, [state.accounts])

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    let filtered = transformedAccounts

    if (filters.search) {
      filtered = filtered.filter(account =>
        account.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        account.business.toLowerCase().includes(filters.search.toLowerCase()) ||
        account.accountId.includes(filters.search)
      )
    }

    if (filters.status !== "all") {
      filtered = filtered.filter(account => account.status === filters.status)
    }

    if (filters.platform !== "all") {
      filtered = filtered.filter(account => account.platform === filters.platform)
    }

    if (filters.business !== "all") {
      filtered = filtered.filter(account => account.business === filters.business)
    }

    return filtered
  }, [transformedAccounts, filters])

  // Handle bulk actions
  const handleBulkPause = async () => {
    try {
      for (const accountId of selectedAccounts) {
        await pauseAccount(Number(accountId))
      }
      setSelectedAccounts([])
      toast.success(`Paused ${selectedAccounts.length} account(s)`)
    } catch (error) {
      toast.error("Failed to pause accounts")
    }
  }

  const handleBulkResume = async () => {
    try {
      for (const accountId of selectedAccounts) {
        await resumeAccount(Number(accountId))
      }
      setSelectedAccounts([])
      toast.success(`Resumed ${selectedAccounts.length} account(s)`)
    } catch (error) {
      toast.error("Failed to resume accounts")
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedAccounts.length} account(s)? This action cannot be undone.`)) {
      return
    }
    
    try {
      for (const accountId of selectedAccounts) {
        await deleteAccount(Number(accountId))
      }
      setSelectedAccounts([])
      toast.success(`Deleted ${selectedAccounts.length} account(s)`)
    } catch (error) {
      toast.error("Failed to delete accounts")
    }
  }

  const handleSelectAccount = (accountId: string) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    )
  }

  const handleSelectAll = () => {
    setSelectedAccounts(
      selectedAccounts.length === filteredAccounts.length 
        ? [] 
        : filteredAccounts.map(account => account.id)
    )
  }

  const handleViewTransactions = (account: any) => {
    // Convert back to MockAccount format for the dialog
    const mockAccount: MockAccount = {
      ...account,
      id: Number(account.id)
    }
    setTransactionsAccount(mockAccount)
  }

  const handleWithdrawBalance = (account: any) => {
    // Convert back to MockAccount format for the dialog
    const mockAccount: MockAccount = {
      ...account,
      id: Number(account.id)
    }
    setWithdrawAccount(mockAccount)
  }

  const handleTopUp = (account: any) => {
    // Convert back to MockAccount format for the dialog
    const mockAccount: MockAccount = {
      ...account,
      id: Number(account.id)
    }
    setTransactionsAccount(mockAccount)
  }

  const handleCopyAccountId = (accountId: string) => {
    navigator.clipboard.writeText(accountId)
    // You could add a toast notification here
  }

  const isAllSelected = filteredAccounts.length > 0 && selectedAccounts.length === filteredAccounts.length

  const getQuotaUsageColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500"
    if (percentage >= 75) return "bg-yellow-500"
    return "bg-emerald-500"
  }

  const formatTimezone = (timezone: string) => {
    if (!timezone) return "-"
    const parts = timezone.split("/")
    if (parts.length === 2) {
      const region = parts[0]
      const city = parts[1].replace(/_/g, " ")

      const regionMap: { [key: string]: string } = {
        America: "US",
        Europe: "EU",
        Asia: "AS",
        Australia: "AU",
        Africa: "AF",
      }

      return `${regionMap[region] || region}/${city}`
    }
    return timezone
  }

  const handlePauseAccount = async (account: MockAccount) => {
    try {
      await pauseAccount(account.id)
    } catch (error) {
      // Error handling is done in the pauseAccount function
    }
  }

  const handleResumeAccount = async (account: MockAccount) => {
    try {
      await resumeAccount(account.id)
    } catch (error) {
      // Error handling is done in the resumeAccount function
    }
  }

  const handleDeleteAccount = async (account: MockAccount) => {
    if (window.confirm(`Are you sure you want to delete "${account.name}"? This action cannot be undone.`)) {
      try {
        await deleteAccount(account.id)
      } catch (error) {
        // Error handling is done in the deleteAccount function
      }
    }
  }

  return (
    <div className={layout.stackMedium}>
      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Input
            placeholder={contentTokens.placeholders.search}
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="h-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex items-center gap-3">
          <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
            <SelectTrigger className="w-[140px] h-10 bg-background border-border text-foreground">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all" className="text-popover-foreground hover:bg-accent">
                All Statuses
              </SelectItem>
              <SelectItem value="active" className="text-popover-foreground hover:bg-accent">
                Active
              </SelectItem>
              <SelectItem value="pending" className="text-popover-foreground hover:bg-accent">
                Pending
              </SelectItem>
              <SelectItem value="inactive" className="text-popover-foreground hover:bg-accent">
                Inactive
              </SelectItem>
              <SelectItem value="error" className="text-popover-foreground hover:bg-accent">
                Error
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Only show business filter if not filtering by specific businessId */}
          {!businessId && (
            <Select value={filters.business} onValueChange={(value) => setFilters(prev => ({ ...prev, business: value }))}>
              <SelectTrigger className="w-[180px] h-10 bg-background border-border text-foreground">
                <SelectValue placeholder="Business" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all" className="text-popover-foreground hover:bg-accent">
                  All Businesses
                </SelectItem>
                {Array.from(new Set(state.accounts.map((account) => account.business))).map((business) => (
                  <SelectItem key={business} value={business} className="text-popover-foreground hover:bg-accent">
                    {business}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedAccounts.length > 0 && (
        <div className={`${layout.flexBetween} gap-2 p-3 bg-muted rounded-lg border border-border`}>
          <span className="text-sm text-foreground font-medium">
            {selectedAccounts.length} account{selectedAccounts.length > 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="border-border text-foreground hover:bg-accent"
              onClick={() => setBulkTopUpOpen(true)}
            >
              <Wallet className="h-4 w-4 mr-1" />
              {contentTokens.actions.add} Funds
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-border text-foreground hover:bg-accent"
              onClick={handleBulkPause}
              disabled={state.loading.accounts}
            >
              <Pause className="h-4 w-4 mr-1" />
              Pause
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-border text-foreground hover:bg-accent"
              onClick={handleBulkResume}
              disabled={state.loading.accounts}
            >
              <Play className="h-4 w-4 mr-1" />
              Resume
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-border text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={handleBulkDelete}
              disabled={state.loading.accounts}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        {/* Table Header */}
        <div
          className="grid gap-4 px-6 py-2 border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wide"
          style={{ gridTemplateColumns: "40px 2.5fr 0.3fr 1.5fr 1fr 1fr 1fr 1fr 1fr 120px" }}
        >
          <div className="flex items-center">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={handleSelectAll}
              className="border-border data-[state=checked]:bg-[#c4b5fd] data-[state=checked]:border-[#c4b5fd]"
            />
          </div>
          <div>NAME</div>
          <div></div>
          <div>BUSINESS</div>
          <div>AD ACCOUNT</div>
          <div>BM ID</div>
          <div>TIMEZONE</div>
          <div>STATUS</div>
          <div>BALANCE</div>
          <div></div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border">
          {filteredAccounts.map((account) => (
            <div
              key={account.id}
              className={cn(
                "grid gap-4 px-6 py-2 hover:bg-muted/50 transition-colors group cursor-pointer border-b border-border",
                selectedAccounts.includes(account.id) && "bg-muted/30",
              )}
              style={{ gridTemplateColumns: "40px 2.5fr 0.3fr 1.5fr 1fr 1fr 1fr 1fr 1fr 120px" }}
            >
              {/* Checkbox */}
              <div className="flex items-center">
                <Checkbox
                  checked={selectedAccounts.includes(account.id)}
                  onCheckedChange={(checked) => handleSelectAccount(account.id)}
                  className="border-border data-[state=checked]:bg-[#c4b5fd] data-[state=checked]:border-[#c4b5fd]"
                />
              </div>

              {/* Name */}
              <div className="flex flex-col justify-center min-w-0">
                <div className="font-medium text-foreground truncate">{account.name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full transition-all duration-300", getQuotaUsageColor(account.quota))}
                      style={{ width: `${Math.min(account.quota, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{account.quota}%</span>
                </div>
              </div>
              <div></div>

              {/* Business */}
              <div className="flex items-center">
                <span className="text-sm text-foreground truncate">{account.business}</span>
              </div>

              {/* Ad Account */}
              <div className="flex items-center">
                <div className="text-xs font-mono text-foreground bg-muted px-2 py-1 rounded border">
                  {account.accountId.slice(-8)}
                </div>
              </div>

              {/* BM ID */}
              <div className="flex items-center">
                {account.platform === "Meta" ? (
                  <div className="text-xs font-mono text-foreground bg-muted px-2 py-1 rounded border">
                    {account.id.slice(-8)}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </div>

              {/* Timezone */}
              <div className="flex items-center">
                <span className="text-xs text-foreground">{formatTimezone("America/New_York")}</span>
              </div>

              {/* Status */}
              <div className="flex items-center">
                <StatusBadge status={account.status as any} size="sm" />
              </div>

              {/* Balance */}
              <div className="flex items-center">
                <span className="text-sm font-medium text-foreground">${formatCurrency(account.balance)}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2">
                {/* Top Up Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTopUp(account)}
                  className="h-7 px-2 text-xs border-border hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Wallet className="h-3 w-3 mr-1" />
                  Top Up
                </Button>

                {/* 3-dot Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover border-border w-48">
                    <DropdownMenuItem 
                      className="text-popover-foreground hover:bg-accent"
                      onClick={() => handleViewTransactions(account)}
                    >
                      <Receipt className="h-3 w-3 mr-2" />
                      Transaction History
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-popover-foreground hover:bg-accent">
                      <Eye className="h-3 w-3 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-popover-foreground hover:bg-accent">
                      <ArrowUpRight className="h-3 w-3 mr-2" />
                      Open in Facebook
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem 
                      className="text-popover-foreground hover:bg-accent"
                      onClick={() => handleWithdrawBalance(account)}
                    >
                      <ArrowDownLeft className="h-3 w-3 mr-2" />
                      Withdraw Balance
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-popover-foreground hover:bg-accent"
                      onClick={() => handleCopyAccountId(account.accountId)}
                    >
                      <Copy className="h-3 w-3 mr-2" />
                      Copy Account ID
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border" />
                    {(() => {
                      const originalAccount = state.accounts.find(acc => acc.id === Number(account.id))
                      return originalAccount?.status === 'active' ? (
                        <DropdownMenuItem 
                          className="text-popover-foreground hover:bg-accent"
                          onClick={() => handlePauseAccount(originalAccount)}
                        >
                          <Pause className="h-3 w-3 mr-2" />
                          Pause Account
                        </DropdownMenuItem>
                      ) : originalAccount?.status === 'paused' ? (
                        <DropdownMenuItem 
                          className="text-popover-foreground hover:bg-accent"
                          onClick={() => handleResumeAccount(originalAccount)}
                        >
                          <Play className="h-3 w-3 mr-2" />
                          Resume Account
                        </DropdownMenuItem>
                      ) : null
                    })()}
                    <DropdownMenuItem 
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        const originalAccount = state.accounts.find(acc => acc.id === Number(account.id))
                        if (originalAccount) handleDeleteAccount(originalAccount)
                      }}
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Delete Account
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="text-xs text-muted-foreground">
        Showing {filteredAccounts.length} of {transformedAccounts.length} accounts
      </div>

      {/* Dialogs */}
      <AccountTransactionsDialog
        account={transactionsAccount}
        open={transactionsAccount !== null}
        onOpenChange={(open) => {
          if (!open) {
            setTransactionsAccount(null)
          }
        }}
      />
      
      <WithdrawBalanceDialog
        account={withdrawAccount}
        open={withdrawAccount !== null}
        onOpenChange={(open) => {
          if (!open) {
            setWithdrawAccount(null)
          }
        }}
      />
      
      <TopUpDialog
        account={transactionsAccount}
        open={transactionsAccount !== null}
        onOpenChange={(open) => {
          if (!open) {
            setTransactionsAccount(null)
          }
        }}
      />

      <ViewDetailsDialog
        account={viewAccount}
        open={viewAccount !== null}
        onOpenChange={(open) => {
          if (!open) {
            setViewAccount(null)
          }
        }}
      />

      <BulkTopUpDialog
        selectedAccounts={selectedAccounts.map(id => {
          const originalAccount = state.accounts.find(acc => acc.id === Number(id))
          return originalAccount
        }).filter((account): account is MockAccount => account !== undefined)}
        open={bulkTopUpOpen}
        onOpenChange={setBulkTopUpOpen}
        onTopUpComplete={() => {
          setSelectedAccounts([])
          setBulkTopUpOpen(false)
        }}
      />
    </div>
  )
}
