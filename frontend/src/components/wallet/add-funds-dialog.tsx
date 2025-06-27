"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog"
import { TopUpWallet } from "./top-up-wallet"
import { toast } from "sonner"

interface AddFundsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddFundsDialog({ open, onOpenChange }: AddFundsDialogProps) {
  const handleTopUp = async (amount: number, paymentMethod = "card") => {
    if (paymentMethod !== 'card') {
      toast.info("Crypto payments are not yet supported.", {
        description: "Please use a credit card for now.",
      });
      return;
    }
    // Card payments are handled by the Stripe dialog inside TopUpWallet
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
