"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import { StatusDot } from "@/components/status-dot"
import { MOCK_ACCOUNTS } from "@/data/mock-accounts"
import { formatCurrency } from "@/utils/format"
import { Search, MoreHorizontal, Eye, Edit, Trash2, Pause, Play, CreditCard } from "lucide-react"

export function AccountsTable() {
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("name")

  // Transform and filter accounts
  const transformedAccounts = useMemo(() => {
    return MOCK_ACCOUNTS.map((account) => ({
      id: account.id.toString(),
      name: account.name,
      accountId: account.adAccount,
      business: account.business,
      status: account.status === "paused" ? "inactive" : account.status,
      balance: account.balance,
      spendLimit: account.spendLimit,
      dateAdded: account.dateAdded,
      quota: account.quota,
      spent: account.spent,
      platform: account.platform,
    }))
  }, [])

  const filteredAccounts = useMemo(() => {
    let filtered = transformedAccounts

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (account) =>
          account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          account.business.toLowerCase().includes(searchQuery.toLowerCase()) ||
          account.accountId.includes(searchQuery),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((account) => account.status === statusFilter)
    }

    return filtered
  }, [transformedAccounts, searchQuery, statusFilter])

  const sortedAccounts = useMemo(() => {
    const sorted = [...filteredAccounts]

    switch (sortBy) {
      case "name":
        return sorted.sort((a, b) => a.name.localeCompare(b.name))
      case "balance":
        return sorted.sort((a, b) => b.balance - a.balance)
      case "dateAdded":
        return sorted.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
      case "quota":
        return sorted.sort((a, b) => b.quota - a.quota)
      default:
        return sorted
    }
  }, [filteredAccounts, sortBy])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAccounts(sortedAccounts.map((account) => account.id))
    } else {
      setSelectedAccounts([])
    }
  }

  const handleSelectAccount = (accountId: string, checked: boolean) => {
    if (checked) {
      setSelectedAccounts((prev) => [...prev, accountId])
    } else {
      setSelectedAccounts((prev) => prev.filter((id) => id !== accountId))
    }
  }

  const isAllSelected = sortedAccounts.length > 0 && selectedAccounts.length === sortedAccounts.length
  const isIndeterminate = selectedAccounts.length > 0 && selectedAccounts.length < sortedAccounts.length

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search accounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] h-10 bg-background border-border text-foreground">
            <SelectValue placeholder="Filter by status" />
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
              Failed
            </SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[160px] h-10 bg-background border-border text-foreground">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="name" className="text-popover-foreground hover:bg-accent">
              Name
            </SelectItem>
            <SelectItem value="balance" className="text-popover-foreground hover:bg-accent">
              Balance
            </SelectItem>
            <SelectItem value="dateAdded" className="text-popover-foreground hover:bg-accent">
              Date Added
            </SelectItem>
            <SelectItem value="quota" className="text-popover-foreground hover:bg-accent">
              Quota
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedAccounts.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border border-border">
          <span className="text-sm text-foreground font-medium">
            {selectedAccounts.length} account{selectedAccounts.length > 1 ? "s" : ""} selected
          </span>
          <Button variant="outline" size="sm" className="ml-auto border-border text-foreground hover:bg-accent">
            <Pause className="h-4 w-4 mr-1" />
            Pause
          </Button>
          <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-accent">
            <Play className="h-4 w-4 mr-1" />
            Resume
          </Button>
          <Button variant="outline" size="sm" className="border-border text-destructive hover:bg-destructive/10">
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-muted/50">
              <TableHead className="w-12 text-muted-foreground">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all accounts"
                  className="border-border data-[state=checked]:bg-[#c4b5fd] data-[state=checked]:border-[#c4b5fd]"
                />
              </TableHead>
              <TableHead className="text-muted-foreground font-medium">Account</TableHead>
              <TableHead className="text-muted-foreground font-medium">Business</TableHead>
              <TableHead className="text-muted-foreground font-medium">Status</TableHead>
              <TableHead className="text-muted-foreground font-medium">Balance</TableHead>
              <TableHead className="text-muted-foreground font-medium">Spend Limit</TableHead>
              <TableHead className="text-muted-foreground font-medium">Date Added</TableHead>
              <TableHead className="w-12 text-muted-foreground"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAccounts.map((account) => (
              <TableRow key={account.id} className="border-border hover:bg-muted/30 transition-colors">
                <TableCell>
                  <Checkbox
                    checked={selectedAccounts.includes(account.id)}
                    onCheckedChange={(checked) => handleSelectAccount(account.id, checked as boolean)}
                    aria-label={`Select ${account.name}`}
                    className="border-border data-[state=checked]:bg-[#c4b5fd] data-[state=checked]:border-[#c4b5fd]"
                  />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium text-foreground">{account.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{account.accountId}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-foreground">{account.business}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <StatusDot status={account.status as any} />
                    <StatusBadge status={account.status as any} size="sm" />
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium text-foreground">${formatCurrency(account.balance)}</span>
                </TableCell>
                <TableCell>
                  <span className="text-foreground">${formatCurrency(account.spendLimit)}</span>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground">{account.dateAdded}</span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent">
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border-border">
                      <DropdownMenuItem className="text-popover-foreground hover:bg-accent">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-popover-foreground hover:bg-accent">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Account
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border" />
                      <DropdownMenuItem className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Empty State */}
      {sortedAccounts.length === 0 && (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No ad accounts found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Get started by creating your first ad account"}
          </p>
        </div>
      )}
    </div>
  )
}
