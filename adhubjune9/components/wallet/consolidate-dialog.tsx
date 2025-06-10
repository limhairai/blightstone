"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/utils/format"
import { ArrowUpDown, Check, Loader2 } from "lucide-react"
import { MOCK_ACCOUNTS } from "@/data/mock-accounts"

interface ConsolidateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConsolidateDialog({ open, onOpenChange }: ConsolidateDialogProps) {
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { toast } = useToast()

  const accountsWithBalance = MOCK_ACCOUNTS.filter((account) => account.balance > 0)

  const totalToConsolidate = selectedAccounts.reduce((total, accountId) => {
    const account = accountsWithBalance.find((acc) => acc.id.toString() === accountId)
    return total + (account?.balance || 0)
  }, 0)

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAccounts(accountsWithBalance.map((account) => account.id.toString()))
    } else {
      setSelectedAccounts([])
    }
  }

  const handleSelectAccount = (accountId: string, checked: boolean) => {
    if (checked) {
      setSelectedAccounts((prev) => [...prev, accountId])
    } else {
      setSelectedAccounts((prev) => prev.filter((id) => id !== accountId))
    }
  }

  const handleConsolidate = async () => {
    if (selectedAccounts.length === 0) {
      toast({
        title: "No Accounts Selected",
        description: "Please select at least one account to consolidate",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setShowSuccess(true)
      toast({
        title: "Consolidation Successful!",
        description: `$${formatCurrency(totalToConsolidate)} has been consolidated to your main wallet`,
      })

      setTimeout(() => {
        setSelectedAccounts([])
        setShowSuccess(false)
        onOpenChange(false)
      }, 2000)
    } catch (error) {
      toast({
        title: "Consolidation Failed",
        description: "Failed to consolidate funds. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Consolidation Successful!</h3>
            <p className="text-muted-foreground">
              ${formatCurrency(totalToConsolidate)} has been consolidated to your main wallet
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card border-border max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5 text-[#c4b5fd]" />
            Consolidate Funds
          </DialogTitle>
          <p className="text-sm text-muted-foreground">Move funds from ad accounts back to your main wallet</p>
        </DialogHeader>

        <div className="space-y-6 flex-1 overflow-hidden">
          {/* Select All */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={selectedAccounts.length === accountsWithBalance.length}
              onCheckedChange={handleSelectAll}
              className="border-border data-[state=checked]:bg-[#c4b5fd] data-[state=checked]:border-[#c4b5fd]"
            />
            <label htmlFor="select-all" className="text-sm font-medium text-foreground">
              Select all accounts with balance
            </label>
          </div>

          {/* Account List */}
          <ScrollArea className="h-[300px] border border-border rounded-md">
            <div className="space-y-3 p-3">
              {accountsWithBalance.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border"
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedAccounts.includes(account.id.toString())}
                      onCheckedChange={(checked) => handleSelectAccount(account.id.toString(), checked as boolean)}
                      className="border-border data-[state=checked]:bg-[#c4b5fd] data-[state=checked]:border-[#c4b5fd]"
                    />
                    <div>
                      <div className="font-medium text-foreground text-sm">{account.name}</div>
                      <div className="text-xs text-muted-foreground">{account.business}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-foreground">${formatCurrency(account.balance)}</div>
                    <div className="text-xs text-muted-foreground">Available</div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Summary */}
          {selectedAccounts.length > 0 && (
            <div className="space-y-3 p-3 bg-muted/50 rounded-lg border border-border">
              <h4 className="text-sm font-medium text-foreground">Consolidation Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Accounts selected:</span>
                  <span className="font-medium text-foreground">{selectedAccounts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total to consolidate:</span>
                  <span className="font-medium text-foreground">${formatCurrency(totalToConsolidate)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="border-border text-foreground hover:bg-accent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConsolidate}
              disabled={isLoading || selectedAccounts.length === 0}
              className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-white border-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Consolidating...
                </>
              ) : (
                <>
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  Consolidate ${formatCurrency(totalToConsolidate)}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
