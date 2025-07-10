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
import { refreshAfterBusinessManagerChange } from '@/lib/subscription-utils'
import { BankTransferDialog } from './bank-transfer-dialog'

interface WalletFundingPanelProps {
  onSuccess?: () => void
}

export function WalletFundingPanel({ onSuccess }: WalletFundingPanelProps) {
  const { session } = useAuth()
  const { currentOrganizationId } = useOrganizationStore()
  const { mutate } = useSWRConfig()
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('credit_card')
  const [loading, setLoading] = useState(false)
  const [showBankTransferDialog, setShowBankTransferDialog] = useState(false)

  // Use optimized hook instead of direct SWR call
  const { data: orgData, isLoading: isOrgLoading } = useCurrentOrganization(currentOrganizationId);

  const organization = orgData?.organizations?.[0];
  const currentBalance = (organization?.balance_cents ?? 0) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (paymentMethod === 'bank_transfer') {
      // Validate amount first
      const amountNum = parseFloat(amount)
      if (isNaN(amountNum) || amountNum <= 0) {
        toast.error('Please enter a valid amount')
        return
      }
      if (amountNum < 50) {
        toast.error('Minimum bank transfer amount is $50')
        return
      }
      if (amountNum > 50000) {
        toast.error('Maximum bank transfer amount is $50,000')
        return
      }
      
      // Open bank transfer dialog with the amount
      setShowBankTransferDialog(true)
      return;
    }
    
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (amountNum < 10) {
      toast.error('Minimum funding amount is $10')
      return
    }

    setLoading(true)

    try {
      if (paymentMethod === 'credit_card') {
        // Handle Credit Card Checkout
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
          throw new Error('Failed to create payment session')
        }

        const { checkout_url } = await response.json()
        
        // Store payment amount for optimistic update after successful payment
        sessionStorage.setItem('pending_payment_amount', amountNum.toString())
        sessionStorage.setItem('pending_payment_timestamp', Date.now().toString())
        
        // Preemptively refresh cache since we know payment will succeed
        if (currentOrganizationId) {
          await refreshAfterBusinessManagerChange(currentOrganizationId)
        }
        
        window.location.href = checkout_url
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast.error('Failed to initiate payment. Please try again.')
      setLoading(false)
    }
  }

  const handleBankTransferSuccess = () => {
    setShowBankTransferDialog(false)
    setAmount('') // Reset form
    onSuccess?.()
    // Refresh organization data to show updated balance
    if (currentOrganizationId) {
      mutate(`/api/organizations/${currentOrganizationId}`)
    }
  }

  const isLoading = isOrgLoading || loading

  return (
    <Card className="flex-1 flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">Add Funds</CardTitle>
        <CardDescription>
          Current balance: {formatCurrency(currentBalance)}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USD)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="100.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={paymentMethod === 'bank_transfer' ? "50" : "10"}
              max={paymentMethod === 'bank_transfer' ? "50000" : undefined}
              step="0.01"
              required
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              {paymentMethod === 'bank_transfer' 
                ? 'Minimum: $50.00 • Maximum: $50,000.00' 
                : 'Minimum amount: $10.00'
              }
            </p>
          </div>

          {/* Quick Amount Buttons */}
          <div className="space-y-2">
            <Label>Quick Amounts</Label>
            <div className="grid grid-cols-4 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount('1000')}
                disabled={isLoading}
                className="border-border text-foreground hover:bg-accent"
              >
                $1000
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount('2000')}
                disabled={isLoading}
                className="border-border text-foreground hover:bg-accent"
              >
                $2000
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount('5000')}
                disabled={isLoading}
                className="border-border text-foreground hover:bg-accent"
              >
                $5000
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount('10000')}
                disabled={isLoading}
                className="border-border text-foreground hover:bg-accent"
              >
                $10000
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} disabled={isLoading}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="credit_card" id="credit_card" />
                <Label htmlFor="credit_card" className="flex items-center gap-2 cursor-pointer">
                  <CreditCard className="h-4 w-4" />
                  Credit Card
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                <Label htmlFor="bank_transfer" className="flex items-center gap-2 cursor-pointer">
                  <Building2 className="h-4 w-4" />
                  Bank Transfer
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0" 
            disabled={isLoading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {paymentMethod === 'bank_transfer' 
              ? 'Get Bank Transfer Details' 
              : `Add ${formatCurrency(parseFloat(amount) || 0)} to Wallet`
            }
          </Button>
        </form>
      </CardContent>
      
      {/* Bank Transfer Dialog */}
      <BankTransferDialog
        isOpen={showBankTransferDialog}
        onClose={() => setShowBankTransferDialog(false)}
        amount={parseFloat(amount) || 0}
        onSuccess={handleBankTransferSuccess}
      />
    </Card>
  )
} 