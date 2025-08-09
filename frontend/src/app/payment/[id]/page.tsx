"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { loadStripe } from "@stripe/stripe-js"
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Alert, AlertDescription } from "../../../components/ui/alert"
import { Loader2, CreditCard, Shield, CheckCircle, AlertCircle } from "lucide-react"

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentIntent {
  id: string
  amount: number
  currency: string
  organization_id: string
  organization_name: string
  client_secret: string
  status: string
  created_at: string
}

function PaymentForm({ paymentIntent }: { paymentIntent: PaymentIntent }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setPaymentError(null)

    const cardElement = elements.getElement(CardElement)

    if (!cardElement) {
      setPaymentError("Card element not found")
      setIsProcessing(false)
      return
    }

    // Confirm the payment
    const { error, paymentIntent: confirmedPayment } = await stripe.confirmCardPayment(
      paymentIntent.client_secret,
      {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: "Blightstone Customer",
          },
        },
      }
    )

    setIsProcessing(false)

    if (error) {
      setPaymentError(error.message || "Payment failed")
    } else if (confirmedPayment?.status === "succeeded") {
      setPaymentSuccess(true)
      // Redirect to success page after 3 seconds
      setTimeout(() => {
        router.push(`/payment/success?payment_intent=${confirmedPayment.id}`)
      }, 3000)
    }
  }

  if (paymentSuccess) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-16 w-16 text-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-[#34D197] mb-2">Payment Successful!</h2>
        <p className="text-muted-foreground mb-4">
          Your wallet has been topped up with ${paymentIntent.amount.toFixed(2)}
        </p>
        <p className="text-sm text-muted-foreground">
          Redirecting to success page...
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="p-4 border rounded-lg bg-muted/50">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#424770",
                  "::placeholder": {
                    color: "#aab7c4",
                  },
                },
                invalid: {
                  color: "#9e2146",
                },
              },
            }}
          />
        </div>

        {paymentError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{paymentError}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>Your payment is secured by Stripe</span>
        </div>
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        {isProcessing ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing Payment...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Pay ${paymentIntent.amount.toFixed(2)}
          </div>
        )}
      </Button>
    </form>
  )
}

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPaymentIntent = async () => {
      try {
        const response = await fetch(`/api/payments/intent/${params?.id}`)
        
        if (!response.ok) {
          throw new Error("Payment not found or expired")
        }

        const data = await response.json()
        setPaymentIntent(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load payment")
      } finally {
        setLoading(false)
      }
    }

    if (params?.id) {
      fetchPaymentIntent()
    }
  }, [params?.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading payment...</p>
        </div>
      </div>
    )
  }

  if (error || !paymentIntent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-muted-foreground">Payment Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {error || "Payment not found"}
            </p>
            <Button onClick={() => router.push("/")} variant="outline">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if payment is already completed
  if (paymentIntent.status !== "requires_payment_method") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              This payment has already been {paymentIntent.status === "succeeded" ? "completed" : "processed"}.
            </p>
            <Button onClick={() => router.push("/")} variant="outline">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const fee = paymentIntent.amount * 0.03
  const netAmount = paymentIntent.amount - fee

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto pt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-center bg-primary text-transparent bg-clip-text">
              Complete Payment
            </CardTitle>
            <CardDescription className="text-center">
              Add funds to your Blightstone wallet
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Payment Details */}
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Organization:</span>
                <span className="font-medium">{paymentIntent.organization_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium">${paymentIntent.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Processing Fee (3%):</span>
                <span className="text-muted-foreground">-${fee.toFixed(2)}</span>
              </div>
              <hr className="border-border" />
              <div className="flex justify-between font-semibold">
              ./scripts/dev/start-dev-servers.sh                <span>You&apos;ll Receive:</span>
                <span className="text-[#34D197]">${netAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Stripe Payment Form */}
            <Elements stripe={stripePromise}>
              <PaymentForm paymentIntent={paymentIntent} />
            </Elements>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 