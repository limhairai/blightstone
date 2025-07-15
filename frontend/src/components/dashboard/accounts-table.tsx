"use client"

import type React from "react"
import { useState, useMemo, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import useSWR, { useSWRConfig } from 'swr'
import { useDebounce } from 'use-debounce';
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { useAuth } from "../../contexts/AuthContext"
import { Checkbox } from "../ui/checkbox"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { StatusBadge } from "../ui/status-badge"
import { MoreHorizontal, Eye, ArrowUpRight, ArrowDownLeft, Wallet, Pause, Play, Copy, Receipt, Trash2, RefreshCw, CreditCard, SearchIcon, Target, Plus, Power, PowerOff } from "lucide-react"
import { toast } from "sonner"
import { LoadingState, ErrorState, EmptyState } from "../ui/states"
import { Skeleton } from "../ui/skeleton";
import { formatCurrency } from "../../lib/config/financial"
import { AssetDeactivationDialog } from "../dashboard/AssetDeactivationDialog"
import { useAssetDeactivation } from "../../hooks/useAssetDeactivation"

const fetcher = (url: string, token: string) => 
  fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json());

// TODO: Define a proper type for the ad account object
type AdAccount = any;

export function AccountsTable() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { session } = useAuth()
  const { currentOrganizationId } = useOrganizationStore();
  const { mutate } = useSWRConfig();
  
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    business: searchParams?.get('business') || "all"
  })
  const [debouncedSearch] = useDebounce(filters.search, 500);

  // Add deactivation state
  const [deactivationDialog, setDeactivationDialog] = useState<{
    open: boolean;
    asset: any | null;
  }>({ open: false, asset: null });

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (filters.status !== 'all') params.set('status', filters.status);
    if (filters.business !== 'all') params.set('business_id', filters.business);
    
    // Check for bm_id in URL params and add it to the query
    const bmId = searchParams?.get('bm_id');
    if (bmId) params.set('bm_id', bmId);
    
    // Add pagination params later if needed
    // params.set('page', currentPage.toString());
    // params.set('limit', itemsPerPage.toString());
    return params.toString();
  }, [debouncedSearch, filters.status, filters.business, searchParams]);

  const accountsSWRKey = session && currentOrganizationId ? [`/api/ad-accounts?${queryString}`, session.access_token] : null;
  const { data: accountsData, error, isLoading } = useSWR(accountsSWRKey, ([url, token]) => fetcher(url, token), { keepPreviousData: true });

  const { data: businessesData } = useSWR(
    session && currentOrganizationId ? ['/api/businesses', session.access_token] : null,
    ([url, token]) => fetcher(url, token)
  );

  const accounts = accountsData?.accounts || [];
  
  // When businessesData is loaded, find the ID for the initial business name filter
  useEffect(() => {
    if (filters.business && businessesData?.businesses) {
      // Check if the current business filter is a name and not already a UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(filters.business);
      if (!isUuid) {
          const businessName = filters.business;
          const foundBusiness = businessesData.businesses.find((b: any) => b.name === businessName);
          if (foundBusiness) {
            // We found the business, now set the filter to its ID
            setFilters(prev => ({ ...prev, business: foundBusiness.id }));
          }
      }
    }
  }, [businessesData, filters.business]);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }

  const handleBulkAction = async (action: 'pause' | 'resume' | 'delete') => {
    // TODO: Bulk actions disabled - backend PATCH/DELETE endpoints removed
    // These operations need to be implemented for Dolphin assets:
            // 1. Update binding status in 'asset_binding' table to 'inactive', or  
    // 2. Make API calls to Dolphin Cloud to modify actual Facebook accounts
    toast.error(`${action} operation not yet implemented for Dolphin assets`);
    return;

    /* DISABLED CODE - kept for reference when implementing proper Dolphin asset management
    const newStatus = action === 'pause' ? 'paused' : 'active';
    const endpoint = '/api/ad-accounts';
    const method = action === 'delete' ? 'DELETE' : 'PATCH';

    const body = action === 'delete' 
        ? { accountIds: selectedAccounts }
        : { accountIds: selectedAccounts, status: newStatus };

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to ${action} accounts`);
      }

      toast.success(`Successfully ${action}d ${selectedAccounts.length} account(s).`);
      setSelectedAccounts([]);
      mutate(accountsSWRKey); // Revalidate the accounts data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(errorMessage);
    }
    */
  };
  
  const handleSelectAccount = (accountId: string) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    )
  }

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedAccounts([])
    } else {
      setSelectedAccounts(accounts.map((account: AdAccount) => account.id))
    }
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

  const onRefresh = () => {
    mutate(accountsSWRKey);
  }
  
  const isAllSelected = accounts.length > 0 && selectedAccounts.length === accounts.length

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState title="Error" description="Failed to load ad accounts." />

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between gap-2">
         <div className="relative flex-1 max-w-sm">
             <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input 
                placeholder="Search by name or ID..." 
                className="pl-10"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
             />
         </div>
         <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
                <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="restricted">Restricted</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
            </Select>
            <Select value={filters.business} onValueChange={(v) => handleFilterChange('business', v)}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Business" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Businesses</SelectItem>
                    {businessesData?.businesses?.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
            </Select>
         </div>
      </div>
      
      {/* Bulk Actions */}
      {selectedAccounts.length > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-md border">
            <span className="text-sm font-medium">{selectedAccounts.length} selected</span>
            <Button size="sm" variant="outline" onClick={() => handleBulkAction('resume')}>
                <Play className="h-4 w-4 mr-2" /> Resume
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkAction('pause')}>
                <Pause className="h-4 w-4 mr-2" /> Pause
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2 w-10 text-center"><Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} /></th>
              <th className="p-2 text-left">Ad Account Name</th>
              <th className="p-2 text-left">Ad Account ID</th>
              <th className="p-2 text-left">Business Manager</th>
              <th className="p-2 text-left">BM ID</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-right">Available Spend</th>
              <th className="p-2 text-right">Spend</th>
              <th className="p-2 text-left">Timezone</th>
              <th className="p-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account: AdAccount) => (
              <tr key={account.id} className="border-b hover:bg-muted/50">
                <td className="p-2 text-center"><Checkbox checked={selectedAccounts.includes(account.id)} onCheckedChange={() => handleSelectAccount(account.id)} /></td>
                <td className="p-2">
                    <div className="font-medium">{account.name}</div>
                </td>
                <td className="p-2">
                    <div className="font-mono text-sm">{account.ad_account_id}</div>
                </td>
                <td className="p-2">
                  <div>{account.metadata?.business_manager || account.business_manager_name || 'N/A'}</div>
                </td>
                <td className="p-2">
                  <div className="font-mono text-xs text-muted-foreground">
                    {account.metadata?.business_manager_id ? account.metadata.business_manager_id.substring(0, 12) : 'N/A'}
                  </div>
                </td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={account.status} />
                    {account.is_active === false && (
                      <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded">
                        Deactivated
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-2 text-right font-mono">
                  {formatCurrency(Math.max(0, ((account.spend_cap_cents || 0) / 100) - ((account.spend_cents || 0) / 100)))}
                </td>
                <td className="p-2 text-right font-mono">
                  {formatCurrency((account.spend_cents || 0) / 100)}
                </td>
                <td className="p-2 text-sm text-muted-foreground">{account.timezone || 'UTC'}</td>
                <td className="p-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Top-up Balance</DropdownMenuItem>
                      <DropdownMenuItem>View Transactions</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-500">
                        Remove from Business
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => handleDeactivationClick(account, e)}
                        className="text-muted-foreground"
                      >
                        {account.is_active === false ? (
                          <>
                            <Power className="h-4 w-4 mr-2" />
                            Activate
                          </>
                        ) : (
                          <>
                            <PowerOff className="h-4 w-4 mr-2" />
                            Deactivate
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {accounts.length === 0 && (
        <EmptyState
          icon={Target}
          title="No ad accounts found"
          description="Get started by applying for your first business"
          type="first-time"
        />
      )}
      {/* Add pagination controls here if needed */}
        
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
            onSuccess={onRefresh}
          />
        )}
    </div>
  )
}
