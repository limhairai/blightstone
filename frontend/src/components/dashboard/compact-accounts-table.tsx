"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/ui/status-badge"
import { CompactFilters } from "@/components/dashboard/compact-filters"
import { CreateAdAccountDialog } from "@/components/accounts/create-ad-account-dialog"
import { TopUpDialog } from "@/components/accounts/top-up-dialog"
import { formatCurrency } from "@/utils/format"
import { MoreHorizontal, Eye, ArrowUpRight, ArrowDownLeft, Wallet, Pause, Play, Copy, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import useSWR from 'swr'
import { useAuth } from "@/contexts/AuthContext"
import { Loader2, AlertCircle, Target } from "lucide-react"
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/states"
import { useOrganizationStore } from "../../lib/stores/organization-store"

const fetcher = (url: string, token: string) => fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json());

interface CompactAccountsTableProps {
  initialBusinessFilter?: string
  businessFilter: string
  onBusinessFilterChange: (filter: string) => void
  bmIdFilter?: string | null
}

export function CompactAccountsTable({
  initialBusinessFilter = "all",
  businessFilter,
  onBusinessFilterChange,
  bmIdFilter,
}: CompactAccountsTableProps) {
  const { session } = useAuth();
  const { currentOrganizationId } = useOrganizationStore();
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Build the API URL with bm_id parameter if provided
  const apiUrl = useMemo(() => {
    let url = '/api/ad-accounts';
    if (bmIdFilter) {
      url += `?bm_id=${encodeURIComponent(bmIdFilter)}`;
    }
    return url;
  }, [bmIdFilter]);

  const { data: accounts, error, isLoading, mutate } = useSWR(
    session ? [apiUrl, session.access_token] : null,
    ([url, token]) => fetcher(url, token)
  );

  // Fetch business managers for filtering with organization ID
  const { data: businessManagers } = useSWR(
    session && currentOrganizationId ? [`/api/business-managers?organization_id=${currentOrganizationId}`, session.access_token] : null,
    ([url, token]) => fetcher(url, token)
  );

  // Transform accounts data
  const transformedAccounts = useMemo(() => {
    if (!accounts?.accounts || !Array.isArray(accounts.accounts)) return [];
    
    return accounts.accounts.map((account: any) => {
      // Use balance_cents and spend_cents from API, convert to dollars
      const balanceDollars = (account.balance_cents || 0) / 100;
      const spentDollars = (account.spend_cents || 0) / 100;
      
      // Calculate quota info - if we have balance and spent, we can infer quota
      const quota = balanceDollars + spentDollars;
      const quotaUsage = quota > 0 ? Math.round((spentDollars / quota) * 100) : 0;

      return {
        id: account.id,
        name: account.name,
        adAccount: account.ad_account_id || account.dolphin_account_id,
        business: account.business_manager_name || 'Unknown',
        bmId: account.business_manager_id || null,
        status: account.status,
        balance: balanceDollars,
        spent: spentDollars,
        quota: quota,
        quotaUsage: quotaUsage,
        timezone: account.timezone || 'UTC',
        currency: 'USD',
      };
    });
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    let filtered = transformedAccounts

    if (searchQuery) {
      filtered = filtered.filter(
        (account) =>
          account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          account.business.toLowerCase().includes(searchQuery.toLowerCase()) ||
          account.adAccount.includes(searchQuery) ||
          (account.bmId && account.bmId.includes(searchQuery)) ||
          account.timezone.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((account) => account.status === statusFilter)
    }

    if (businessFilter !== "all") {
      filtered = filtered.filter((account) => account.business === businessFilter)
    }

    return filtered
  }, [transformedAccounts, searchQuery, statusFilter, businessFilter])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAccounts(filteredAccounts.map((account) => account.id))
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

  const isAllSelected = filteredAccounts.length > 0 && selectedAccounts.length === filteredAccounts.length

  const getQuotaUsageColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500"
    if (percentage >= 75) return "bg-yellow-500"
    return "bg-emerald-500"
  }

  const handleRowClick = (account: any, e: React.MouseEvent) => {
    // Don't open transactions if clicking on checkbox or buttons
    if ((e.target as HTMLElement).closest('input[type="checkbox"]') || (e.target as HTMLElement).closest("button")) {
      return
    }
    // For now, just copy account ID
    navigator.clipboard.writeText(account.adAccount)
  }

  const formatTimezone = (timezone: string) => {
    // Handle common timezone formats
    if (timezone === 'UTC' || timezone === 'GMT') {
      return 'UTC';
    }
    
    // Convert timezone to a more readable format
    const parts = timezone.split("/")
    if (parts.length === 2) {
      const region = parts[0]
      const city = parts[1].replace(/_/g, " ")

      // Map common regions to abbreviations
      const regionMap: { [key: string]: string } = {
        America: "US",
        Europe: "EU",
        Asia: "AS",
        Australia: "AU",
        Africa: "AF",
      }

      return `${regionMap[region] || region}/${city}`
    }
    
    // Handle timezone IDs like "America/New_York" -> "US/New York"
    if (timezone.includes('_')) {
      return timezone.replace(/_/g, ' ');
    }
    
    return timezone
  }

  if (isLoading) {
    return <LoadingState message="Loading ad accounts..." />
  }

  if (error) {
    return <ErrorState 
      title="Failed to load ad accounts" 
      description="Please try again later or contact support if the problem persists."
      onRetry={() => mutate()}
    />
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <CompactFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        businessFilter={businessFilter}
        onBusinessChange={onBusinessFilterChange}
        businessManagers={Array.isArray(businessManagers) ? businessManagers : []}
      />

      {/* Bulk Actions */}
      {selectedAccounts.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border border-border">
          <span className="text-sm text-foreground font-medium">
            {selectedAccounts.length} account{selectedAccounts.length > 1 ? "s" : ""} selected
          </span>
          <TopUpDialog
            accounts={selectedAccounts.map(id => {
              const account = filteredAccounts.find(acc => acc.id === id)!;
              return {
                id: account.id,
                name: account.name,
                adAccount: account.adAccount,
                balance: account.balance,
                currency: account.currency
              };
            })}
            onSuccess={() => {
              mutate();
              setSelectedAccounts([]);
            }}
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="ml-auto border-border text-foreground hover:bg-accent bg-transparent"
              >
                <Wallet className="h-4 w-4 mr-1" />
                Top Up Selected
              </Button>
            }
          />
          <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-accent bg-transparent">
            <Pause className="h-4 w-4 mr-1" />
            Pause
          </Button>
          <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-accent bg-transparent">
            <Play className="h-4 w-4 mr-1" />
            Resume
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        {/* Table Header */}
        <div
          className="grid gap-4 px-6 py-4 border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wide"
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
                "grid gap-4 px-6 py-5 hover:bg-muted/50 transition-colors group cursor-pointer border-b border-border",
                selectedAccounts.includes(account.id) && "bg-muted/30",
              )}
              style={{ gridTemplateColumns: "40px 2.5fr 0.3fr 1.5fr 1fr 1fr 1fr 1fr 1fr 120px" }}
              onClick={(e) => handleRowClick(account, e)}
            >
              {/* Checkbox */}
              <div className="flex items-center">
                <Checkbox
                  checked={selectedAccounts.includes(account.id)}
                  onCheckedChange={(checked) => handleSelectAccount(account.id, checked as boolean)}
                  className="border-border data-[state=checked]:bg-[#c4b5fd] data-[state=checked]:border-[#c4b5fd]"
                />
              </div>

              {/* Name */}
              <div className="flex flex-col justify-center min-w-0">
                <div className="font-medium text-foreground truncate">{account.name}</div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full transition-all duration-300", getQuotaUsageColor(account.quotaUsage))}
                      style={{ width: `${Math.min(account.quotaUsage, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{account.quotaUsage}%</span>
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
                  {account.adAccount}
                </div>
              </div>

              {/* BM ID */}
              <div className="flex items-center">
                {account.bmId ? (
                  <div className="text-xs font-mono text-foreground bg-muted px-2 py-1 rounded border">
                    {account.bmId}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </div>

              {/* Timezone */}
              <div className="flex items-center">
                <span className="text-xs text-foreground">{formatTimezone(account.timezone)}</span>
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
                <TopUpDialog
                  account={{
                    id: account.id,
                    name: account.name,
                    adAccount: account.adAccount,
                    balance: account.balance,
                    currency: account.currency
                  }}
                  onSuccess={() => mutate()}
                  trigger={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                      }}
                      className="h-7 px-2 text-xs border-border hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Wallet className="h-3 w-3 mr-1" />
                      Top Up
                    </Button>
                  }
                />

                {/* 3-dot Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => e.stopPropagation()}
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover border-border w-48">
                    <DropdownMenuItem
                      className="text-popover-foreground hover:bg-accent"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Handle view details
                      }}
                    >
                      <Eye className="h-3 w-3 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-popover-foreground hover:bg-accent"
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(
                          `https://business.facebook.com/adsmanager/manage/accounts?act=${account.adAccount}`,
                          "_blank",
                        )
                      }}
                    >
                      <ArrowUpRight className="h-3 w-3 mr-2" />
                      Open in Facebook
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem
                      className="text-popover-foreground hover:bg-accent"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigator.clipboard.writeText(account.adAccount)
                      }}
                    >
                      <Copy className="h-3 w-3 mr-2" />
                      Copy Account ID
                    </DropdownMenuItem>
                    {account.bmId && (
                      <DropdownMenuItem
                        className="text-popover-foreground hover:bg-accent"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigator.clipboard.writeText(account.bmId!)
                        }}
                      >
                        <Copy className="h-3 w-3 mr-2" />
                        Copy BM ID
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem
                      className="text-popover-foreground hover:bg-accent"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Pause className="h-3 w-3 mr-2" />
                      Pause Account
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

      {/* Empty state */}
      {filteredAccounts.length === 0 && !isLoading && (
        <EmptyState
          icon={Target}
          title="No ad accounts found"
          description="No accounts match your current filters. Try adjusting your search or filter criteria."
          type="search"
        />
      )}
    </div>
  )
} 