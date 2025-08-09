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

  // ✅ FIXED: Poll for payment status with proper timeout cleanup
  useEffect(() => {
    if (order && order.status === 'pending' && isPolling) {
      let closeTimeout: NodeJS.Timeout // ✅ Track timeout for cleanup
      
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
                
                // Invalidate caches after successful crypto payment
                import('@/lib/cache-invalidation').then(({ CacheInvalidationScenarios }) => {
                  CacheInvalidationScenarios.walletFunding()
                })
                
                onSuccess?.()
                // ✅ FIXED: Track timeout for cleanup
                closeTimeout = setTimeout(() => onClose(), 2000)
              } else if (data.status === 'failed') {
                toast.error('Payment failed. Please try again.')
              }
            }
          }
        } catch (error) {
          console.error('Error polling payment status:', error)
        }
      }, 10000) // Poll every 10 seconds (reduced frequency)

      // ✅ FIXED: Cleanup both interval and timeout
      return () => {
        clearInterval(pollInterval)
        if (closeTimeout) clearTimeout(closeTimeout)
      }
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
      <DialogContent className={!order ? "sm:max-w-md" : "sm:max-w-4xl bg-card border-border max-h-[90vh] p-0"}>
        <DialogHeader className={!order ? "" : "p-6 pb-4"}>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Crypto Payment
          </DialogTitle>
          <DialogDescription>
            Pay with cryptocurrency
          </DialogDescription>
        </DialogHeader>

        {!order ? (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">${formatCurrency(amount)}</div>
                  <div className="text-sm text-muted-foreground">Amount to add to wallet</div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Click below to create a crypto payment order. Payment will be processed in USDT via Binance Pay.
              </div>
              
              <Button
                onClick={createBinancePayOrder}
                disabled={isCreating}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground border-0"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Payment Order...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    Create Crypto Payment Order
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 px-6 pb-6 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Payment Details & Status */}
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

                {/* Status & Timer */}
                <Card>
                  <CardContent className="p-4">
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
                  </CardContent>
                </Card>

                {/* Payment URL */}
                {order.status === 'pending' && (
                  <Card>
                    <CardContent className="p-4 space-y-3">
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
                      
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(order.paymentUrl, '_blank')}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open Payment Page
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Instructions */}
                {order.status === 'pending' && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm font-medium mb-2">How to pay:</div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>1. Click "Open Payment Page" or scan the QR code</div>
                        <div>2. Pay with USDT or convert from other cryptocurrencies</div>
                        <div>3. Complete the payment using your Binance account</div>
                        <div>4. Your wallet will be credited automatically</div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column - QR Code & Status Messages */}
              <div className="space-y-4">
                {order.status === 'pending' && order.qrCode && (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="flex justify-center mb-3">
                        <QrCode className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="text-sm text-muted-foreground mb-4">
                        Scan QR code with Binance app
                      </div>
                      <div className="mx-auto max-w-64 max-h-64">
                        <img 
                          src={order.qrCode} 
                          alt="Binance Pay QR Code" 
                          className="mx-auto rounded-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            const textDiv = e.currentTarget.nextElementSibling as HTMLElement
                            if (textDiv) textDiv.style.display = 'block'
                          }}
                        />
                        <div 
                          className="hidden p-2 bg-muted rounded text-xs font-mono break-all"
                          style={{ display: 'none' }}
                        >
                          {order.qrCode}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {order.status === 'completed' && (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
                      <div className="text-lg font-medium text-green-600 mb-2">Payment Completed!</div>
                      <div className="text-sm text-muted-foreground">
                        Your wallet has been credited with ${formatCurrency(amount)}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {(order.status === 'failed' || order.status === 'expired') && (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <XCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
                      <div className="text-lg font-medium text-red-600 mb-2">
                        Payment {order.status === 'expired' ? 'Expired' : 'Failed'}
                      </div>
                      <div className="text-sm text-muted-foreground mb-4">
                        {order.status === 'expired' 
                          ? 'The payment window has expired. Please create a new order.'
                          : 'The payment could not be processed. Please try again.'
                        }
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setOrder(null)}
                      >
                        Create New Order
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}

        <div className={!order ? "mt-4" : "mt-4 px-6 pb-6"}>
          <Button variant="outline" onClick={onClose} className="w-full">
            {order?.status === 'completed' ? 'Done' : 'Cancel'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 