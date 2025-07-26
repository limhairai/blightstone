'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Copy, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
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
  accountLocation: string
  accountType: string
  bankAddress?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  referenceNumber?: string
}

export function BankTransferDialog({ isOpen, onClose, amount, onSuccess }: BankTransferDialogProps) {
  const [loading, setLoading] = useState(false)
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null)
  const [showAdditionalDetails, setShowAdditionalDetails] = useState(false)
  const { session } = useAuth()

  // Calculate bank transfer fee (0.5%)
  const feePercentage = 0.5
  const feeAmount = Math.round(amount * (feePercentage / 100) * 100) / 100 // Round to 2 decimal places
  const totalAmount = amount + feeAmount

  // Static bank details - shown immediately
  // These are fallback values only - actual values come from environment variables via API
  const staticBankDetails: BankDetails = {
    accountName: "Loading...",
    bankName: "Loading...",
    accountNumber: "****",
    routingNumber: "****",
    fedwireRoutingNumber: "****",
    swiftCode: "****",
    accountLocation: "Loading...",
    accountType: "Loading..."
  }

  // Load bank details when dialog opens and reset when it closes
  useEffect(() => {
    if (!isOpen) {
      setBankDetails(null)
      setLoading(false)
    } else if (isOpen && !bankDetails && session?.access_token) {
      // Auto-load bank details when dialog opens
      loadBankDetails()
    }
  }, [isOpen, session?.access_token])

  const loadBankDetails = async () => {
    if (!session?.access_token) return

    setLoading(true)
    try {
      const response = await fetch('/api/bank-transfer/request', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          amount: totalAmount
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to load bank details')
      }

      const data = await response.json()
      setBankDetails({
        ...data.bankDetails,
        referenceNumber: data.request.referenceNumber
      })
    } catch (error) {
      console.error('Error loading bank details:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to load bank details')
    } finally {
      setLoading(false)
    }
  }

  const generateReferenceNumber = async () => {
    if (!session?.access_token) {
      toast.error("Please log in to generate transfer reference")
      return
    }

    await loadBankDetails()
    toast.success("Transfer reference generated successfully!")
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const copyAllDetails = () => {
    const details = bankDetails || staticBankDetails
    const allDetails = `Bank Transfer Details - ${formatCurrency(totalAmount)}

Account Name: ${details.accountName}
Bank Name: ${details.bankName}
Account Number: ${details.accountNumber}
Routing Number: ${details.routingNumber}
SWIFT Code: ${details.swiftCode}
Account Type: ${details.accountType || 'Checking'}
${details.bankAddress ? `Bank Address: ${details.bankAddress.street}
City, State ZIP: ${details.bankAddress.city}, ${details.bankAddress.state} ${details.bankAddress.zipCode}` : ''}
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
            Transfer {formatCurrency(totalAmount)} to add funds to your wallet
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
            
            {/* Additional Bank Details Collapsible Section */}
            <div className="border-t border-border pt-3 mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdditionalDetails(!showAdditionalDetails)}
                className="w-full justify-between h-8 px-2 text-sm"
              >
                Additional Bank Details
                {showAdditionalDetails ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              
              {showAdditionalDetails && (
                <div className="mt-3 space-y-2">
                  {/* Account Type */}
                  <BankDetailRow 
                    label="Account Type" 
                    value={currentDetails.accountType || "Checking"}
                    onCopy={() => copyToClipboard(currentDetails.accountType || "Checking", "Account Type")}
                  />
                  
                  {/* Bank Address */}
                  {currentDetails.bankAddress && (
                    <>
                      <BankDetailRow 
                        label="Bank Address" 
                        value={currentDetails.bankAddress.street}
                        onCopy={() => copyToClipboard(currentDetails.bankAddress!.street, "Bank Address")}
                      />
                      <BankDetailRow 
                        label="City, State ZIP" 
                        value={`${currentDetails.bankAddress.city}, ${currentDetails.bankAddress.state} ${currentDetails.bankAddress.zipCode}`}
                        onCopy={() => copyToClipboard(`${currentDetails.bankAddress!.city}, ${currentDetails.bankAddress!.state} ${currentDetails.bankAddress!.zipCode}`, "City, State ZIP")}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
            
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
                            <p>• Contact support if your transfer doesn&apos;t appear within 3 business days</p>
            {currentDetails.referenceNumber && (
              <p className="font-medium text-foreground">
                • Include reference number &quot;{currentDetails.referenceNumber}&quot; in your transfer memo
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