"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { CreditCard, Building2, ArrowUpDown, Shuffle, Loader2, Shield, AlertCircle, ArrowLeft } from 'lucide-react'
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { useAuth } from "../../contexts/AuthContext"
import { toast } from "sonner"
import { Alert, AlertDescription } from "../ui/alert"

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface StripeFundWalletDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  amount: number // Amount user wants to add to wallet
  onSuccess?: () => void
}

function StripePaymentForm({ 
  amount, 
  totalCharge, 
  onSuccess, 
  onError,
  onBack 
}: {
  amount: number
  totalCharge: number
  onSuccess: () => void
  onError: (error: string) => void
  onBack: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const { user } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements || !user) {
      onError("Payment system not ready")
      return
    }

    setIsProcessing(true)
    setPaymentError(null)

    try {
      // Create payment intent with the total charge amount
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization_id: user.id,
          amount: totalCharge, // Charge the total amount (including fee)
          save_payment_method: false
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create payment intent')
      }

      const { client_secret } = await response.json()

      // Confirm payment
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error('Card element not found')
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'AdHub Customer',
            email: user.email,
          },
        },
      })

      if (error) {
        throw new Error(error.message || 'Payment failed')
      }

      if (paymentIntent?.status === 'succeeded') {
        onSuccess()
        toast.success(`Successfully added $${amount} to your wallet!`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed'
      setPaymentError(errorMessage)
      onError(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: 'transparent',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        '::placeholder': {
          color: '#9ca3af',
        },
      },
      invalid: {
        color: '#ef4444',
        iconColor: '#ef4444',
      },
    },
    hidePostalCode: true,
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Wallet Credit</span>
          <span className="text-lg font-bold text-blue-900 dark:text-blue-100">${amount.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-blue-700 dark:text-blue-300">
          <span>Processing fee (3%)</span>
          <span>+${(totalCharge - amount).toFixed(2)}</span>
        </div>
        <hr className="my-2 border-blue-200 dark:border-blue-700" />
        <div className="flex items-center justify-between">
          <span className="font-semibold text-blue-900 dark:text-blue-100">Total Charge</span>
          <span className="text-xl font-bold text-blue-900 dark:text-blue-100">${totalCharge.toFixed(2)}</span>
        </div>
      </div>

      {paymentError && (
        <Alert className="border-red-500 bg-red-50 dark:bg-red-950/20">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700 dark:text-red-400">
            {paymentError}
          </AlertDescription>
        </Alert>
      )}

      {/* Stripe Card Element */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Card Information
        </label>
        <div className="p-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {/* Stripe Branding & Security */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-green-500" />
          <span>Secured by Stripe</span>
        </div>
        <div className="flex items-center gap-1">
          <span>Powered by</span>
          <svg className="h-4 w-16" viewBox="0 0 60 25" fill="none">
            <path d="M59.5 12.5c0-6.904-5.596-12.5-12.5-12.5s-12.5 5.596-12.5 12.5 5.596 12.5 12.5 12.5 12.5-5.596 12.5-12.5z" fill="#635BFF"/>
            <path d="M47 8.5c-2.209 0-4 1.791-4 4s1.791 4 4 4 4-1.791 4-4-1.791-4-4-4zm0 6.5c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z" fill="white"/>
            <path d="M25.5 6.5h-3v12h3v-12zm-6 0h-3l-3 12h3l.6-2.4h3.8l.6 2.4h3l-3-12zm-1.5 7.2h-2.4l1.2-4.8 1.2 4.8zm-8.5-7.2h-3v12h3v-5.5l3 5.5h3.5l-3.5-6 3.5-6h-3.5l-3 5.5v-5.5z" fill="#635BFF"/>
          </svg>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1 h-12"
          onClick={onBack}
          disabled={isProcessing}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold h-12"
          disabled={!stripe || isProcessing}
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </div>
          ) : (
            `Pay $${totalCharge.toFixed(2)}`
          )}
        </Button>
      </div>
    </form>
  )
}

export function StripeFundWalletDialog({ 
  open, 
  onOpenChange, 
  amount,
  onSuccess
}: StripeFundWalletDialogProps) {
  // Calculate processing fee (3%)
  const processingFee = amount * 0.03
  const totalCharge = amount + processingFee

  const handleStripeSuccess = async () => {
    onOpenChange(false)
    onSuccess?.()
  }

  const handleStripeError = (error: string) => {
    toast.error(error)
  }

  const handleBack = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl p-0">
        <DialogHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
            Complete Payment
          </DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Add ${amount.toFixed(2)} to your AdHub wallet
          </p>
        </DialogHeader>

        <div className="px-6 py-6">
          <Elements stripe={stripePromise}>
            <StripePaymentForm
              amount={amount}
              totalCharge={totalCharge}
              onSuccess={handleStripeSuccess}
              onError={handleStripeError}
              onBack={handleBack}
            />
          </Elements>
        </div>
      </DialogContent>
    </Dialog>
  )
}
