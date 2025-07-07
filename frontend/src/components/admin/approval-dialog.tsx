"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { CheckCircle, AlertCircle } from "lucide-react"
import { validateForm, validators, showValidationErrors, showSuccessToast } from "../../lib/form-validation"

interface ApprovalDialogProps {
  isOpen: boolean
  onClose: () => void
  onApprove: (accountId: string) => void
  requestId: string
  clientName: string
  accountName: string
}

export function ApprovalDialog({
  isOpen,
  onClose,
  onApprove,
  requestId,
  clientName,
  accountName,
}: ApprovalDialogProps) {
  const [accountId, setAccountId] = useState("")

  const [error, setError] = useState("")

  const handleSubmit = () => {
    // Comprehensive form validation
    const validation = validateForm([
      () => validators.required(accountId, 'Ad Account ID'),
      () => validators.minLength(accountId, 3, 'Ad Account ID'),
      () => validators.maxLength(accountId, 50, 'Ad Account ID'),
    ])
    
    if (!validation.isValid) {
      showValidationErrors(validation.errors)
      return
    }

    try {
      onApprove(accountId)
      showSuccessToast("Request Approved!", "The ad account has been successfully assigned.")
      resetForm()
    } catch (error) {
      showValidationErrors([{ field: 'general', message: 'Failed to approve request. Please try again.' }])
    }
  }

  const resetForm = () => {
    setAccountId("")

    setError("")
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Approve Account Request</DialogTitle>
          <DialogDescription>Enter the ad account ID to assign to this client request.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Request Details</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-medium">Client:</div>
              <div>{clientName}</div>
              <div className="font-medium">Account:</div>
              <div>{accountName}</div>
              <div className="font-medium">Request ID:</div>
              <div className="font-mono">{requestId}</div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountId" className="text-right">
              Ad Account ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="accountId"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="Enter ad account ID (e.g., AD-12345)"
            />
            {error && (
              <div className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {error}
              </div>
            )}
          </div>


        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-[#b19cd9] hover:bg-[#9f84ca] text-black">
            <CheckCircle className="mr-2 h-4 w-4" /> Approve Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
