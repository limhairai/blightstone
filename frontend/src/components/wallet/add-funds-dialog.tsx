"use client"

// import { useState } from "react" // useState will be removed if isSubmitting is removed and no other state is used.
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { TopUpWallet } from "./top-up-wallet"

interface AddFundsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddFundsDialog({ open, onOpenChange }: AddFundsDialogProps) {
  // const [isSubmitting, setIsSubmitting] = useState(false); // Removed unused state

  const handleTopUp = (_amount: number) => { // Marked amount as unused
    // setIsSubmitting(true); // Removed as isSubmitting state is removed

    // Simulate API call
    setTimeout(() => {
      // setIsSubmitting(false); // Removed as isSubmitting state is removed
      onOpenChange(false) // Close dialog after timeout
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
