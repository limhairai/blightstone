"use client"

import { useState, useMemo } from "react"
import { Button } from "../ui/button"
import { Checkbox } from "../ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "../ui/status-badge"
import { CompactFilters } from "./compact-filters"
import { CreateAdAccountDialog } from "../accounts/create-ad-account-dialog"
import { TopUpDialog } from "./top-up-dialog"
import { MOCK_ACCOUNTS, type MockAccount } from "../../lib/mock-data"
import { formatCurrency } from "../../lib/utils"
import { MoreHorizontal, Eye, ArrowUpRight, ArrowDownLeft, Wallet, Pause, Play, Copy, Plus, TrendingUp, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react"
import { cn } from "../../lib/utils"

export function CompactAccountsTable() {
  const [accounts, setAccounts] = useState<MockAccount[]>(MOCK_ACCOUNTS)
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    platform: "all",
    business: "all",
  })
  const [selectedAccount, setSelectedAccount] = useState<MockAccount | null>(null)
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false)

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const matchesSearch = 
        account.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        account.business.toLowerCase().includes(filters.search.toLowerCase()) ||
        account.adAccount.includes(filters.search)
      
      const matchesStatus = filters.status === "all" || account.status === filters.status
      const matchesPlatform = filters.platform === "all" || account.platform === filters.platform
      const matchesBusiness = filters.business === "all" || account.business === filters.business
      
      return matchesSearch && matchesStatus && matchesPlatform && matchesBusiness
    })
  }, [accounts, filters])

  const getStatusIcon = (status: MockAccount["status"]) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "paused":
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "inactive":
        return <XCircle className="h-4 w-4 text-gray-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getQuotaUsageColor = (spent: number, quota: number) => {
    const percentage = (spent / quota) * 100
    if (percentage >= 90) return "bg-red-500"
    if (percentage >= 75) return "bg-orange-500"
    if (percentage >= 50) return "bg-yellow-500"
    return "bg-emerald-500"
  }

  const handleTopUp = (account: MockAccount) => {
    setSelectedAccount(account)
    setTopUpDialogOpen(true)
  }

  const handleAccountCreated = () => {
    // Refresh accounts or handle new account creation
    console.log("New account created")
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Ad Accounts</h2>
          <p className="text-sm text-muted-foreground">Manage your advertising accounts and budgets</p>
        </div>
        <CreateAdAccountDialog
          trigger={
            <Button className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0">
              <Plus className="h-4 w-4 mr-2" />
              Request Account
            </Button>
          }
          onAccountCreated={handleAccountCreated}
        />
      </div>

      {/* Filters */}
      <CompactFilters filters={filters} onFiltersChange={setFilters} />

      {/* Accounts Grid */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {filteredAccounts.map((account) => (
          <div
            key={account.id}
            className="bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {getStatusIcon(account.status)}
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{account.name}</h3>
                  <p className="text-xs text-muted-foreground">{account.business}</p>
                </div>
              </div>
              <StatusBadge status={account.status} size="sm" />
            </div>

            {/* Account ID */}
            <div className="mb-3">
              <p className="text-xs text-muted-foreground">Account ID</p>
              <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{account.adAccount}</code>
            </div>

            {/* Balance & Spend Limit */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="text-center p-2 bg-muted/30 rounded-md">
                <p className="text-xs text-muted-foreground mb-1">Balance</p>
                <p className="font-semibold text-foreground">${formatCurrency(account.balance)}</p>
              </div>
              <div className="text-center p-2 bg-muted/30 rounded-md">
                <p className="text-xs text-muted-foreground mb-1">Spend Limit</p>
                <p className="font-semibold text-foreground">${formatCurrency(account.spendLimit)}</p>
              </div>
            </div>

            {/* Quota Usage */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-muted-foreground">Quota Usage</span>
                <span className="text-xs text-muted-foreground">
                  ${formatCurrency(account.spent)} / ${formatCurrency(account.quota)}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    getQuotaUsageColor(account.spent, account.quota)
                  )}
                  style={{ width: `${Math.min((account.spent / account.quota) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {((account.spent / account.quota) * 100).toFixed(1)}% used
              </p>
            </div>

            {/* Platform & Date */}
            <div className="flex justify-between items-center text-xs text-muted-foreground mb-3">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {account.platform}
              </span>
              <span>Added {account.dateAdded}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTopUp(account)}
                disabled={account.status !== "active"}
                className="flex-1 border-border text-foreground hover:bg-accent"
              >
                <Wallet className="h-3 w-3 mr-1" />
                Top Up
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-border text-foreground hover:bg-accent"
              >
                View
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredAccounts.length === 0 && (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No accounts found</h3>
          <p className="text-muted-foreground mb-4">
            {filters.search || filters.status !== "all" || filters.platform !== "all" || filters.business !== "all"
              ? "Try adjusting your filters"
              : "Get started by requesting your first ad account"}
          </p>
        </div>
      )}

      {/* Results count */}
      <div className="text-xs text-muted-foreground">
        Showing {filteredAccounts.length} of {accounts.length} accounts
      </div>

      {/* Top Up Dialog */}
      <TopUpDialog
        account={selectedAccount}
        open={topUpDialogOpen}
        onOpenChange={setTopUpDialogOpen}
      />
    </div>
  )
}
