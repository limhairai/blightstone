"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, ArrowRightLeft, AlertCircle, Check } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { toast } from "sonner"
import { formatCurrency } from "@/utils/format"
import { useSWRConfig } from "swr"
import { useAdAccounts } from "@/lib/swr-config"

interface TransferBalanceDialogProps {
  trigger: React.ReactNode
  account: {
    id: string
    name: string
    adAccount: string
    balance: number
    currency: string
    business: string
    bmId?: string | null
  }
  onSuccess?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function TransferBalanceDialog({ trigger, account, onSuccess, open: controlledOpen, onOpenChange }: TransferBalanceDialogProps) {
  const { session } = useAuth()
  const { currentOrganizationId } = useOrganizationStore()
  const { mutate } = useSWRConfig()
  const { data: allAccounts } = useAdAccounts()
  
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    amount: "",
    destinationAccountId: ""
  })

  // Get available destination accounts (exclude current account)
  const destinationAccounts = allAccounts?.accounts?.filter(
    (acc: any) => acc.ad_account_id !== account.adAccount
  ) || []

  const resetForm = () => {
    setFormData({
      amount: "",
      destinationAccountId: ""
    })
    setShowSuccess(false)
  }

  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session?.access_token || !currentOrganizationId) {
      toast.error("Authentication required")
      return
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (!formData.destinationAccountId) {
      toast.error("Please select a destination account")
      return
    }

    if (parseFloat(formData.amount) > account.balance) {
      toast.error("Amount exceeds account balance")
      return
    }

    setLoading(true)

    try {
      const destinationAccount = destinationAccounts.find((acc: any) => acc.ad_account_id === formData.destinationAccountId)
      
      const requestData = {
        organization_id: currentOrganizationId,
        ad_account_id: account.adAccount,
        ad_account_name: account.name,
        amount_cents: Math.round(parseFloat(formData.amount) * 100),
        currency: account.currency,
        request_type: 'balance_transfer',
        transfer_destination_type: 'ad_account',
        transfer_destination_id: formData.destinationAccountId,
        metadata: {
          business_manager_name: account.business,
          business_manager_id: account.bmId,
          source_account_name: account.name,
          source_account_id: account.adAccount,
          destination_type: 'ad_account',
          destination_account_name: destinationAccount?.name || 'Unknown Account',
          destination_account_id: formData.destinationAccountId
        }
      }

      const response = await fetch('/api/topup-requests', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit transfer request')
      }

      setShowSuccess(true)
      toast.success("Transfer Request Submitted!", {
        description: `Your transfer request for $${formatCurrency(parseFloat(formData.amount))} has been submitted for review.`,
      })

      // Call the callback
      if (onSuccess) {
        onSuccess()
      }

      // Refresh data
      if (currentOrganizationId) {
        await Promise.all([
          mutate(`/api/organizations?id=${currentOrganizationId}`),
          mutate('/api/organizations'),
          mutate(`org-${currentOrganizationId}`),
          mutate('/api/topup-requests')
        ])
      }

    } catch (error) {
      console.error('Error submitting transfer request:', error)
      toast.error("Request Failed", {
        description: error instanceof Error ? error.message : "Failed to submit transfer request",
      })
    } finally {
      setLoading(false)
    }
  }

  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">Request Submitted</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Your transfer request for ${formatCurrency(parseFloat(formData.amount))} has been submitted for review.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Transfer Balance
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Source Account Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">From Account</div>
                  <div className="font-medium">{account.name}</div>
                  <div className="text-sm text-muted-foreground">{account.adAccount}</div>
                  <div className="text-sm text-muted-foreground">{account.business}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">${formatCurrency(account.balance)}</div>
                  <div className="text-sm text-muted-foreground">Available Balance</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Destination Account */}
          <div className="space-y-2">
            <Label htmlFor="destinationAccount">Transfer To Account</Label>
            <Select 
              value={formData.destinationAccountId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, destinationAccountId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose destination account" />
              </SelectTrigger>
              <SelectContent>
                {destinationAccounts.map((acc: any) => (
                  <SelectItem key={acc.ad_account_id} value={acc.ad_account_id}>
                    <div className="flex flex-col">
                      <span>{acc.name}</span>
                      <span className="text-xs text-muted-foreground">{acc.ad_account_id}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {destinationAccounts.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No other accounts available for transfer
              </p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Transfer Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={account.balance}
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="pl-8"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Maximum: ${formatCurrency(account.balance)}
            </p>
          </div>

          {/* Preview */}
          {formData.amount && formData.destinationAccountId && (
            <div className="p-3 bg-muted/50 rounded-lg border border-border space-y-2">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Transfer Preview</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transfer Amount:</span>
                  <span className="font-medium text-foreground">${formatCurrency(parseFloat(formData.amount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Remaining Balance:</span>
                  <span className="font-medium text-foreground">${formatCurrency(account.balance - parseFloat(formData.amount))}</span>
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md">
            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-muted-foreground">
              <strong>Note:</strong> This transfer request will be reviewed and processed. 
              Make sure you've selected the correct destination account.
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.amount || !formData.destinationAccountId || destinationAccounts.length === 0}
              className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 