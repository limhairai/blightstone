"use client"

import { useState, useEffect } from "react"
import useSWR, { useSWRConfig } from 'swr'
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { ScrollArea } from "../ui/scroll-area"
import { formatCurrency } from "../../utils/format"
import { Info, DollarSign, Loader2 } from 'lucide-react'
import { toast } from "sonner"

interface DistributeFundsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface AdAccountDistribution {
  id: string
  name: string
  businessName: string
  currentBalance: number
  amount: number
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function DistributeFundsDialog({ open, onOpenChange }: DistributeFundsDialogProps) {
  const [distributions, setDistributions] = useState<{[key: string]: number}>({});
  const [isLoading, setIsLoading] = useState(false);
  const { currentOrganizationId } = useOrganizationStore();
  const { mutate } = useSWRConfig();

  const orgSWRKey = currentOrganizationId ? `/api/organizations?id=${currentOrganizationId}` : null;
  const { data: orgData, isLoading: isOrgLoading } = useSWR(orgSWRKey, fetcher);
  
  const accountsSWRKey = currentOrganizationId ? `/api/ad-accounts?organization_id=${currentOrganizationId}` : null;
  const { data: accountsData, isLoading: areAccountsLoading } = useSWR(accountsSWRKey, fetcher);

  const walletBalance = orgData?.organizations?.[0]?.balance_cents / 100 || 0;
  const adAccounts = accountsData?.accounts || [];

  const totalToDistribute = Object.values(distributions).reduce((sum, amount) => sum + amount, 0);
  const remainingAmount = walletBalance - totalToDistribute;

  const handleAmountChange = (accountId: string, amount: string) => {
    const numberAmount = Number(amount);
    if (isNaN(numberAmount) || numberAmount < 0) return;
    setDistributions(prev => ({ ...prev, [accountId]: numberAmount }));
  }

  const handleSubmit = async () => {
    if (totalToDistribute <= 0) {
      toast.error("Distribution amount must be greater than zero.");
      return;
    }
    if (totalToDistribute > walletBalance) {
      toast.error("Distribution amount cannot exceed wallet balance.");
      return;
    }

    setIsLoading(true);
    try {
        const distributionPayload = Object.entries(distributions)
            .filter(([, amount]) => amount > 0)
            .map(([accountId, amount]) => ({
                ad_account_id: accountId,
                amount_cents: Math.round(amount * 100)
            }));
        
      const res = await fetch('/api/wallet/distribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            organization_id: currentOrganizationId,
            distributions: distributionPayload
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to distribute funds.');
      }

      toast.success("Funds distributed successfully!");
      // Revalidate all related data
      mutate(orgSWRKey);
      mutate(accountsSWRKey);
      mutate(`/api/transactions?organization_id=${currentOrganizationId}`); // Assuming a transactions endpoint exists
      onOpenChange(false);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error("Distribution Failed", { description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }
  
  const renderLoading = () => (
    <div className="p-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">Loading accounts...</p>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Distribute Funds</DialogTitle>
        </DialogHeader>
        
        {isOrgLoading || areAccountsLoading ? renderLoading() : (
            <div className="space-y-6">
                <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">Available to Distribute</span>
                        <span className="text-lg font-semibold">{formatCurrency(walletBalance)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                        <span className="text-sm font-medium text-muted-foreground">Remaining</span>
                        <span className="text-lg font-semibold">{formatCurrency(remainingAmount)}</span>
                    </div>
                </div>

                <ScrollArea className="h-[300px] -mx-6 px-6">
                    <div className="space-y-4">
                    {adAccounts.map((account: any) => (
                        <div key={account.id} className="flex items-center gap-4 p-2 rounded-md hover:bg-muted/50">
                            <div className="flex-1">
                                <p className="font-medium">{account.name}</p>
                                <p className="text-sm text-muted-foreground">{account.businesses.name}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Current: {formatCurrency(account.balance_cents / 100)}</span>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        className="w-32 pl-8"
                                        value={distributions[account.id] || ''}
                                        onChange={(e) => handleAmountChange(account.id, e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isLoading || totalToDistribute <= 0}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Distribute {formatCurrency(totalToDistribute)}
                    </Button>
                </DialogFooter>
            </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
