'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Loader2, CreditCard, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { useCurrentOrganization } from '@/lib/swr-config'
import { useOrganizationStore } from '@/lib/stores/organization-store'
import { useAuth } from '@/contexts/AuthContext'
import { useSWRConfig } from 'swr'
import { formatCurrency } from '@/utils/format'

interface WalletFundingPanelProps {
  onSuccess?: () => void
}

export function WalletFundingPanel({ onSuccess }: WalletFundingPanelProps) {
  const { session } = useAuth()
  const { mutate } = useSWRConfig()
  const { currentOrganizationId } = useOrganizationStore()
  const { data, isLoading: isOrgLoading } = useCurrentOrganization(currentOrganizationId)
  
  const organization = data?.organizations?.[0]
  const totalBalance = (organization?.balance_cents ?? 0) / 100

  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('stripe')
  const [loading, setLoading] = useState(false)

  const handlePresetAmount = (value: number) => setAmount(value.toString())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const amountNum = parseFloat(amount)
    if (!amountNum || amountNum < 10) {
      toast.error('Minimum amount is $10')
      return
    }
    
    if (amountNum > 10000) {
      toast.error('Maximum amount is $10,000')
      return
    }

    setLoading(true)

    try {
      if (paymentMethod === 'stripe') {
        // Handle Stripe Checkout
        const response = await fetch('/api/payments/create-checkout-session', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({ 
            amount: amountNum,
            wallet_credit: amountNum,
            success_url: `${window.location.origin}/dashboard/wallet?payment=success`,
            cancel_url: `${window.location.origin}/dashboard/wallet?payment=cancelled`
          })
        })

        if (!response.ok) {
          throw new Error('Failed to create Stripe session')
        }

        const { checkout_url } = await response.json()
        window.location.href = checkout_url
      } else {
        // Handle Airwallex Hosted Payment Page
        const response = await fetch('/api/payments/airwallex', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            amount: amountNum,
            description: `Wallet top-up - $${amountNum}`
          })
        })

        if (!response.ok) {
          throw new Error('Failed to create Airwallex payment')
        }

        const { hosted_payment_url } = await response.json()
        
        // Redirect to Airwallex hosted payment page
        window.location.href = hosted_payment_url
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast.error('Failed to initiate payment. Please try again.')
      setLoading(false)
    }
  }

  const isLoading = isOrgLoading || loading

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Funds</CardTitle>
        <CardDescription>
          Top up your wallet balance to fund your advertising campaigns
        </CardDescription>
        <div className="text-sm text-muted-foreground">
          Current Balance: {formatCurrency(totalBalance)}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USD)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="100.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="10"
              max="10000"
              step="0.01"
              required
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500">
              Minimum: $10 • Maximum: $10,000
            </p>
          </div>

          {/* Preset Amounts */}
          <div className="grid grid-cols-4 gap-2">
            {[100, 500, 1000, 5000].map((value) => (
              <Button
                key={value}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePresetAmount(value)}
                disabled={isLoading}
              >
                ${value}
              </Button>
            ))}
          </div>

          <div className="space-y-3">
            <Label>Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} disabled={isLoading}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="stripe" id="stripe" />
                <Label htmlFor="stripe" className="flex items-center space-x-2 cursor-pointer">
                  <CreditCard className="h-4 w-4" />
                  <span>Credit Card</span>
                  <span className="text-xs text-gray-500">(Instant, 2.9% + $0.30)</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="airwallex" id="airwallex" />
                <Label htmlFor="airwallex" className="flex items-center space-x-2 cursor-pointer">
                  <Building2 className="h-4 w-4" />
                  <span>Bank Transfer</span>
                  <span className="text-xs text-gray-500">(1-3 days, 0.6-2.5%)</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Button type="submit" className="w-full bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black border-0" disabled={isLoading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Add $${amount || '0'} to Wallet`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 