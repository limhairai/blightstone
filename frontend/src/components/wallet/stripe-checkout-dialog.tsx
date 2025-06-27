"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { useAuth } from "../../contexts/AuthContext"
import { toast } from "sonner"
import { Alert, AlertDescription } from "../ui/alert"
import { Loader2, CreditCard, ArrowLeft, ExternalLink } from 'lucide-react'

interface StripeCheckoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  amount: number // Amount user wants to add to wallet
  onSuccess?: () => void
}

export function StripeCheckoutDialog({ 
  open, 
  onOpenChange, 
  amount,
  onSuccess
}: StripeCheckoutDialogProps) {
  const { user, session } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate processing fee (3%)
  const processingFee = amount * 0.03
  const totalCharge = amount + processingFee

  const handleStripeCheckout = async () => {
    if (!user) {
      setError("Please log in to continue")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      if (!session) {
        throw new Error("You must be logged in to make a payment.")
      }
      // Create Stripe Checkout session
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          amount: totalCharge, // Total amount including fee
          wallet_credit: amount, // Actual wallet credit amount
          customer_email: user.email,
          organization_id: user.id,
          success_url: `${window.location.origin}/dashboard/wallet?payment=success`,
          cancel_url: `${window.location.origin}/dashboard/wallet?payment=cancelled`,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error creating checkout session:", errorText);
        throw new Error(errorText || 'Failed to create checkout session');
      }

      const { checkout_url } = await response.json()

      // Redirect to Stripe Checkout
      window.location.href = checkout_url

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start checkout'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] bg-background border-border shadow-xl p-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle className="text-xl font-semibold text-foreground">
            Complete Payment
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Add ${amount.toFixed(2)} to your AdHub wallet
          </p>
        </DialogHeader>

        <div className="px-6 py-6 space-y-6">
          {/* Payment Summary */}
          <div className="bg-gradient-to-r from-background to-muted/50 p-4 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Wallet Credit</span>
              <span className="text-lg font-bold text-foreground">${amount.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Processing fee (3%)</span>
              <span>+${processingFee.toFixed(2)}</span>
            </div>
            <hr className="my-2 border-border" />
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Total Charge</span>
              <span className="text-xl font-bold text-foreground">${totalCharge.toFixed(2)}</span>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
              <AlertDescription className="text-red-400 break-words">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Stripe Checkout Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border">
              <CreditCard className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <h3 className="font-medium text-foreground">Secure Stripe Checkout</h3>
                <p className="text-sm text-muted-foreground">
                  You'll be redirected to Stripe's secure payment page
                </p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Your payment information is processed securely by Stripe</p>
              <p>• We never see or store your card details</p>
              <p>• You can pay with any major credit or debit card</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-12 bg-muted hover:bg-muted/80 border-border"
              onClick={handleBack}
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleStripeCheckout}
              className="flex-1 bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white font-semibold h-12"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Pay ${totalCharge.toFixed(2)}
                </div>
              )}
            </Button>
          </div>

          {/* Stripe Branding */}
          <div className="flex items-center justify-center text-xs text-muted-foreground">
            <span>Powered by</span>
            <svg className="h-3 w-12 ml-1" viewBox="0 0 60 25" fill="none">
              <path d="M59.5 12.5c0-6.904-5.596-12.5-12.5-12.5s-12.5 5.596-12.5 12.5 5.596 12.5 12.5 12.5 12.5-5.596 12.5-12.5z" fill="#8B5CF6"/>
              <path d="M47 8.5c-2.209 0-4 1.791-4 4s1.791 4 4 4 4-1.791 4-4-1.791-4-4-4zm0 6.5c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z" fill="white"/>
              <path d="M25.5 6.5h-3v12h3v-12zm-6 0h-3l-3 12h3l.6-2.4h3.8l.6 2.4h3l-3-12zm-1.5 7.2h-2.4l1.2-4.8 1.2 4.8zm-8.5-7.2h-3v12h3v-5.5l3 5.5h3.5l-3.5-6 3.5-6h-3.5l-3 5.5v-5.5z" fill="#8B5CF6"/>
            </svg>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
