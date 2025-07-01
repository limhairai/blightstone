"use client"

import { useState } from "react"
import useSWR, { useSWRConfig } from 'swr'
import { useOrganizationStore } from '@/lib/stores/organization-store'
import { useCurrentOrganization } from '@/lib/swr-config'
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Building2, ArrowUpDown, Shuffle, CreditCard, Wallet } from 'lucide-react'
import { toast } from "sonner"
import { StripeCheckoutDialog } from "./stripe-checkout-dialog"
import { formatCurrency } from "../../utils/format"

export function WalletFundingPanel() {
  const { mutate } = useSWRConfig();
  const { currentOrganizationId } = useOrganizationStore();
  
  // Use the proper authenticated hook
  const { data, isLoading: isOrgLoading } = useCurrentOrganization(currentOrganizationId);
  
  const organization = data?.organizations?.[0];
  const totalBalance = (organization?.balance_cents ?? 0) / 100;
  
  const [mode, setMode] = useState<"add" | "withdraw">("add")
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [showStripeDialog, setShowStripeDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePresetAmount = (value: number) => setAmount(value.toString());

  const handleMaxAmount = () => {
    if (mode === "withdraw") setAmount(totalBalance.toString());
    else setAmount("10000"); // Max add amount
  }

  const handleMainAction = async () => {
    const numAmount = Number.parseFloat(amount);
    if (!amount || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (mode === 'withdraw' && numAmount > totalBalance) {
      toast.error("Amount exceeds available balance");
      return;
    }

    if (mode === "add" && paymentMethod === "card") {
      setShowStripeDialog(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/wallet/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numAmount,
          type: mode === 'add' ? 'topup' : 'withdrawal',
          description: `Wallet ${mode} via ${getPaymentMethodLabel()}`,
          organization_id: currentOrganizationId,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Something went wrong');
      
      toast.success(`Successfully ${mode === 'add' ? 'added' : 'withdrew'} ${formatCurrency(numAmount)}`);
      
      // Revalidate organization data to update balance everywhere
      mutate(`/api/organizations?id=${currentOrganizationId}`);
      // Potentially revalidate a transactions endpoint as well if we have one
      // mutate('/api/transactions');

      setAmount("");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(`Failed to ${mode} funds: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  const getPaymentMethodLabel = () => {
    switch (paymentMethod) {
      case "bank": return "Bank Transfer";
      case "card": return "Credit Card";
      case "crypto": return "Cryptocurrency";
      default: return "Credit Card";
    }
  }

  const PaymentIcon = paymentMethod === 'bank' ? Building2 : paymentMethod === 'crypto' ? Wallet : CreditCard;
  const isLoading = isOrgLoading || isSubmitting;

  return (
    <>
      <Card className="bg-card border-border flex-1 flex flex-col">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-foreground">Fund Wallet</CardTitle>
          <div className="text-sm text-muted-foreground">
            Available: {formatCurrency(totalBalance)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
          {/* Top Section */}
          <div className="space-y-4">
            {/* Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className={mode === "add" ? "bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] text-black font-medium border-0 flex-1" : "bg-transparent text-foreground border-border flex-1"}
                onClick={() => setMode("add")}
                disabled={isLoading}
              >
                <span className="mr-2">↗</span>
                Add Funds
              </Button>
              <Button
                variant="outline"
                className={mode === "withdraw" ? "bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] text-black font-medium border-0 flex-1" : "bg-transparent text-foreground border-border flex-1"}
                onClick={() => setMode("withdraw")}
                disabled={isLoading}
              >
                <span className="mr-2">↘</span>
                Withdraw
              </Button>
            </div>

            {/* Amount Section */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground">Amount</label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-xl font-semibold h-12 pl-8 bg-background border-border text-foreground"
                  disabled={isLoading}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-3 text-sm text-muted-foreground hover:text-foreground"
                  onClick={handleMaxAmount}
                  disabled={isLoading}
                >
                  Max
                </Button>
              </div>

              {/* Preset Amounts */}
              <div className="grid grid-cols-4 gap-2">
                {[100, 500, 1000, 5000].map((value) => (
                  <Button
                    key={value}
                    variant="outline"
                    size="sm"
                    className="bg-background border-border text-foreground hover:bg-muted"
                    onClick={() => handlePresetAmount(value)}
                    disabled={isLoading}
                  >
                    ${value}
                  </Button>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground">Payment method</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={isLoading}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <div className="flex items-center gap-2">
                    <PaymentIcon className="h-4 w-4" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Credit Card</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="crypto">Cryptocurrency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Bottom Section */}
          <div className="space-y-3">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Current Balance</span>
              <span>{formatCurrency(totalBalance)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium text-foreground">
              <span>{mode === 'add' ? 'You will add' : 'You will receive'}</span>
              <span>{formatCurrency(Number.parseFloat(amount) || 0)}</span>
            </div>

            {/* Main Action Button */}
            <Button 
              size="lg" 
              className="w-full font-bold text-base" 
              onClick={handleMainAction}
              disabled={isLoading}
            >
              {isSubmitting ? 'Processing...' : `${mode === 'add' ? 'Add' : 'Withdraw'} Funds`}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {showStripeDialog && (
        <StripeCheckoutDialog 
          open={showStripeDialog}
          onOpenChange={(open) => {
            setShowStripeDialog(open);
            if (!open) {
              setAmount("");
            }
          }}
          amount={Number.parseFloat(amount)}
          onSuccess={() => {
            mutate(`/api/organizations?id=${currentOrganizationId}`);
            setAmount("");
          }}
        />
      )}
    </>
  )
} 