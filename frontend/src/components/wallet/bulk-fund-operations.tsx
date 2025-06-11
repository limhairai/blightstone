"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { ArrowRightLeft, DollarSign } from "lucide-react"

// Define a type for the account data objects
interface AccountData {
  id: string;
  balance: string; // e.g., "$123.45"
}

interface BulkFundOperationsProps {
  selectedAccounts: string[]
  accountsData: AccountData[] // Use specific type
  onOperationComplete: () => void
}

export function BulkFundOperations({ selectedAccounts, accountsData, onOperationComplete }: BulkFundOperationsProps) {
  const [dialogContent, setDialogContent] = useState<"topup" | "withdraw" | null>(null)
  const [amount, setAmount] = useState("")
  const [percentage, setPercentage] = useState("")

  const selectedAccountsData = accountsData.filter((account) => selectedAccounts.includes(account.id))

  const totalBalance = selectedAccountsData.reduce((sum, account) => {
    const balance = Number.parseFloat(account.balance.replace("$", ""))
    return sum + (isNaN(balance) ? 0 : balance)
  }, 0)

  const handleTopUp = () => {
    // In a real app, this would call an API to top up the selected accounts
    alert(`Top up of $${amount} applied to ${selectedAccounts.length} accounts`)
    setDialogContent(null)
    onOperationComplete()
  }

  const handleWithdraw = () => {
    // In a real app, this would call an API to withdraw from the selected accounts
    alert(`Withdrawal of $${amount} from ${selectedAccounts.length} accounts`)
    setDialogContent(null)
    onOperationComplete()
  }

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" className="border-border bg-secondary/50" onClick={() => setDialogContent("topup")}>
          <DollarSign className="h-4 w-4 mr-2" />
          Top Up Selected
        </Button>
        <Button
          variant="outline"
          className="border-border bg-secondary/50"
          onClick={() => setDialogContent("withdraw")}
        >
          <ArrowRightLeft className="h-4 w-4 mr-2" />
          Withdraw Selected
        </Button>
      </div>

      <Dialog open={dialogContent === "topup"} onOpenChange={() => setDialogContent(null)}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Top Up Selected Accounts</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                You are about to top up {selectedAccounts.length} accounts.
              </p>
              <div className="bg-secondary/20 p-3 rounded-md mb-4">
                <p className="text-sm">Selected accounts: {selectedAccounts.length}</p>
                <p className="text-sm">Total current balance: ${totalBalance.toFixed(2)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Amount per account</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-9 bg-secondary/50 border-border"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Total amount: ${(Number.parseFloat(amount || "0") * selectedAccounts.length).toFixed(2)}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setDialogContent(null)}
                className="border-border bg-secondary/50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleTopUp}
                className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black"
                disabled={!amount || Number.parseFloat(amount) <= 0}
              >
                Top Up
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogContent === "withdraw"} onOpenChange={() => setDialogContent(null)}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw From Selected Accounts</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                You are about to withdraw from {selectedAccounts.length} accounts.
              </p>
              <div className="bg-secondary/20 p-3 rounded-md mb-4">
                <p className="text-sm">Selected accounts: {selectedAccounts.length}</p>
                <p className="text-sm">Total current balance: ${totalBalance.toFixed(2)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Amount or percentage</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value)
                      setPercentage("")
                    }}
                    className="pl-9 bg-secondary/50 border-border"
                  />
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="Percentage"
                    value={percentage}
                    onChange={(e) => {
                      setPercentage(e.target.value)
                      setAmount("")
                    }}
                    className="pr-8 bg-secondary/50 border-border"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {percentage
                  ? `Total amount: $${((Number.parseFloat(percentage || "0") / 100) * totalBalance).toFixed(2)}`
                  : `Total amount: $${(Number.parseFloat(amount || "0") * selectedAccounts.length).toFixed(2)}`}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setDialogContent(null)}
                className="border-border bg-secondary/50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleWithdraw}
                className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black"
                disabled={
                  (!amount || Number.parseFloat(amount) <= 0) && (!percentage || Number.parseFloat(percentage) <= 0)
                }
              >
                Withdraw
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
