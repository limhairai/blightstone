"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DistributeFunds } from "@/components/distribute-funds"
import { useState, useEffect } from "react"

interface DistributeFundsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  walletBalance: number
}

export function DistributeFundsDialog({ open, onOpenChange, walletBalance }: DistributeFundsDialogProps) {
  const [accountDisplayNames, setAccountDisplayNames] = useState<string[]>([])
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]) // Added declaration
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]) // Added declaration

  const handleDistribute = () => {
    // Here you would implement the actual distribution logic
    // For now, we'll just close the dialog
    onOpenChange(false)
  }

  useEffect(() => {
    if (selectedAccounts.length > 0) {
      // Update display names for selected accounts
      const updatedDisplays = selectedAccounts.map((acct) => {
        const account = accounts.find((a) => a.id === acct)
        return account ? account.name : "Unknown Account"
      })
      setAccountDisplayNames(updatedDisplays)
    }
  }, [selectedAccounts, accounts])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card dark:bg-[#0a0a0a] border-border dark:border-[#333333] shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-transparent bg-clip-text">
            Distribute Funds
          </DialogTitle>
        </DialogHeader>
        <DistributeFunds walletBalance={walletBalance} onDistribute={handleDistribute} />
      </DialogContent>
    </Dialog>
  )
}
