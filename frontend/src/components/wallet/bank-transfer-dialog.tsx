'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Copy, Loader2 } from 'lucide-react'
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
  referenceNumber?: string
}

export function BankTransferDialog({ isOpen, onClose, amount, onSuccess }: BankTransferDialogProps) {
  const [loading, setLoading] = useState(false)
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null)
  const { session } = useAuth()

  // Static bank details - shown immediately
  const staticBankDetails: BankDetails = {
    accountName: "AdHub Inc.",
    bankName: "Community Federal Savings Bank",
    accountNumber: "8480425778",
    routingNumber: "026073150",
    fedwireRoutingNumber: "026073150",
    swiftCode: "CMFGUS33"
  }

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setBankDetails(null)
      setLoading(false)
    }
  }, [isOpen])

  const generateReferenceNumber = async () => {
    if (!session?.access_token) {
      toast.error("Please log in to generate transfer reference")
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/bank-transfer/request', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          amount: amount
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate transfer reference')
      }

      const data = await response.json()
      setBankDetails({
        ...data.bankDetails,
        referenceNumber: data.request.referenceNumber
      })
      toast.success("Transfer reference generated successfully!")
      
      // Don't call onSuccess here - we want to keep dialog open to show the reference
      // onSuccess?.()
    } catch (error) {
      console.error('Error generating reference:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate transfer reference')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const copyAllDetails = () => {
    const details = bankDetails || staticBankDetails
    const allDetails = `Bank Transfer Details - ${formatCurrency(amount)}

Account Name: ${details.accountName}
Bank Name: ${details.bankName}
Account Number: ${details.accountNumber}
Routing Number: ${details.routingNumber}
SWIFT Code: ${details.swiftCode}
${details.referenceNumber ? `Reference Number: ${details.referenceNumber}` : ''}

Important: Include the reference number in your transfer memo.
Processing time: 1-3 business days`
    
    navigator.clipboard.writeText(allDetails)
    toast.success("All bank details copied to clipboard")
  }

  const currentDetails = bankDetails || staticBankDetails

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bank Transfer Instructions</DialogTitle>
          <DialogDescription>
            Transfer {formatCurrency(amount)} to add funds to your wallet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Bank Details Grid */}
          <div className="grid grid-cols-1 gap-2">
            <BankDetailRow 
              label="Account Name" 
              value={currentDetails.accountName}
              onCopy={() => copyToClipboard(currentDetails.accountName, "Account Name")}
            />
            <BankDetailRow 
              label="Bank Name" 
              value={currentDetails.bankName}
              onCopy={() => copyToClipboard(currentDetails.bankName, "Bank Name")}
            />
            <BankDetailRow 
              label="Account Number" 
              value={currentDetails.accountNumber}
              onCopy={() => copyToClipboard(currentDetails.accountNumber, "Account Number")}
            />
            <BankDetailRow 
              label="Routing Number" 
              value={currentDetails.routingNumber}
              onCopy={() => copyToClipboard(currentDetails.routingNumber, "Routing Number")}
            />
            <BankDetailRow 
              label="SWIFT Code" 
              value={currentDetails.swiftCode}
              onCopy={() => copyToClipboard(currentDetails.swiftCode, "SWIFT Code")}
            />
            
            {/* Reference Number */}
            <div className="flex items-center justify-between p-2 bg-muted/30 rounded border border-border">
              <div>
                <p className="text-sm font-medium">Reference Number</p>
                <p className="text-xs text-muted-foreground">
                  {currentDetails.referenceNumber || "Will be generated after confirmation"}
                </p>
              </div>
              {currentDetails.referenceNumber && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(currentDetails.referenceNumber!, "Reference Number")}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {!bankDetails ? (
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
                  onClick={generateReferenceNumber}
                  className="flex-1 bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0"
                  size="sm"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Generate Reference
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
                  onClick={() => {
                    onSuccess?.()
                    onClose()
                  }}
                  className="flex-1 bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0"
                  size="sm"
                >
                  Done
                </Button>
              </>
            )}
          </div>

          {/* Instructions */}
          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
            <p>• Bank transfers typically take 1-3 business days to process</p>
            <p>• Your wallet will be credited automatically when the transfer is received</p>
            <p>• Contact support if your transfer doesn't appear within 4 business days</p>
            {currentDetails.referenceNumber && (
              <p className="font-medium text-foreground">
                • Include reference number "{currentDetails.referenceNumber}" in your transfer memo
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Helper component for bank detail rows
function BankDetailRow({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{value}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onCopy}
        className="h-8 w-8 p-0"
      >
        <Copy className="h-3 w-3" />
      </Button>
    </div>
  )
} 