"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Alert, AlertDescription } from "../ui/alert"
import { Badge } from "../ui/badge"
import { DollarSign, Clock, CheckCircle, Wallet, AlertCircle, Info } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "../../contexts/AuthContext"
import { useOrganizationStore } from "../../lib/stores/organization-store"
import { formatCurrency } from "../../utils/format"
import type { TopupRequestPriority } from "../../types/topup-request"

interface RequestAccountFundingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accountId?: string
  accountName?: string
  onSuccess?: () => void
}

export function RequestAccountFundingDialog({
  open,
  onOpenChange,
  accountId,
  accountName,
  onSuccess
}: RequestAccountFundingDialogProps) {
  const { user, session } = useAuth()
  const { currentOrganizationId } = useOrganizationStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [amount, setAmount] = useState<number>(0)
  const [priority, setPriority] = useState<TopupRequestPriority>('normal')
  const [notes, setNotes] = useState('')
  const [walletBalance, setWalletBalance] = useState<number>(0)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)

  // Fetch wallet balance when dialog opens
  useEffect(() => {
    if (open && currentOrganizationId) {
      fetchWalletBalance()
    }
  }, [open, currentOrganizationId])

  const fetchWalletBalance = async () => {
    if (!currentOrganizationId) return
    
    setIsLoadingBalance(true)
    try {
      const response = await fetch(`/api/organizations?id=${currentOrganizationId}`)
      if (response.ok) {
        const data = await response.json()
        const org = data.organizations?.[0]
        setWalletBalance((org?.balance_cents || 0) / 100)
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error)
    } finally {
      setIsLoadingBalance(false)
    }
  }

  const handleSubmit = async () => {
    if (!accountId || !accountName || !amount || !currentOrganizationId) {
      toast.error('Please fill in all required fields')
      return
    }

    if (amount < 10) {
      toast.error('Minimum top-up amount is $10')
      return
    }

    if (amount > walletBalance) {
      toast.error('Amount exceeds your wallet balance')
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/topup-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization_id: currentOrganizationId,
          ad_account_id: accountId,
          ad_account_name: accountName,
          amount_cents: Math.round(amount * 100),
          priority,
          notes: notes.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit top-up request')
      }

      toast.success('Top-up request submitted successfully!', {
        description: 'Our admin team will process your request shortly.'
      })
      
      onSuccess?.()
      onOpenChange(false)
      
      // Reset form
      setAmount(0)
      setPriority('normal')
      setNotes('')
      
    } catch (error) {
      console.error('Error submitting top-up request:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit top-up request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const predefinedAmounts = [50, 100, 500, 1000, 5000]
  const maxAmount = Math.min(walletBalance, 100000)

  const getPriorityColor = (priority: TopupRequestPriority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-500 border-red-500'
      case 'high': return 'bg-orange-500/20 text-orange-500 border-orange-500'
      case 'normal': return 'bg-blue-500/20 text-blue-500 border-blue-500'
      case 'low': return 'bg-gray-500/20 text-gray-500 border-gray-500'
      default: return 'bg-blue-500/20 text-blue-500 border-blue-500'
    }
  }

  const renderForm = () => (
    <div className="space-y-6">
      {/* Account Info */}
      <div className="space-y-2">
        <Label>Ad Account</Label>
        <div className="p-3 bg-muted rounded-md">
          <p className="font-medium">{accountName}</p>
          <p className="text-sm text-muted-foreground">ID: {accountId}</p>
        </div>
      </div>

      {/* Wallet Balance */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Available Balance</span>
        </div>
        <div className="text-lg font-semibold">
          {isLoadingBalance ? (
            <div className="h-6 w-20 bg-muted animate-pulse rounded" />
          ) : (
            formatCurrency(walletBalance)
          )}
        </div>
      </div>

      {/* Amount Selection */}
      <div className="space-y-3">
        <Label htmlFor="amount">Top-up Amount *</Label>
        
        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-3 gap-2">
          {predefinedAmounts
            .filter(amt => amt <= maxAmount)
            .map((amt) => (
              <Button
                key={amt}
                type="button"
                variant={amount === amt ? "default" : "outline"}
                size="sm"
                onClick={() => setAmount(amt)}
                disabled={amt > walletBalance}
                className={amount === amt ? "bg-primary" : ""}
              >
                ${amt}
              </Button>
            ))}
        </div>

        {/* Custom Amount Input */}
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="amount"
            type="number"
            min="10"
            max={maxAmount}
            step="0.01"
            value={amount || ''}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            placeholder="Enter custom amount"
            className="pl-10"
          />
        </div>
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Minimum: $10</span>
          <span>Maximum: {formatCurrency(maxAmount)}</span>
        </div>
      </div>

      {/* Priority Selection */}
      <div className="space-y-2">
        <Label>Priority</Label>
        <Select value={priority} onValueChange={(value: TopupRequestPriority) => setPriority(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-gray-500/20 text-gray-500 border-gray-500">Low</Badge>
                <span>Standard processing</span>
              </div>
            </SelectItem>
            <SelectItem value="normal">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-500/20 text-blue-500 border-blue-500">Normal</Badge>
                <span>Regular priority</span>
              </div>
            </SelectItem>
            <SelectItem value="high">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-orange-500/20 text-orange-500 border-orange-500">High</Badge>
                <span>Expedited processing</span>
              </div>
            </SelectItem>
            <SelectItem value="urgent">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-red-500/20 text-red-500 border-red-500">Urgent</Badge>
                <span>Immediate attention</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional notes for the admin team..."
          rows={3}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground">
          {notes.length}/500 characters
        </p>
      </div>

      {/* Warning for insufficient balance */}
      {amount > walletBalance && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Insufficient wallet balance. Please reduce the amount or add funds to your wallet.
          </AlertDescription>
        </Alert>
      )}

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Your top-up request will be processed manually by our admin team. Funds will be deducted from your wallet once the request is completed.
        </AlertDescription>
      </Alert>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Request Account Top-up
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {renderForm()}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={!accountId || !amount || amount <= 0 || amount > walletBalance || isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 