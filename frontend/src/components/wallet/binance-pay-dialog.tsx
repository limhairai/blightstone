"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, ExternalLink, Copy, CheckCircle, XCircle, Clock, Wallet, QrCode } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganizationStore } from '@/lib/stores/organization-store'
import { formatCurrency } from '@/utils/format'

interface BinancePayDialogProps {
  isOpen: boolean
  onClose: () => void
  amount: number
  onSuccess?: () => void
}

interface BinancePayOrder {
  orderId: string
  paymentUrl: string
  qrCode: string
  status: 'pending' | 'completed' | 'failed' | 'expired'
  expiresAt: string
  amount: number
  currency: string
}

export function BinancePayDialog({ isOpen, onClose, amount, onSuccess }: BinancePayDialogProps) {
  const { session } = useAuth()
  const { currentOrganizationId } = useOrganizationStore()
  const [isCreating, setIsCreating] = useState(false)
  const [order, setOrder] = useState<BinancePayOrder | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [isPolling, setIsPolling] = useState(false)

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setOrder(null)
      setTimeLeft(0)
      setIsPolling(false)
    }
  }, [isOpen])

  // Countdown timer
  useEffect(() => {
    if (order && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setOrder(prev => prev ? { ...prev, status: 'expired' } : null)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [order, timeLeft])

  // Poll for payment status
  useEffect(() => {
    if (order && order.status === 'pending' && isPolling) {
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/payments/binance-pay/status/${order.orderId}`, {
            headers: {
              'Authorization': `Bearer ${session?.access_token}`
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.status !== 'pending') {
              setOrder(prev => prev ? { ...prev, status: data.status } : null)
              setIsPolling(false)
              
              if (data.status === 'completed') {
                toast.success('Payment completed successfully!')
                onSuccess?.()
                setTimeout(() => onClose(), 2000)
              } else if (data.status === 'failed') {
                toast.error('Payment failed. Please try again.')
              }
            }
          }
        } catch (error) {
          console.error('Error polling payment status:', error)
        }
      }, 3000) // Poll every 3 seconds

      return () => clearInterval(pollInterval)
    }
  }, [order, isPolling, session?.access_token, onSuccess, onClose])

  const createBinancePayOrder = async () => {
    if (!currentOrganizationId) {
      toast.error('Organization not found')
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch('/api/payments/binance-pay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          amount,
          organizationId: currentOrganizationId,
          currency: 'USD'
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create Binance Pay order')
      }

      setOrder(data.order)
      setTimeLeft(15 * 60) // 15 minutes
      setIsPolling(true)
      
    } catch (error) {
      console.error('Error creating Binance Pay order:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create payment order')
    } finally {
      setIsCreating(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'failed':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'expired':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'failed':
        return <XCircle className="h-4 w-4" />
      case 'expired':
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Binance Pay
          </DialogTitle>
          <DialogDescription>
            Pay with cryptocurrency using Binance Pay
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount Display */}
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold">${formatCurrency(amount)}</div>
                <div className="text-sm text-muted-foreground">Amount to add to wallet</div>
              </div>
            </CardContent>
          </Card>

          {!order ? (
            /* Create Order */
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Click below to create a Binance Pay payment order. You'll be able to pay with any cryptocurrency supported by Binance Pay.
              </div>
              
              <Button
                onClick={createBinancePayOrder}
                disabled={isCreating}
                className="w-full bg-gradient-to-r from-[#f0b90b] to-[#fcd535] hover:opacity-90 text-black border-0"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Payment Order...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    Create Binance Pay Order
                  </>
                )}
              </Button>
            </div>
          ) : (
            /* Show Order Details */
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <Badge className={getStatusColor(order.status)}>
                  {getStatusIcon(order.status)}
                  <span className="ml-1 capitalize">{order.status}</span>
                </Badge>
                
                {order.status === 'pending' && timeLeft > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Expires in {formatTime(timeLeft)}
                  </div>
                )}
              </div>

              {order.status === 'pending' && (
                <>
                  {/* QR Code */}
                  {order.qrCode && (
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="flex justify-center mb-2">
                          <QrCode className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          Scan QR code with Binance app
                        </div>
                        <img 
                          src={order.qrCode} 
                          alt="Binance Pay QR Code" 
                          className="mx-auto max-w-48 max-h-48"
                        />
                      </CardContent>
                    </Card>
                  )}

                  {/* Payment URL */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Payment URL</div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-muted rounded text-xs break-all">
                        {order.paymentUrl}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(order.paymentUrl)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Open in Binance Button */}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(order.paymentUrl, '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open in Binance
                  </Button>

                  {/* Instructions */}
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="font-medium">How to pay:</div>
                    <div>1. Open the Binance app or click "Open in Binance"</div>
                    <div>2. Scan the QR code or use the payment URL</div>
                    <div>3. Complete the payment in the Binance app</div>
                    <div>4. Your wallet will be credited automatically</div>
                  </div>
                </>
              )}

              {order.status === 'completed' && (
                <div className="text-center text-green-600">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                  <div className="font-medium">Payment Completed!</div>
                  <div className="text-sm text-muted-foreground">
                    Your wallet has been credited with ${formatCurrency(amount)}
                  </div>
                </div>
              )}

              {(order.status === 'failed' || order.status === 'expired') && (
                <div className="text-center text-red-600">
                  <XCircle className="h-12 w-12 mx-auto mb-2" />
                  <div className="font-medium">
                    Payment {order.status === 'expired' ? 'Expired' : 'Failed'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {order.status === 'expired' 
                      ? 'The payment window has expired. Please create a new order.'
                      : 'The payment could not be processed. Please try again.'
                    }
                  </div>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => setOrder(null)}
                  >
                    Create New Order
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Close Button */}
          <Button variant="outline" onClick={onClose} className="w-full">
            {order?.status === 'completed' ? 'Done' : 'Cancel'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 