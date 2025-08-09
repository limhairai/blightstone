"use client"

import { useState } from "react"
import useSWR, { useSWRConfig } from 'swr'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Separator } from "../ui/separator"
// Removed old useToast - using toast from sonner instead
import { formatCurrency } from "../../utils/format"
import { ArrowUpRight, DollarSign, Check, Loader2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { useAuth } from '@/contexts/AuthContext'

interface AppAccount {
  id: string
  name: string
  balance: number
}

interface WithdrawBalanceDialogProps {
  account: AppAccount | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function WithdrawBalanceDialog({
  account,
  open,
  onOpenChange,
}: WithdrawBalanceDialogProps) {
  const { currentOrganizationId } = useOrganizationStore();
  const { mutate } = useSWRConfig();
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { session } = useAuth()

  const { data: orgData, isLoading: isOrgLoading } = useSWR(
    currentOrganizationId ? `/api/organizations?id=${currentOrganizationId}` : null,
    fetcher
  );
  const mainBalance = orgData?.organizations?.[0]?.balance ?? 0;

  if (!account) return null

  const withdrawAmount = Number.parseFloat(amount) || 0
  const newAccountBalance = account.balance - withdrawAmount
  const newMainBalance = mainBalance + withdrawAmount

  const handleWithdraw = async (valueToWithdraw: number) => {
    if (valueToWithdraw <= 0) {
      toast.error("Please enter a valid amount greater than $0", {
        description: "Invalid Amount"
      })
      return
    }

    if (valueToWithdraw > account.balance) {
      toast.error("Amount exceeds the account balance", {
        description: "Insufficient Funds"
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/wallet/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_source: `ad_account:${account.id}`,
          to_destination: `organization:${currentOrganizationId}`,
          amount_cents: Math.round(valueToWithdraw * 100)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Transfer failed');
      }

      mutate(`/api/organizations?id=${currentOrganizationId}`);
      mutate(['/api/ad-accounts', session?.access_token]);
      
      setShowSuccess(true)
      toast.success(`${formatCurrency(valueToWithdraw)} has been withdrawn from ${account.name}`, {
        description: "Withdrawal Successful!"
      })

      setTimeout(() => {
        setAmount("")
        setShowSuccess(false)
        onOpenChange(false)
      }, 2000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(errorMessage, {
        description: "Withdrawal Failed"
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Withdrawal Successful!</h3>
            <p className="text-muted-foreground">
              ${formatCurrency(withdrawAmount || account.balance)} has been withdrawn from {account.name}
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
            <ArrowUpRight className="h-5 w-5 text-blue-500" />
            Withdraw Balance
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
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Account Balance</label>
              <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <DollarSign className="h-4 w-4 text-muted-foreground" />${formatCurrency(account.balance)}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Main Balance</label>
              <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                {isOrgLoading ? "..." : formatCurrency(mainBalance)}
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-foreground">
              Withdrawal Amount
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
                max={account.balance}
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAmount((account.balance * 0.25).toFixed(2))}
                className="border-border text-foreground hover:bg-accent"
                disabled={isLoading}
              >
                25%
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAmount((account.balance * 0.5).toFixed(2))}
                className="border-border text-foreground hover:bg-accent"
                disabled={isLoading}
              >
                50%
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAmount((account.balance * 0.75).toFixed(2))}
                className="border-border text-foreground hover:bg-accent"
                disabled={isLoading}
              >
                75%
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAmount(account.balance.toFixed(2))}
                className="border-border text-foreground hover:bg-accent"
                disabled={isLoading}
              >
                All
              </Button>
            </div>
          </div>

          {/* Preview */}
          {withdrawAmount > 0 && (
            <div className="p-3 bg-muted/50 rounded-lg border border-border space-y-2">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Transaction Preview</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Withdrawal Amount:</span>
                  <span className="font-medium text-foreground">${formatCurrency(withdrawAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New Account Balance:</span>
                  <span className="font-medium text-foreground">${formatCurrency(newAccountBalance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New Main Balance:</span>
                  <span className="font-medium text-foreground">${formatCurrency(newMainBalance)}</span>
                </div>
              </div>
            </div>
          )}
          
          <Separator />

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleWithdraw(withdrawAmount)}
              disabled={isLoading || withdrawAmount <= 0 || withdrawAmount > account.balance}
              className="bg-gradient-to-r from-primary to-primary hover:opacity-90 text-white"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowUpRight className="mr-2 h-4 w-4" />
              )}
              Withdraw {formatCurrency(withdrawAmount)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
