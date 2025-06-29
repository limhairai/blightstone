"use client"

import React, { useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { CreditCard, DollarSign, Wallet, Shield } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { CryptoPaymentForm } from "./crypto-payment-form"
import { useToast } from "../../hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Badge } from "../ui/badge"
import { TopUpForm } from "./top-up-form"
import { useAuth } from "../../contexts/AuthContext"
import { layout } from "../../lib/layout-utils"
import { contentTokens } from "../../lib/content-tokens"
import { validateForm, validators, showValidationErrors, showSuccessToast } from "../../lib/form-validation"
import { StripeFundWalletDialog } from "./stripe-fund-wallet-dialog"
import { SimpleStripeDialog } from "./simple-stripe-dialog"

const MINIMUM_WALLET_TOP_UP_AMOUNT = 500;

interface TopUpWalletProps {
  onTopUp: (amount: number, paymentMethod?: string, orgId?: string) => void
  orgId?: string
}

export function TopUpWallet({ onTopUp, orgId }: TopUpWalletProps) {
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("card")
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showStripeDialog, setShowStripeDialog] = useState(false)

  // Calculate processing fee (3% for credit cards)
  const getProcessingFee = (amount: number, method: string) => {
    if (method === "card") {
      return amount * 0.03 // 3% for credit cards
    }
    return 0 // No fee for crypto
  }

  // Calculate total amount customer pays
  const getTotalAmount = (amount: number, method: string) => {
    return amount + getProcessingFee(amount, method)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const numAmount = Number.parseFloat(amount)
    
    // Comprehensive form validation
    const validation = validateForm([
      () => validators.required(amount, 'Amount'),
      () => isNaN(numAmount) || numAmount <= 0 ? { field: 'amount', message: 'Please enter a valid positive amount' } : null,
      () => numAmount > 50000 ? { field: 'amount', message: 'Maximum top-up amount is $50,000' } : null,
      () => numAmount < MINIMUM_WALLET_TOP_UP_AMOUNT ? { field: 'amount', message: `Minimum top-up amount is $${MINIMUM_WALLET_TOP_UP_AMOUNT}` } : null,
    ])
    
    if (!validation.isValid) {
      showValidationErrors(validation.errors)
      return
    }
    
    // If credit card is selected, open Stripe dialog
    if (paymentMethod === "card") {
      setShowStripeDialog(true)
      return
    }
    
    // For other payment methods (crypto), use existing flow
    setLoading(true)
    try {
  
      onTopUp(numAmount, paymentMethod, orgId)
      showSuccessToast("Top-up Initiated!", `$${numAmount} has been added to your wallet.`)
      setAmount("")
    } catch (e: any) {
      showValidationErrors([{ field: 'general', message: e.message || 'Failed to process top-up. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleStripeSuccess = () => {
    setShowStripeDialog(false)
    setAmount("")
    // The StripeFundWalletDialog handles updating the wallet balance
  }

  const predefinedAmounts = ["500", "1000", "5000", "10000"]
  const numAmount = Number.parseFloat(amount) || 0
  const processingFee = getProcessingFee(numAmount, paymentMethod)
  const totalAmount = getTotalAmount(numAmount, paymentMethod)

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className={layout.stackLarge}>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Top Up Wallet</h3>
            <p className="text-sm text-muted-foreground">Add funds to your wallet to distribute to ad accounts</p>
          </div>

          <div className={layout.stackLarge}>
            <div>
              <Label htmlFor="amount" className="text-foreground">
                {contentTokens.labels.amount} <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="500.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8 bg-background border-border text-foreground"
                  min={MINIMUM_WALLET_TOP_UP_AMOUNT}
                  step="0.01"
                />
              </div>
              
              {/* Quick amount buttons */}
              <div className="grid grid-cols-4 gap-2 mt-2">
                {predefinedAmounts.map((presetAmount) => (
                  <Button
                    key={presetAmount}
                    variant="outline"
                    size="sm"
                    className="bg-background border-border text-foreground hover:bg-muted"
                    onClick={() => setAmount(presetAmount)}
                    disabled={loading}
                  >
                    ${parseInt(presetAmount.toString()) >= 1000 ? `${parseInt(presetAmount.toString()) / 1000}k` : presetAmount}
                  </Button>
                ))}
              </div>
            </div>

            <Tabs value={paymentMethod} onValueChange={setPaymentMethod} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted">
                <TabsTrigger value="card" className="data-[state=active]:bg-background">
                  Credit Card
                </TabsTrigger>
                <TabsTrigger value="crypto" className="data-[state=active]:bg-background">
                  Crypto
                </TabsTrigger>
              </TabsList>

              <TabsContent value="card" className={`mt-4 ${layout.stackLarge}`}>
                {/* Processing Fee Information */}
                {numAmount > 0 && (
                  <div className="p-4 bg-muted rounded-lg border border-border">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Wallet credit:</span>
                        <span className="text-foreground">${numAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Processing fee (3%):</span>
                        <span className="text-muted-foreground">+${processingFee.toFixed(2)}</span>
                      </div>
                      <hr className="border-border" />
                      <div className="flex justify-between font-semibold">
                        <span className="text-foreground">Total charge:</span>
                        <span className="text-foreground">${totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className={`${layout.stackLarge} p-4 border rounded-md border-border bg-muted`}>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-foreground">Secure Payment via Stripe</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Click "Process Payment" to complete your transaction securely through Stripe.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="crypto" className="mt-4">
                <CryptoPaymentForm amount={amount} orgId={orgId} />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <Button type="submit" className="w-full bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black" disabled={loading || !amount || Number.parseFloat(amount) <= 0}>
          {loading ? contentTokens.loading.processing : 
           paymentMethod === "card" ? `Pay $${totalAmount.toFixed(2)} via Credit Card` : "Process Payment"}
        </Button>
      </form>

      {/* Stripe Payment Dialog */}
      <SimpleStripeDialog
        open={showStripeDialog}
        onOpenChange={(open) => {
          setShowStripeDialog(open)
          if (!open) {
            setAmount("")
          }
        }}
        amount={numAmount}
        onSuccess={() => {
          setAmount("")
        }}
      />
    </>
  )
}
