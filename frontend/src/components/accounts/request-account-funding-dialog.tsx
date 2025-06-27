"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"

import { Alert, AlertDescription } from "../ui/alert"
import { DollarSign, Clock, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "../../contexts/AuthContext"


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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [amount, setAmount] = useState<number>(0)
  const [notes, setNotes] = useState('')



  const handleSubmit = async () => {
    if (!accountId || !accountName || !amount) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Get user's organization ID
      const { data: profile } = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      }).then(res => res.json())

      const response = await fetch('/api/funding-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_id: accountId,
          account_name: accountName,
          requested_amount: amount,
          notes: notes,
          organization_id: profile?.organization_id || user?.id // fallback to user ID
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit top-up request')
      }

      toast.success('Top-up request submitted! Admin will process it manually.')
      onSuccess?.()
      onOpenChange(false)
      
      // Reset form
      setAmount(0)
      setNotes('')
      
    } catch (error) {
      console.error('Error submitting top-up request:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit top-up request')
    } finally {
      setIsSubmitting(false)
    }
  }



  const renderForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Ad Account</Label>
        <div className="p-3 bg-muted rounded-md">
          <p className="font-medium">{accountName}</p>
          <p className="text-sm text-muted-foreground">ID: {accountId}</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Top-up Amount *</Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="amount"
            type="number"
            min="10"
            max="100000"
            value={amount || ''}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            placeholder="Enter amount"
            className="pl-10"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Minimum: $10 • Maximum: $100,000
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional notes for the admin..."
          rows={2}
        />
      </div>

      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          Your top-up request will be processed manually by our admin team.
        </AlertDescription>
      </Alert>
    </div>
  )





  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Account Top-up</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {renderForm()}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={!accountId || !amount || amount <= 0 || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
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