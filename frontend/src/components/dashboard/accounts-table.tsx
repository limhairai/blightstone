"use client"

import type React from "react"
import { useState, useMemo, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import useSWR, { useSWRConfig } from 'swr'
import { useDebounce } from 'use-debounce';
import { useOrganizationStore } from "@/lib/stores/organization-store"
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
import { MoreHorizontal, Eye, ArrowUpRight, ArrowDownLeft, Wallet, Pause, Play, Copy, Receipt, Trash2, RefreshCw, CreditCard, SearchIcon, Target, Plus } from "lucide-react"
import { toast } from "sonner"
import { LoadingState, ErrorState, EmptyState } from "../ui/comprehensive-states"
import { Skeleton } from "../ui/skeleton";
import { formatCurrency } from "../../lib/config/financial"

const fetcher = (url: string) => fetch(url).then(res => res.json());

// TODO: Define a proper type for the ad account object
type AdAccount = any;

export function AccountsTable() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentOrganizationId } = useOrganizationStore();
  const { mutate } = useSWRConfig();
  
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    business: searchParams?.get('business') || "all"
  })
  const [debouncedSearch] = useDebounce(filters.search, 500);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (currentOrganizationId) params.set('organization_id', currentOrganizationId);
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (filters.status !== 'all') params.set('status', filters.status);
    if (filters.business !== 'all') params.set('business_id', filters.business);
    // Add pagination params later if needed
    // params.set('page', currentPage.toString());
    // params.set('limit', itemsPerPage.toString());
    return params.toString();
  }, [currentOrganizationId, debouncedSearch, filters.status, filters.business]);

  const accountsSWRKey = currentOrganizationId ? `/api/ad-accounts?${queryString}` : null;
  const { data: accountsData, error, isLoading } = useSWR(accountsSWRKey, fetcher, { keepPreviousData: true });

  const { data: businessesData } = useSWR(
    currentOrganizationId ? `/api/businesses?organization_id=${currentOrganizationId}` : null,
    fetcher
  );

  const accounts = accountsData?.accounts || [];
  
  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }

  const handleBulkAction = async (action: 'pause' | 'resume' | 'delete') => {
    // TODO: Bulk actions disabled - backend PATCH/DELETE endpoints removed
    // These operations need to be implemented for Dolphin assets:
    // 1. Update binding status in 'client_asset_bindings' table, or  
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
    setSelectedAccounts(
      selectedAccounts.length === accounts.length 
        ? [] 
        : accounts.map(account => account.id)
    )
  }
  
  const isAllSelected = accounts.length > 0 && selectedAccounts.length === accounts.length

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message="Failed to load ad accounts." />

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
            <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
                <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
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
              <th className="p-2 text-left">Account Name</th>
              <th className="p-2 text-left">Business</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-right">Balance</th>
              <th className="p-2 text-right">Spend</th>
              <th className="p-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account: AdAccount) => (
              <tr key={account.id} className="border-b hover:bg-muted/50">
                <td className="p-2 text-center"><Checkbox checked={selectedAccounts.includes(account.id)} onCheckedChange={() => handleSelectAccount(account.id)} /></td>
                <td className="p-2">
                    <div className="font-medium">{account.name}</div>
                    <div className="text-xs text-muted-foreground">{account.ad_account_id}</div>
                </td>
                <td className="p-2">{account.businesses?.name || 'N/A'}</td>
                <td className="p-2"><StatusBadge status={account.status} /></td>
                <td className="p-2 text-right font-mono">{formatCurrency(account.balance_cents / 100)}</td>
                <td className="p-2 text-right font-mono">{formatCurrency(account.spend_cents / 100)}</td>
                <td className="p-2 text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Top-up Balance</DropdownMenuItem>
                        <DropdownMenuItem>View Transactions</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-500">Delete Account</DropdownMenuItem>
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
    </div>
  )
}
