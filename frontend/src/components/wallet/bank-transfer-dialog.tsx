'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Copy, Loader2, AlertTriangle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/utils/format'

interface BankTransferDialogProps {
  isOpen: boolean
  onClose: () => void
  amount: number
  onSuccess?: () => void
}

interface BankDetails {
  accountName: string
  bankName: string
  accountNumber: string
  routingNumber: string
  fedwireRoutingNumber: string
  swiftCode: string
  referenceNumber: string
}

export function BankTransferDialog({ isOpen, onClose, amount, onSuccess }: BankTransferDialogProps) {
  const { session } = useAuth()
  const [loading, setLoading] = useState(false)
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null)
  const [step, setStep] = useState<'preview' | 'confirmed'>('preview')

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('preview')
      setBankDetails(null)
    }
  }, [isOpen])

  // Static bank details (no request needed for preview)
  const staticBankDetails = {
    accountName: process.env.NEXT_PUBLIC_AIRWALLEX_ACCOUNT_NAME || 'AdHub Inc.',
    bankName: process.env.NEXT_PUBLIC_AIRWALLEX_BANK_NAME || 'Community Federal Savings Bank',
    accountNumber: process.env.NEXT_PUBLIC_AIRWALLEX_ACCOUNT_NUMBER || '8480425778',
    routingNumber: process.env.NEXT_PUBLIC_AIRWALLEX_ROUTING_NUMBER || '026073150',
    fedwireRoutingNumber: process.env.NEXT_PUBLIC_AIRWALLEX_FEDWIRE_ROUTING || '026073008',
    swiftCode: process.env.NEXT_PUBLIC_AIRWALLEX_SWIFT_CODE || 'CMFGUS33',
  }

  const createBankTransferRequest = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/bank-transfer/request', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ 
          amount: amount
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create bank transfer request')
      }

      const data = await response.json()
      setBankDetails(data.bankDetails)
      setStep('confirmed')
      toast.success('Bank transfer request created successfully!')
      
    } catch (error) {
      console.error('Bank transfer request error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create bank transfer request')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard`)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const copyAllDetails = async () => {
    const details = bankDetails || { ...staticBankDetails, referenceNumber: 'Will be generated after confirmation' }
    
    const allDetails = `Bank Transfer Details:
Account Name: ${details.accountName}
Bank Name: ${details.bankName}
Account Number: ${details.accountNumber}
Routing Number: ${details.routingNumber}
SWIFT Code: ${details.swiftCode}

${bankDetails ? `IMPORTANT - Reference Number: ${details.referenceNumber}` : 'Reference number will be provided after confirmation'}

Amount: ${formatCurrency(amount)}

${bankDetails ? `Please include the reference number "${details.referenceNumber}" in your transfer to ensure proper crediting.` : 'Please confirm your transfer to get your unique reference number.'}`

    try {
      await navigator.clipboard.writeText(allDetails)
      toast.success('Bank details copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy details')
    }
  }

  const handleClose = () => {
    setBankDetails(null)
    setStep('preview')
    onSuccess?.()
    onClose()
  }

  const currentDetails = bankDetails || staticBankDetails

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bank Transfer Details</DialogTitle>
          <DialogDescription>
            Amount: {formatCurrency(amount)} • {step === 'preview' ? 'Review details before confirming' : 'Use these details for your bank transfer'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Creating transfer request...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status Notice */}
            {step === 'preview' ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Preview Mode</p>
                    <p className="text-sm text-blue-700">
                      Review the bank details below. Click "Confirm Transfer" to generate your unique reference number.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900">Transfer Confirmed</p>
                    <p className="text-sm text-green-700">
                      Your unique reference number has been generated. Include it in your bank transfer.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bank Details Grid */}
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <div>
                  <p className="text-sm font-medium">Account Name</p>
                  <p className="text-xs text-muted-foreground">{currentDetails.accountName}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(currentDetails.accountName, 'Account name')}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <div>
                  <p className="text-sm font-medium">Bank Name</p>
                  <p className="text-xs text-muted-foreground">{currentDetails.bankName}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(currentDetails.bankName, 'Bank name')}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <div>
                  <p className="text-sm font-medium">Account Number</p>
                  <p className="text-xs text-muted-foreground font-mono">{currentDetails.accountNumber}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(currentDetails.accountNumber, 'Account number')}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <div>
                  <p className="text-sm font-medium">Routing Number</p>
                  <p className="text-xs text-muted-foreground font-mono">{currentDetails.routingNumber}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(currentDetails.routingNumber, 'Routing number')}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <div>
                  <p className="text-sm font-medium">SWIFT Code</p>
                  <p className="text-xs text-muted-foreground font-mono">{currentDetails.swiftCode}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(currentDetails.swiftCode, 'SWIFT code')}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>

              {/* Reference Number - Only show when confirmed */}
              {step === 'confirmed' && bankDetails?.referenceNumber && (
                <div className="flex items-center justify-between p-2 bg-muted border border-border rounded">
                  <div>
                    <p className="text-sm font-medium">Reference Number</p>
                    <p className="text-xs font-mono font-bold">{bankDetails.referenceNumber}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(bankDetails.referenceNumber, 'Reference number')}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* Reference placeholder for preview */}
              {step === 'preview' && (
                <div className="flex items-center justify-between p-2 bg-muted/50 border border-dashed border-border rounded">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Reference Number</p>
                    <p className="text-xs text-muted-foreground">Will be generated after confirmation</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              {step === 'preview' ? (
                <>
                  <Button 
                    onClick={copyAllDetails}
                    variant="outline"
                    className="flex-1"
                    size="sm"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Details
                  </Button>
                  
                  <Button
                    onClick={createBankTransferRequest}
                    className="flex-1 bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0"
                    size="sm"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Confirm Transfer
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    onClick={copyAllDetails}
                    variant="outline"
                    className="flex-1"
                    size="sm"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy All Details
                  </Button>
                  
                  <Button
                    onClick={handleClose}
                    className="flex-1 bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0"
                    size="sm"
                  >
                    Done
                  </Button>
                </>
              )}
            </div>

            {/* Footer Notes */}
            <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
              {step === 'preview' ? (
                <>
                  <p>• Review the bank details above</p>
                  <p>• Click "Confirm Transfer" to generate your unique reference number</p>
                  <p>• Only confirmed transfers will be tracked in the admin panel</p>
                </>
              ) : (
                <>
                  <p>• Bank transfers typically take 1-3 business days to process</p>
                  <p>• Your wallet will be credited automatically when the transfer is received</p>
                  <p>• Contact support if your transfer doesn't appear within 4 business days</p>
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 