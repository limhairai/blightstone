"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Building2, CreditCard, Bitcoin, Copy, ExternalLink } from "lucide-react"

interface AddFundsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  amount: string
  paymentMethod: string
}

export function AddFundsDialog({ open, onOpenChange, amount, paymentMethod }: AddFundsDialogProps) {
  const renderPaymentContent = () => {
    switch (paymentMethod) {
      case "bank":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5" />
              <h3 className="font-semibold">Bank Transfer Details</h3>
            </div>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Account Name</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">AdHub Technologies Pte Ltd</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Account Number</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">1234567890</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Routing Number</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">021000021</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Reference</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">ADHUB-{Math.random().toString(36).substr(2, 8).toUpperCase()}</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="text-sm text-muted-foreground">
              <p>• Include the reference number in your transfer</p>
              <p>• Transfers typically take 1-3 business days</p>
              <p>• You'll receive an email confirmation once processed</p>
            </div>
          </div>
        )

      case "card":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5" />
              <h3 className="font-semibold">Credit/Debit Card Payment</h3>
            </div>
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">You'll be redirected to our secure payment processor</p>
              <Button className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black font-medium">
                <ExternalLink className="h-4 w-4 mr-2" />
                Continue to Stripe
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>• Instant processing</p>
              <p>• 2.9% + $0.30 processing fee</p>
              <p>• Secure payment via Stripe</p>
            </div>
          </div>
        )

      case "crypto":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Bitcoin className="h-5 w-5" />
              <h3 className="font-semibold">Cryptocurrency Payment</h3>
            </div>
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Pay with Bitcoin, Ethereum, or other cryptocurrencies</p>
              <Button className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black font-medium">
                <ExternalLink className="h-4 w-4 mr-2" />
                Continue to Crypto Payment
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>• Instant processing after confirmation</p>
              <p>• Network fees apply</p>
              <p>• Supports BTC, ETH, USDC, USDT</p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card dark:bg-[#0a0a0a] border-border dark:border-[#333333] shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-transparent bg-clip-text">
            Add ${amount || "0"} to Wallet
          </DialogTitle>
        </DialogHeader>
        {renderPaymentContent()}
      </DialogContent>
    </Dialog>
  )
}
