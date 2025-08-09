"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { CheckCircle, Wallet, ArrowRight, Home } from "lucide-react"
import Link from "next/link"

interface PaymentDetails {
  id: string
  amount: number
  organization_name: string
  net_amount: number
  created_at: string
}

// Force dynamic rendering for payment page
export const dynamic = 'force-dynamic'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const paymentIntentId = searchParams?.get('payment_intent')
    
    if (paymentIntentId) {
      // Fetch payment details
      const fetchPaymentDetails = async () => {
        try {
          const response = await fetch(`/api/payments/success/${paymentIntentId}`)
          if (response.ok) {
            const data = await response.json()
            setPaymentDetails(data)
            
            // Invalidate caches after successful payment
            const { CacheInvalidationScenarios } = await import('@/lib/cache-invalidation')
            await CacheInvalidationScenarios.paymentSuccess()
          }
        } catch (error) {
          console.error('Error fetching payment details:', error)
        } finally {
          setLoading(false)
        }
      }
      
      fetchPaymentDetails()
    } else {
      setLoading(false)
    }
  }, [searchParams])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading payment details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto pt-16">
        <Card>
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4">
              <CheckCircle className="h-16 w-16 text-foreground" />
            </div>
            <CardTitle className="text-2xl text-[#34D197]">
              Payment Successful!
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {paymentDetails ? (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-muted-foreground mb-2">
                    Your wallet has been topped up
                  </p>
                  <p className="text-3xl font-bold text-[#34D197]">
                    ${paymentDetails.net_amount.toFixed(2)}
                  </p>
                </div>

                <div className="space-y-3 p-4 bg-muted rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Organization:</span>
                    <span className="font-medium">{paymentDetails.organization_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment ID:</span>
                    <span className="font-mono text-sm">{paymentDetails.id.slice(-8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span>{new Date(paymentDetails.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-secondary p-4 rounded-lg border border-border dark:border-border">
                  <div className="flex items-start gap-3">
                    <Wallet className="h-5 w-5 text-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground dark:text-foreground">
                        Funds Available Now
                      </p>
                      <p className="text-xs text-foreground dark:text-foreground mt-1">
                        Your wallet balance has been updated and is ready to use for ad account top-ups.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  Your payment has been processed successfully.
                </p>
                <p className="text-sm text-muted-foreground">
                  Check your Telegram bot for confirmation details.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Button 
                onClick={() => router.push('/dashboard')}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => router.push('/')}
                className="w-full"
              >
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                You should receive a confirmation message in your Telegram bot within a few minutes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 