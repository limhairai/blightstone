"use client"

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useStripeCheckout } from '@/hooks/useStripeCheckout';
import { useQuery } from '@tanstack/react-query';
import { Stripe } from 'stripe';

interface StripeCheckoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  amount: number
}

export function StripeCheckoutDialog({
  open,
  onOpenChange,
  amount,
}: StripeCheckoutDialogProps) {
  const { data: clientSecret, isLoading } = useQuery<string>({
    queryKey: ['stripe-client-secret', amount],
    queryFn: async () => {
      const response = await fetch('/api/stripe/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(amount * 100) }),
      })
      if (!response.ok) {
        throw new Error('Failed to create payment intent')
      }
      const { clientSecret } = await response.json()
      return clientSecret
    },
    enabled: open && amount > 0,
    staleTime: Infinity,
  })

  const { StripeCheckout, isStripeLoading } = useStripeCheckout({
    clientSecret,
    onSuccess: () => {
      onOpenChange(false)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {isLoading || isStripeLoading ? (
          <div className="flex justify-center items-center h-48">
            Loading...
          </div>
        ) : (
          clientSecret && <StripeCheckout />
        )}
      </DialogContent>
    </Dialog>
  )
} 