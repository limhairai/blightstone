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
import { BalanceResetDialog } from "@/components/accounts/balance-reset-dialog"
import { TransferBalanceDialog } from "@/components/accounts/transfer-balance-dialog"
import { formatCurrency } from "@/utils/format"
import { MoreHorizontal, ArrowDownLeft, ArrowRightLeft, Wallet, Copy, Plus, Power, PowerOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { Loader2, AlertCircle, Target } from "lucide-react"
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/states"
import { useOrganizationStore } from "../../lib/stores/organization-store"
import { useAdAccounts, useBusinessManagers } from "@/lib/swr-config"
import { AssetDeactivationDialog } from "@/components/dashboard/AssetDeactivationDialog"
import { useAssetDeactivation } from "@/hooks/useAssetDeactivation"

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
  const { currentOrganizationId } = useOrganizationStore();
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [resetBalanceAccount, setResetBalanceAccount] = useState<any>(null)
  const [transferBalanceAccount, setTransferBalanceAccount] = useState<any>(null)
  
  // Add deactivation state
  const [deactivationDialog, setDeactivationDialog] = useState<{
    open: boolean;
    asset: any | null;
  }>({ open: false, asset: null });

  // Use optimized hooks instead of direct SWR calls
  const { data: accounts, error, isLoading, mutate } = useAdAccounts(bmIdFilter);
  const { data: businessManagers } = useBusinessManagers();

  // Transform accounts data
  const transformedAccounts = useMemo(() => {
    if (!accounts?.accounts || !Array.isArray(accounts.accounts)) return [];
    
    return accounts.accounts.map((account: any) => {
      // Use balance_cents, spend_cents, and spend_cap_cents from API, convert to dollars
      const balanceDollars = (account.balance_cents || 0) / 100;
      const spentDollars = (account.spend_cents || 0) / 100;
      const spendCapDollars = (account.spend_cap_cents || 0) / 100;
      
      // Calculate available spend: spend_cap - amount_spent
      // This is the key calculation - how much the client can still spend
      const availableSpend = spendCapDollars > 0 ? Math.max(0, spendCapDollars - spentDollars) : balanceDollars;
      
      // Calculate quota info - if we have balance and spent, we can infer quota
      const quota = balanceDollars + spentDollars;
      const quotaUsage = quota > 0 ? Math.round((spentDollars / quota) * 100) : 0;

      return {
        id: account.id,
        asset_id: account.asset_id || account.id,
        name: account.name,
        adAccount: account.ad_account_id || account.dolphin_account_id,
        business: account.business_manager_name || 'Unknown',
        bmId: account.business_manager_id || null,
        status: account.status,
        is_active: account.is_active !== false, // Add is_active field
        balance: balanceDollars, // Keep original balance for backward compatibility
        availableSpend: availableSpend, // NEW: Available spend calculation
        spent: spentDollars,
        spendCap: spendCapDollars, // NEW: Spend cap for reference
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
        (account: any) =>
          account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          account.business.toLowerCase().includes(searchQuery.toLowerCase()) ||
          account.adAccount.includes(searchQuery) ||
          (account.bmId && account.bmId.includes(searchQuery)) ||
          account.timezone.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((account: any) => account.status === statusFilter)
    }

    if (businessFilter !== "all") {
      filtered = filtered.filter((account: any) => account.business === businessFilter)
    }

    return filtered
  }, [transformedAccounts, searchQuery, statusFilter, businessFilter])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAccounts(filteredAccounts.map((account: any) => account.id))
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
  
  // Add deactivation handler
  const handleDeactivationClick = (account: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeactivationDialog({
      open: true,
      asset: {
        id: account.id,
        asset_id: account.asset_id || account.id,
        name: account.name,
        type: 'ad_account',
        is_active: account.is_active !== false
      }
    });
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
        businessManagers={Array.isArray(businessManagers) ? businessManagers.filter((bm: any) => !bm.is_application && bm.status === 'active') : []}
      />

      {/* Bulk Actions */}
      {selectedAccounts.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border border-border">
          <span className="text-sm text-foreground font-medium">
            {selectedAccounts.length} account{selectedAccounts.length > 1 ? "s" : ""} selected
          </span>
          <TopUpDialog
            accounts={selectedAccounts.map(id => {
              const account = filteredAccounts.find((acc: any) => acc.id === id)!;
              return {
                id: account.id,
                name: account.name,
                adAccount: account.adAccount,
                balance: account.balance, // Keep original balance for backward compatibility
                availableSpend: account.availableSpend,
                currency: account.currency,
                business: account.business,
                bmId: account.bmId
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

        </div>
      )}

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        {/* Table Header */}
        <div
          className="grid gap-4 px-6 py-4 border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wide"
          style={{ gridTemplateColumns: "40px 180px 20px 160px 130px 130px 80px 80px 100px 160px" }}
        >
          <div className="flex items-center">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={handleSelectAll}
              className="border-border data-[state=checked]:bg-[#c4b5fd] data-[state=checked]:border-[#c4b5fd]"
            />
          </div>
          <div className="flex items-center">NAME</div>
          <div></div>
          <div className="flex items-center">BUSINESS</div>
          <div className="flex items-center">AD ACCOUNT</div>
          <div className="flex items-center">BM ID</div>
          <div className="flex items-center">TIMEZONE</div>
          <div className="flex items-center">STATUS</div>
          <div className="flex items-center">AVAILABLE SPEND</div>
          <div></div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border">
          {filteredAccounts.map((account: any) => (
            <div
              key={account.id}
              className={cn(
                "grid gap-4 px-6 py-5 hover:bg-muted/50 transition-colors group cursor-pointer border-b border-border",
                selectedAccounts.includes(account.id) && "bg-muted/30",
                account.is_active === false && "opacity-50 grayscale"
              )}
              style={{ gridTemplateColumns: "40px 180px 20px 160px 130px 130px 80px 80px 100px 160px" }}
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
              <div className="flex items-center gap-2">
                {account.is_active === false ? (
                  <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded">
                    Deactivated
                  </span>
                ) : (
                  <StatusBadge status={account.status as any} size="sm" />
                )}
              </div>

              {/* Available Spend */}
              <div className="flex items-center">
                <span className="text-sm font-medium text-foreground">${formatCurrency(account.availableSpend)}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2">
                {/* 3-dot Menu - moved to the left */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => e.stopPropagation()}
                      className="h-8 w-8 opacity-100 hover:bg-accent"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover border-border w-48">
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
                      onClick={(e) => {
                        e.stopPropagation()
                        setTransferBalanceAccount({
                          id: account.id,
                          name: account.name,
                          adAccount: account.adAccount,
                          balance: account.availableSpend, // Use availableSpend as balance
                          currency: account.currency,
                          business: account.business,
                          bmId: account.bmId
                        })
                      }}
                    >
                      <ArrowRightLeft className="h-3 w-3 mr-2" />
                      Transfer Balance
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-popover-foreground hover:bg-accent"
                      onClick={(e) => {
                        e.stopPropagation()
                        setResetBalanceAccount({
                          id: account.id,
                          name: account.name,
                          adAccount: account.adAccount,
                          balance: account.availableSpend, // Use availableSpend as balance
                          currency: account.currency,
                          business: account.business,
                          bmId: account.bmId
                        })
                      }}
                    >
                      <ArrowDownLeft className="h-3 w-3 mr-2" />
                      Reset Balance
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem
                      className="text-popover-foreground hover:bg-accent"
                      onClick={(e) => handleDeactivationClick(account, e)}
                    >
                      {account.is_active === false ? (
                        <>
                          <Power className="h-3 w-3 mr-2" />
                          Activate
                        </>
                      ) : (
                        <>
                          <PowerOff className="h-3 w-3 mr-2" />
                          Deactivate
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Top Up Button */}
                <TopUpDialog
                  account={{
                    id: account.id,
                    name: account.name,
                    adAccount: account.adAccount,
                    balance: account.availableSpend, // Use availableSpend as balance
                    currency: account.currency,
                    business: account.business,
                    bmId: account.bmId
                  }}
                  onSuccess={() => mutate()}
                  trigger={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                      }}
                      className="h-7 px-2 text-xs border-border hover:bg-accent"
                    >
                      <Wallet className="h-3 w-3 mr-1" />
                      Top Up
                    </Button>
                  }
                />
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

      {/* Transfer Balance Dialog - Outside dropdown to prevent closing issues */}
      {transferBalanceAccount && (
        <TransferBalanceDialog
          account={transferBalanceAccount}
          onSuccess={() => {
            mutate()
            setTransferBalanceAccount(null)
          }}
          trigger={<></>}
          open={!!transferBalanceAccount}
          onOpenChange={(open) => {
            if (!open) {
              setTransferBalanceAccount(null)
            }
          }}
        />
      )}

      {/* Balance Reset Dialog - Outside dropdown to prevent closing issues */}
      {resetBalanceAccount && (
        <BalanceResetDialog
          account={resetBalanceAccount}
          onSuccess={() => {
            mutate()
            setResetBalanceAccount(null)
          }}
          trigger={<></>}
          open={!!resetBalanceAccount}
          onOpenChange={(open) => {
            if (!open) {
              setResetBalanceAccount(null)
            }
          }}
        />
      )}
      
      {/* Deactivation Dialog */}
      {deactivationDialog.asset && (
        <AssetDeactivationDialog
          asset={{
            id: deactivationDialog.asset.id,
            asset_id: deactivationDialog.asset.asset_id || deactivationDialog.asset.id,
            name: deactivationDialog.asset.name,
            type: 'ad_account',
            is_active: deactivationDialog.asset.is_active !== false
          }}
          open={deactivationDialog.open}
          onOpenChange={(open) => setDeactivationDialog({ open, asset: open ? deactivationDialog.asset : null })}
          onSuccess={mutate}
        />
      )}
    </div>
  )
} 