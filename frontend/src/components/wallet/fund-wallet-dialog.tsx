"use client"

import { useState } from "react"
import useSWR, { useSWRConfig } from 'swr'
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Building2, CreditCard, Wallet, Loader2 } from 'lucide-react'
import { toast } from "sonner"
import { StripeCheckoutDialog } from "./stripe-checkout-dialog"
import { formatCurrency } from "../../utils/format"

interface FundWalletDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function FundWalletDialog({ open, onOpenChange }: FundWalletDialogProps) {
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [showStripeDialog, setShowStripeDialog] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const { currentOrganizationId } = useOrganizationStore();
  const { mutate } = useSWRConfig();

  const orgSWRKey = currentOrganizationId ? `/api/organizations?id=${currentOrganizationId}` : null;
  const { data: orgData, isLoading: isOrgLoading } = useSWR(orgSWRKey, fetcher);
  const walletBalance = orgData?.organizations?.[0]?.balance_cents / 100 || 0;

  const getProcessingFee = (amount: number) => paymentMethod === "card" ? amount * 0.03 : 0;
  const getTotalAmount = (amount: number) => amount + getProcessingFee(amount);

  const handleAddFunds = async () => {
    const numAmount = Number.parseFloat(amount);
    if (!amount || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (paymentMethod === "card") {
      setShowStripeDialog(true);
      return;
    }
    
    setIsProcessing(true);
    try {
      const res = await fetch('/api/wallet/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: currentOrganizationId,
          amount_cents: Math.round(numAmount * 100),
          type: 'topup',
          description: `Wallet top-up via ${paymentMethod}`
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add funds');
      }

      toast.success(`Successfully added ${formatCurrency(numAmount)} to wallet`);
      mutate(orgSWRKey);
      mutate(`/api/transactions?organization_id=${currentOrganizationId}`);
      setAmount("");
      onOpenChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast.error("Failed to add funds", { description: errorMessage });
    } finally {
        setIsProcessing(false);
    }
  }

  const getPaymentMethodLabel = () => {
    switch (paymentMethod) {
      case "bank": return "Bank Transfer"
      case "card": return "Credit Card"
      case "crypto": return "Cryptocurrency"
      default: return "Credit Card"
    }
  }

  const getPaymentMethodIcon = () => {
    switch (paymentMethod) {
      case "bank": return Building2;
      case "card": return CreditCard;
      case "crypto": return Wallet;
      default: return CreditCard;
    }
  }

  const PaymentIcon = getPaymentMethodIcon()
  const numAmount = Number.parseFloat(amount) || 0
  const processingFee = getProcessingFee(numAmount)
  const totalAmount = getTotalAmount(numAmount)

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground">Fund Wallet</DialogTitle>
            <div className="text-sm text-muted-foreground">
              Available: {isOrgLoading ? "..." : formatCurrency(walletBalance)}
            </div>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium">Amount</label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="500.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-2xl h-14 pl-8"
                  disabled={isProcessing}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[100, 500, 1000, 5000].map((value) => (
                  <Button key={value} variant="outline" onClick={() => setAmount(value.toString())} disabled={isProcessing}>
                    ${value}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Payment method</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={isProcessing}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <PaymentIcon className="h-4 w-4" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Credit Card</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {numAmount > 0 && processingFee > 0 && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-2">
                <div className="flex justify-between"><span>Amount</span> <span>{formatCurrency(numAmount)}</span></div>
                <div className="flex justify-between"><span>Fee</span> <span>{formatCurrency(processingFee)}</span></div>
                <div className="flex justify-between font-bold text-base border-t pt-2 mt-2 border-border"><span>Total</span> <span>{formatCurrency(totalAmount)}</span></div>
              </div>
            )}

            <Button className="w-full h-12 text-base" onClick={handleAddFunds} disabled={!amount || numAmount <= 0 || isProcessing}>
              {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : `Add ${formatCurrency(numAmount)}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <StripeCheckoutDialog
        open={showStripeDialog}
        onOpenChange={(open) => {
          setShowStripeDialog(open)
          if (!open) {
            setAmount("")
            onOpenChange(false)
          }
        }}
        amount={numAmount}
      />
    </>
  )
} 