"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TopUpWallet } from "@/components/top-up-wallet"

interface AddFundsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddFundsDialog({ open, onOpenChange }: AddFundsDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleTopUp = (amount: number) => {
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      onOpenChange(false)
    }, 1500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card dark:bg-gradient-to-br dark:from-[#111111] dark:to-[#0a0a0a] border-border dark:border-[#222222]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-transparent bg-clip-text">
            Add Funds to Wallet
          </DialogTitle>
        </DialogHeader>
        <TopUpWallet onTopUp={handleTopUp} />
      </DialogContent>
    </Dialog>
  )
}
