"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Label } from "../ui/label"
import { Alert, AlertDescription } from "../ui/alert"
import { InfoIcon, AlertCircle, Wallet, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/config/financial"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { AdAccount } from "@/types/ad-account"
import useSWR from 'swr'
import { useSWRConfig } from "swr"

interface TopUpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: AdAccount | null
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function TopUpDialog({ open, onOpenChange, account }: TopUpDialogProps) {
  const { currentOrganizationId } = useOrganizationStore();
  const { mutate } = useSWRConfig()

  const { data: orgData, error: orgError, isLoading: isOrgLoading } = useSWR(
    currentOrganizationId ? `/api/organizations?id=${currentOrganizationId}` : null,
    fetcher
  );

  const organization = orgData?.organizations?.[0];
  const walletBalance = organization?.wallets?.[0]?.balance_cents / 100 ?? 0;
  const commissionRate = organization?.plans?.ad_spend_fee_percentage ?? 0.05;
  const planName = organization?.plans?.name ?? 'Default Plan';

  const [amount, setAmount] = useState<number>(100)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount(100)
      setError(null)
      setIsSubmitting(false)
    }
  }, [open])

  const handleAmountChange = (value: number) => {
    setAmount(value)
    if (value * 100 > walletBalance * 100) {
      setError("Amount exceeds available wallet balance")
    } else {
      setError(null)
    }
  }

  const commissionAmount = amount * commissionRate
  const finalAmount = amount - commissionAmount

  const handleSubmit = async () => {
    if (!account || !currentOrganizationId) return;

    if (amount * 100 > walletBalance * 100) {
      setError("Amount exceeds available wallet balance");
      return;
    }
    if (amount <= 0) {
      setError("Please enter a valid positive amount");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/ad-accounts/top-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: currentOrganizationId,
          accountId: account.id,
          amount: amount,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to top up account.');
      }
      
      // Revalidate data to update UI
      mutate(`/api/organizations?id=${currentOrganizationId}`);
      mutate(`/api/ad-accounts?organization_id=${currentOrganizationId}`);

      onOpenChange(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const quickAmounts = [100, 500, 1000, 5000]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0f0a14] border-[#2C2C2E] sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-[#b19cd9] to-[#f8c4b4] text-transparent bg-clip-text">
            Top Up Ad Account
          </DialogTitle>
        </DialogHeader>

        {isOrgLoading && <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />}

        {!isOrgLoading && account && (
          <>
            <div className="space-y-4 my-2">
              <div className="space-y-1">
                <Label className="text-[#888888]">Account</Label>
                <div className="font-medium">{account.name}</div>
                <div className="text-xs text-[#6C6C6C]">ID: {account.account_id}</div>
              </div>

              <div className="flex justify-between items-center p-3 rounded-md bg-[#0a0812] border border-[#2C2C2E]">
                <div>
                  <Label className="text-[#888888]">Available Balance</Label>
                  <div className="text-lg font-semibold">{formatCurrency(walletBalance)}</div>
                </div>
                <Wallet className="h-5 w-5 text-[#888888]" />
              </div>

              <div>
                <Label className="text-foreground">Quick amounts</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                    {quickAmounts.map((quickAmount) => (
                    <Button
                        key={quickAmount}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAmountChange(quickAmount)}
                        className="border-border text-foreground hover:bg-accent"
                        disabled={isSubmitting}
                    >
                        ${quickAmount}
                    </Button>
                  ))}
                  </div>
              </div>

              <div>
                <Label htmlFor="amount" className="text-foreground">
                  Amount <span className="text-red-500">*</span>
                </Label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="bg-background border-border text-foreground mt-2"
                    disabled={isSubmitting}
                  />
              </div>

              {error && (
                <Alert variant="destructive" className="bg-red-900/20 border-red-900 text-red-300">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3 rounded-md bg-[#0a0812] p-3 border border-[#2C2C2E]">
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-[#888888]">
                    <span>Commission ({(commissionRate * 100).toFixed(1)}%)</span>
                    <InfoIcon className="h-3.5 w-3.5 ml-1" />
                  </div>
                  <span className="text-[#888888]">-{formatCurrency(commissionAmount)}</span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-[#2C2C2E]">
                  <span className="font-medium">Final Amount</span>
                  <span className="text-lg font-semibold">{formatCurrency(finalAmount)}</span>
                </div>

                <div className="text-xs flex items-center text-[#888888]">
                  <InfoIcon className="h-3 w-3 mr-1" />
                  <span>Commission based on your {planName}</span>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                className="border-[#2C2C2E]"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!amount || isSubmitting || amount > walletBalance || isOrgLoading}
                onClick={handleSubmit}
                className="w-full bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </div>
                ) : (
                  "Top Up Account"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
