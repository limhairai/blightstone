'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Copy, Loader2, AlertTriangle } from 'lucide-react'
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

  // Auto-create bank transfer request when dialog opens
  useEffect(() => {
    if (isOpen && !bankDetails && amount > 0) {
      createBankTransferRequest()
    }
  }, [isOpen, amount])

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
      toast.success('Bank transfer request created successfully!')
      
    } catch (error) {
      console.error('Bank transfer request error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create bank transfer request')
      onClose() // Close dialog on error
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
    if (!bankDetails) return
    
    const allDetails = `Bank Transfer Details:
Account Name: ${bankDetails.accountName}
Bank Name: ${bankDetails.bankName}
Account Number: ${bankDetails.accountNumber}
Routing Number: ${bankDetails.routingNumber}
SWIFT Code: ${bankDetails.swiftCode}

IMPORTANT - Reference Number: ${bankDetails.referenceNumber}

Amount: ${formatCurrency(amount)}

Please include the reference number "${bankDetails.referenceNumber}" in your transfer to ensure proper crediting.`

    try {
      await navigator.clipboard.writeText(allDetails)
      toast.success('All bank details copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy details')
    }
  }

  const handleClose = () => {
    setBankDetails(null)
    onSuccess?.()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bank Transfer Details</DialogTitle>
          <DialogDescription>
            Amount: {formatCurrency(amount)} • Use these details for your bank transfer
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Creating transfer request...</span>
          </div>
        ) : bankDetails ? (
          <div className="space-y-4">
            {/* Critical Notice */}
            <div className="bg-muted/50 border border-border rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Critical</p>
                  <p className="text-sm text-muted-foreground">
                    You must include the reference number in your bank transfer for automatic processing.
                  </p>
                </div>
              </div>
            </div>

            {/* Bank Details Grid */}
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <div>
                  <p className="text-sm font-medium">Account Name</p>
                  <p className="text-xs text-muted-foreground">{bankDetails.accountName}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(bankDetails.accountName, 'Account name')}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <div>
                  <p className="text-sm font-medium">Bank Name</p>
                  <p className="text-xs text-muted-foreground">{bankDetails.bankName}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(bankDetails.bankName, 'Bank name')}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <div>
                  <p className="text-sm font-medium">Account Number</p>
                  <p className="text-xs text-muted-foreground font-mono">{bankDetails.accountNumber}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(bankDetails.accountNumber, 'Account number')}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <div>
                  <p className="text-sm font-medium">Routing Number</p>
                  <p className="text-xs text-muted-foreground font-mono">{bankDetails.routingNumber}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(bankDetails.routingNumber, 'Routing number')}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <div>
                  <p className="text-sm font-medium">SWIFT Code</p>
                  <p className="text-xs text-muted-foreground font-mono">{bankDetails.swiftCode}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(bankDetails.swiftCode, 'SWIFT code')}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>

              {/* Reference Number - Highlighted */}
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
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
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
            </div>

            {/* Footer Notes */}
            <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
              <p>• Bank transfers typically take 1-3 business days to process</p>
              <p>• Your wallet will be credited automatically when the transfer is received</p>
              <p>• Contact support if your transfer doesn't appear within 4 business days</p>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
} 