"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ConsolidateFunds } from "@/components/consolidate-funds"

interface ConsolidateFundsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConsolidateFundsDialog({ open, onOpenChange }: ConsolidateFundsDialogProps) {
  const handleConsolidate = () => {
    // Here you would implement the actual consolidation logic
    // For now, we'll just close the dialog
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto bg-card dark:bg-gradient-to-br dark:from-[#111111] dark:to-[#0a0a0a] border-border dark:border-[#222222]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-transparent bg-clip-text">
            Consolidate Funds
          </DialogTitle>
        </DialogHeader>
        <ConsolidateFunds onConsolidate={handleConsolidate} />
      </DialogContent>
    </Dialog>
  )
}
