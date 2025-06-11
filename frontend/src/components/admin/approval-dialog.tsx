"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { CheckCircle, AlertCircle } from "lucide-react"

interface ApprovalDialogProps {
  isOpen: boolean
  onClose: () => void
  onApprove: (accountId: string, notes: string) => void
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
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = () => {
    if (!accountId.trim()) {
      setError("Please enter a valid ad account ID")
      return
    }

    onApprove(accountId, notes)
    resetForm()
  }

  const resetForm = () => {
    setAccountId("")
    setNotes("")
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

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-right">
              Notes (Optional)
            </Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes for this approval"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-[#b19cd9] hover:bg-[#9f84ca] text-white">
            <CheckCircle className="mr-2 h-4 w-4" /> Approve Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
