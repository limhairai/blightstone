"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, ArrowDownLeft, Wallet, Target, AlertCircle, CheckCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { toast } from "sonner"
import { formatCurrency } from "@/utils/format"
import { useSWRConfig } from "swr"
import { useAdAccounts } from "@/lib/swr-config"

interface BalanceResetDialogProps {
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
  accounts?: Array<{
    id: string
    name: string
    adAccount: string
    balance: number
    currency: string
    business: string
    bmId?: string | null
  }>
  onSuccess?: () => void
}

export function BalanceResetDialog({ trigger, account, accounts, onSuccess }: BalanceResetDialogProps) {
  const { session } = useAuth()
  const { currentOrganizationId } = useOrganizationStore()
  const { mutate } = useSWRConfig()
  const { data: allAccounts } = useAdAccounts()
  
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    amount: "",
    destination: "wallet" as "wallet" | "ad_account",
    destinationAccountId: ""
  })

  // Get available destination accounts (exclude current account)
  const destinationAccounts = allAccounts?.accounts?.filter(
    (acc: any) => acc.ad_account_id !== account.adAccount
  ) || []

  const resetForm = () => {
    setFormData({
      amount: "",
      destination: "wallet",
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

    if (formData.destination === "ad_account" && !formData.destinationAccountId) {
      toast.error("Please select a destination account")
      return
    }

    setLoading(true)

    try {
      const requestData = {
        organization_id: currentOrganizationId,
        ad_account_id: account.adAccount,
        ad_account_name: account.name,
        amount_cents: Math.round(parseFloat(formData.amount) * 100),
        currency: account.currency,
        request_type: 'balance_reset',
        transfer_destination_type: formData.destination,
        transfer_destination_id: formData.destination === "wallet" 
          ? currentOrganizationId // Use organization ID as wallet identifier
          : formData.destinationAccountId,
        metadata: {
          business_manager_name: account.business,
          business_manager_id: account.bmId,
          source_account_name: account.name,
          source_account_id: account.adAccount,
          destination_type: formData.destination,
          destination_account_name: formData.destination === "ad_account" 
            ? destinationAccounts.find(acc => acc.ad_account_id === formData.destinationAccountId)?.name
            : "Wallet"
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
        throw new Error(errorData.error || 'Failed to submit balance reset request')
      }

      setShowSuccess(true)
      toast.success("Balance Reset Request Submitted!", {
        description: "Your balance reset request has been submitted for admin review.",
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
      console.error('Error submitting balance reset request:', error)
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to submit balance reset request",
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
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Request Submitted
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center py-4">
              <p className="text-muted-foreground">
                Your balance reset request has been submitted and will be processed by our admin team.
              </p>
            </div>
            <div className="flex justify-center">
              <Button onClick={() => setOpen(false)} className="bg-gradient-to-r from-violet-400 to-pink-400 hover:opacity-90 text-black">
                Done
              </Button>
            </div>
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
            <ArrowDownLeft className="h-5 w-5" />
            Balance Reset Request
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{account.name}</div>
                  <div className="text-sm text-muted-foreground">{account.adAccount}</div>
                  <div className="text-sm text-muted-foreground">{account.business}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">${formatCurrency(account.balance)}</div>
                  <div className="text-sm text-muted-foreground">Current Balance</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount to Reset</Label>
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

          {/* Destination */}
          <div className="space-y-3">
            <Label>Transfer Destination</Label>
            <RadioGroup 
              value={formData.destination} 
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                destination: value as "wallet" | "ad_account",
                destinationAccountId: value === "wallet" ? "" : prev.destinationAccountId
              }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="wallet" id="wallet" />
                <Label htmlFor="wallet" className="flex items-center gap-2 cursor-pointer">
                  <Wallet className="h-4 w-4" />
                  Transfer to Wallet
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ad_account" id="ad_account" />
                <Label htmlFor="ad_account" className="flex items-center gap-2 cursor-pointer">
                  <Target className="h-4 w-4" />
                  Transfer to Another Ad Account
                </Label>
              </div>
            </RadioGroup>

            {formData.destination === "ad_account" && (
              <div className="space-y-2">
                <Label htmlFor="destinationAccount">Select Destination Account</Label>
                <Select 
                  value={formData.destinationAccountId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, destinationAccountId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an account" />
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
              </div>
            )}
          </div>



          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md">
            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-muted-foreground">
              <strong>Important:</strong> This request will be processed manually by our admin team. 
              The balance will be reset on the provider website and transferred to your chosen destination.
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-to-r from-violet-400 to-pink-400 hover:opacity-90 text-black"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 