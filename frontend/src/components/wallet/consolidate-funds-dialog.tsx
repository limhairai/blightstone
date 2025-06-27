"use client"

import { useState, useEffect } from "react"
import useSWR, { useSWRConfig } from 'swr'
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog"
import { Button } from "../ui/button"
import { Checkbox } from "../ui/checkbox"
import { ScrollArea } from "../ui/scroll-area"
import { formatCurrency } from "../../utils/format"
import { ArrowUpDown, Info, Loader2 } from 'lucide-react'
import { toast } from "sonner"

interface ConsolidateFundsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function ConsolidateFundsDialog({ open, onOpenChange }: ConsolidateFundsDialogProps) {
    const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { currentOrganizationId } = useOrganizationStore();
    const { mutate } = useSWRConfig();

    const accountsSWRKey = currentOrganizationId ? `/api/ad-accounts?organization_id=${currentOrganizationId}` : null;
    const { data: accountsData, isLoading: areAccountsLoading } = useSWR(accountsSWRKey, fetcher);

    const accountsWithBalance = accountsData?.accounts?.filter((acc: any) => acc.balance_cents > 0) || [];

    // Effect to auto-select all accounts when the dialog is opened
    useEffect(() => {
        if (open && accountsWithBalance.length > 0) {
            setSelectedAccounts(accountsWithBalance.map((acc: any) => acc.id));
        }
    }, [open, accountsData]);

    const totalToConsolidate = accountsWithBalance
        .filter((acc: any) => selectedAccounts.includes(acc.id))
        .reduce((sum: number, acc: any) => sum + acc.balance_cents, 0);

    const handleToggleAccount = (accountId: string) => {
        setSelectedAccounts(prev => 
            prev.includes(accountId)
                ? prev.filter(id => id !== accountId)
                : [...prev, accountId]
        );
    }

    const handleToggleAll = () => {
        if (selectedAccounts.length === accountsWithBalance.length) {
            setSelectedAccounts([]);
        } else {
            setSelectedAccounts(accountsWithBalance.map((acc: any) => acc.id));
        }
    }

    const handleSubmit = async () => {
        if (selectedAccounts.length === 0) {
            toast.error("Please select at least one account to consolidate.");
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch('/api/wallet/consolidate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    organization_id: currentOrganizationId,
                    ad_account_ids: selectedAccounts
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to consolidate funds.');
            }

            toast.success("Funds consolidated successfully!");
            // Revalidate all related data
            mutate(accountsSWRKey);
            mutate(`/api/organizations?id=${currentOrganizationId}`);
            mutate(`/api/transactions?organization_id=${currentOrganizationId}`);
            onOpenChange(false);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            toast.error("Consolidation Failed", { description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    }

    const renderContent = () => {
        if (areAccountsLoading) {
            return (
                <div className="p-6 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">Loading accounts...</p>
                </div>
            )
        }

        if (accountsWithBalance.length === 0) {
            return (
                <div className="py-8 text-center">
                    <p className="text-muted-foreground">No ad accounts with funds available to consolidate.</p>
                </div>
            )
        }

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                        <Checkbox
                            id="select-all"
                            checked={selectedAccounts.length === accountsWithBalance.length}
                            onCheckedChange={handleToggleAll}
                        />
                        <label htmlFor="select-all" className="text-sm font-medium">
                            {selectedAccounts.length === accountsWithBalance.length ? "Deselect All" : "Select All"}
                        </label>
                    </div>
                    <span className="text-sm text-muted-foreground">
                        {selectedAccounts.length} / {accountsWithBalance.length} selected
                    </span>
                </div>

                <ScrollArea className="h-[250px] -mx-6 px-6">
                    <div className="space-y-2">
                    {accountsWithBalance.map((account: any) => (
                        <div
                            key={account.id}
                            className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                            onClick={() => handleToggleAccount(account.id)}
                        >
                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    checked={selectedAccounts.includes(account.id)}
                                    onCheckedChange={() => handleToggleAccount(account.id)}
                                />
                                <div>
                                    <p className="font-medium">{account.name}</p>
                                    <p className="text-sm text-muted-foreground">{account.businesses.name}</p>
                                </div>
                            </div>
                            <span className="font-mono">{formatCurrency(account.balance_cents / 100)}</span>
                        </div>
                    ))}
                    </div>
                </ScrollArea>
                
                <div className="p-4 bg-muted/50 rounded-lg flex justify-between items-center">
                    <span className="font-medium">Total to Consolidate</span>
                    <span className="text-lg font-semibold">{formatCurrency(totalToConsolidate / 100)}</span>
                </div>
            </div>
        )
    }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Consolidate Funds</DialogTitle>
        </DialogHeader>
        {renderContent()}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading || selectedAccounts.length === 0}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Consolidate {formatCurrency(totalToConsolidate / 100)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
