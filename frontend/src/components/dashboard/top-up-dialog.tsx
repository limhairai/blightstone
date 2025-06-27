"use client"

import { useState } from "react"
import useSWR, { useSWRConfig } from 'swr'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Separator } from "../ui/separator"
import { formatCurrency } from "@/lib/utils"
import { Wallet, DollarSign, ArrowRight, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useOrganizationStore } from "@/lib/stores/organization-store"

type AppAccount = {
  id: string;
  name: string;
  balance_cents: number;
}

interface TopUpDialogProps {
  account: AppAccount | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function TopUpDialog({ account, open, onOpenChange }: TopUpDialogProps) {
  const { currentOrganizationId } = useOrganizationStore();
  const { mutate } = useSWRConfig();
  const [amount, setAmount] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const { data: orgData, isLoading: isOrgLoading } = useSWR(
    currentOrganizationId ? `/api/organizations?id=${currentOrganizationId}` : null,
    fetcher
  );
  const mainBalance = orgData?.organizations?.[0]?.balance_cents / 100 ?? 0;

  if (!account) return null

  const isLoading = isProcessing || isOrgLoading;
  const topUpAmount = Number.parseFloat(amount) || 0
  const currentAccountBalance = account.balance_cents / 100;
  const newBalance = currentAccountBalance + topUpAmount
  const remainingMainBalance = mainBalance - topUpAmount

  const handleTopUp = async () => {
    if (topUpAmount <= 0) {
      toast.error("Please enter a valid amount greater than $0")
      return
    }

    if (topUpAmount > mainBalance) {
      toast.error("Amount exceeds your main wallet balance")
      return
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/wallet/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_source: `organization:${currentOrganizationId}`,
          to_destination: `ad_account:${account.id}`,
          amount_cents: Math.round(topUpAmount * 100)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Transfer failed');
      }

      mutate(`/api/organizations?id=${currentOrganizationId}`);
      mutate(`/api/ad-accounts?organization_id=${currentOrganizationId}`);

      toast.success("Top up successful!", {
        description: `${formatCurrency(topUpAmount)} has been added to ${account.name}`
      })
      setShowSuccess(true)
      
      setTimeout(() => {
        setAmount("")
        setShowSuccess(false)
        onOpenChange(false)
      }, 2000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast.error("Failed to process top up", { description: errorMessage });
    } finally {
      setIsProcessing(false);
    }
  }

  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Top Up Successful!</h3>
            <p className="text-muted-foreground">
              {formatCurrency(topUpAmount)} has been added to {account.name}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Wallet className="h-5 w-5 text-[#c4b5fd]" />
            Top Up Account
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Account Info */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">Account</label>
            <div className="p-3 bg-muted rounded-lg border border-border">
              <div className="font-medium text-foreground">{account.name}</div>
              <div className="text-xs text-muted-foreground font-mono">ID: {account.id}</div>
            </div>
          </div>

          {/* Current Balances */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Main Balance</label>
              <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                {isOrgLoading ? '...' : formatCurrency(mainBalance)}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Account Balance</label>
              <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <DollarSign className="h-4 w-4 text-muted-foreground" />{formatCurrency(currentAccountBalance)}
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-foreground">
              Top Up Amount
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="pl-10 bg-background border-border text-foreground"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">Quick Amounts</label>
            <div className="grid grid-cols-4 gap-2">
              {[100, 500, 1000, 2500].map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(quickAmount.toString())}
                  className="border-border text-foreground hover:bg-accent"
                  disabled={quickAmount > mainBalance || isLoading}
                >
                  ${quickAmount}
                </Button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {topUpAmount > 0 && (
            <>
              <Separator className="bg-border" />
              <div className="space-y-3 p-3 bg-muted/50 rounded-lg border border-border">
                <h4 className="text-sm font-medium text-foreground">Transaction Preview</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount to transfer:</span>
                    <span className="font-medium text-foreground">{formatCurrency(topUpAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">New account balance:</span>
                    <span className="font-medium text-foreground">{formatCurrency(newBalance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Remaining main balance:</span>
                    <span className="font-medium text-foreground">{formatCurrency(remainingMainBalance)}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="border-border text-foreground hover:bg-accent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleTopUp}
              disabled={isLoading || topUpAmount <= 0 || topUpAmount > mainBalance}
              className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Top Up {formatCurrency(topUpAmount)}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
