"use client"

import { useState, useMemo } from "react"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { StatusDot } from "../dashboard/status-dot"
import { BusinessAccountsTable } from "./business-accounts-table"
import { AccountsTable } from "../dashboard/accounts-table"
import { Search, Plus } from "lucide-react"

type AccountStatus = "active" | "pending" | "disabled" | "idle" | "archived" | "error" | "warning" | "success" | "info" | "suspended" | "inactive"

interface Account {
  id: string
  name: string
  accountId: string
  status: AccountStatus
  users?: number
  billings?: number
  type?: string
  partner?: string
  currency?: string
  ads?: number
  estimated?: string
  holds?: string
  balance: string | number
  totalSpend?: string | number
  spendToday?: string | number
  hasIssues?: boolean
  spendLimit?: string
  dateAdded?: string
  performance?: string
}

interface AccountsTabProps {
  accounts: Account[]
  onCreateAccount?: () => void
}

export function AccountsTab({ accounts, onCreateAccount }: AccountsTabProps) {
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const matchesSearch = 
        account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.accountId.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === "all" || account.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [accounts, searchQuery, statusFilter])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = accounts.reduce((acc, account) => {
      acc[account.status] = (acc[account.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      all: accounts.length,
      active: counts.active || 0,
      pending: counts.pending || 0,
      inactive: counts.inactive || 0,
      suspended: counts.suspended || 0,
      error: counts.error || 0,
      disabled: counts.disabled || 0,
    }
  }, [accounts])

  const handleSelectAccount = (accountId: string, checked: boolean) => {
    if (checked) {
      setSelectedAccounts(prev => [...prev, accountId])
    } else {
      setSelectedAccounts(prev => prev.filter(id => id !== accountId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAccounts(filteredAccounts.map(account => account.id))
    } else {
      setSelectedAccounts([])
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Ad Accounts</h2>
          <p className="text-sm text-muted-foreground">
            Manage your advertising accounts and budgets
          </p>
        </div>
        
        <Button onClick={onCreateAccount} className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0">
          <Plus className="h-4 w-4 mr-2" />
          Request Account
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search accounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <span>All Statuses</span>
                <span className="text-xs text-muted-foreground">({statusCounts.all})</span>
              </div>
            </SelectItem>
            <SelectItem value="active">
              <div className="flex items-center gap-2">
                <StatusDot status="active" />
                <span>Active</span>
                <span className="text-xs text-muted-foreground">({statusCounts.active})</span>
              </div>
            </SelectItem>
            <SelectItem value="pending">
              <div className="flex items-center gap-2">
                <StatusDot status="pending" />
                <span>Pending</span>
                <span className="text-xs text-muted-foreground">({statusCounts.pending})</span>
              </div>
            </SelectItem>
            <SelectItem value="inactive">
              <div className="flex items-center gap-2">
                <StatusDot status="inactive" />
                <span>Inactive</span>
                <span className="text-xs text-muted-foreground">({statusCounts.inactive})</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {filteredAccounts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No accounts found</p>
          </div>
        ) : (
          <>
            <AccountsTable />
            
            <div className="text-sm text-muted-foreground">
              Showing {filteredAccounts.length} of {accounts.length} accounts
            </div>
          </>
        )}
      </div>
    </div>
  )
}
