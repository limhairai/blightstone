'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Loader2, CreditCard, Building2, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { useCurrentOrganization } from '@/lib/swr-config'
import { useOrganizationStore } from '@/lib/stores/organization-store'
import { useAuth } from '@/contexts/AuthContext'
import { useSWRConfig } from 'swr'
import { formatCurrency } from '@/utils/format'
import { refreshAfterBusinessManagerChange } from '@/lib/subscription-utils'
import { BankTransferDialog } from './bank-transfer-dialog'
import { BinancePayDialog } from './binance-pay-dialog'

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
  const [showBinancePayDialog, setShowBinancePayDialog] = useState(false)

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

    if (paymentMethod === 'crypto') {
      // Validate amount first
      const amountNum = parseFloat(amount)
      if (isNaN(amountNum) || amountNum <= 0) {
        toast.error('Please enter a valid amount')
        return
      }
      if (amountNum < 10) {
        toast.error('Minimum Binance Pay amount is $10')
        return
      }
      if (amountNum > 10000) {
        toast.error('Maximum Binance Pay amount is $10,000')
        return
      }
      
      // Open Binance Pay dialog with the amount
      setShowBinancePayDialog(true)
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
      // Create Stripe checkout session for credit card payments
      const response = await fetch('/api/payments/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountNum,
          organizationId: currentOrganizationId,
          returnUrl: `${window.location.origin}/dashboard/wallet`
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe checkout
      window.location.href = data.url
      
    } catch (error) {
      console.error('Error creating checkout session:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to process payment')
    } finally {
      setLoading(false)
    }
  }

  const handleBankTransferSuccess = () => {
    setShowBankTransferDialog(false)
    setAmount('')
    onSuccess?.()
    toast.success('Bank transfer request submitted successfully')
  }

  const handleBinancePaySuccess = () => {
    setShowBinancePayDialog(false)
    setAmount('')
    onSuccess?.()
    toast.success('Binance Pay payment completed successfully')
  }

  const getMinAmount = () => {
    switch (paymentMethod) {
      case 'bank_transfer':
        return 50
      case 'crypto':
        return 10
      default:
        return 10
    }
  }

  const getMaxAmount = () => {
    switch (paymentMethod) {
      case 'bank_transfer':
        return 50000
      case 'crypto':
        return 10000
      default:
        return undefined
    }
  }

  const getAmountDescription = () => {
    switch (paymentMethod) {
      case 'bank_transfer':
        return 'Minimum: $50.00 • Maximum: $50,000.00'
      case 'crypto':
        return 'Minimum: $10.00 • Maximum: $10,000.00'
      default:
        return 'Minimum amount: $10.00'
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
              min={getMinAmount()}
              max={getMaxAmount()}
              step="0.01"
              required
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              {getAmountDescription()}
            </p>
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {[100, 500, 1000].map((quickAmount) => (
              <Button
                key={quickAmount}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(quickAmount.toString())}
                disabled={loading}
                className="text-xs"
              >
                ${quickAmount}
              </Button>
            ))}
          </div>

          <div className="space-y-3">
            <Label>Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} disabled={loading}>
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
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="crypto" id="crypto" />
                <Label htmlFor="crypto" className="flex items-center gap-2 cursor-pointer">
                  <Wallet className="h-4 w-4" />
                  Crypto
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0" 
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {paymentMethod === 'bank_transfer' 
              ? 'Get Bank Transfer Details' 
              : paymentMethod === 'crypto'
                ? 'Pay with Crypto'
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

      {/* Binance Pay Dialog */}
      <BinancePayDialog
        isOpen={showBinancePayDialog}
        onClose={() => setShowBinancePayDialog(false)}
        amount={parseFloat(amount) || 0}
        onSuccess={handleBinancePaySuccess}
      />
    </Card>
  )
} 