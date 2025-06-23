"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog"
import { TopUpWallet } from "./top-up-wallet"
import { useAppData } from "../../contexts/AppDataContext"
import { toast } from "sonner"

interface AddFundsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddFundsDialog({ open, onOpenChange }: AddFundsDialogProps) {
  const { updateWalletBalance, addTransaction } = useAppData()

  const handleTopUp = async (amount: number, paymentMethod = "card") => {
    try {
      // 1. Add funds to wallet balance
      await updateWalletBalance(amount, 'add')
      
      // 2. Add transaction record
      await addTransaction({
        type: 'topup',
        amount: amount,
        date: new Date().toISOString(),
        description: `Wallet funding via ${paymentMethod === 'card' ? 'Credit Card' : 'Bank Transfer'}`,
        status: 'completed'
      })
      
      toast.success(`Successfully added $${amount} to wallet`)
      onOpenChange(false)
    } catch (error) {
      toast.error("Failed to add funds to wallet")
    }
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
