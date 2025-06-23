"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog"
import { Button } from "../ui/button"
import { Checkbox } from "../ui/checkbox"
import { ScrollArea } from "../ui/scroll-area"
import { formatCurrency } from "../../lib/mock-data"
import { ArrowUpDown, Info } from 'lucide-react'
import { useAppData } from "../../contexts/AppDataContext"
import React from "react"

interface ConsolidateFundsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface AdAccountSelection {
  id: string
  name: string
  business: string
  balance: number
  selected: boolean
}

export function ConsolidateFundsDialog({ open, onOpenChange }: ConsolidateFundsDialogProps) {
  const { state, consolidateFunds } = useAppData()
  
  // Convert ad accounts to selection format, only include accounts with balance > 0
  const [adAccounts, setAdAccounts] = useState<AdAccountSelection[]>(() => 
    state.accounts
      .filter(account => account.balance > 0) // Only show accounts with funds to consolidate
      .map(account => ({
        id: account.id.toString(),
        name: account.name,
        business: account.businessId?.toString() || 'Unknown',
        balance: account.balance,
        selected: true // Default to selected
      }))
  )

  const [isLoading, setIsLoading] = useState(false)

  // Update ad accounts when state changes
  React.useEffect(() => {
    setAdAccounts(
      state.accounts
        .filter(account => account.balance > 0)
        .map(account => ({
          id: account.id.toString(),
          name: account.name,
          business: account.businessId?.toString() || 'Unknown',
          balance: account.balance,
          selected: adAccounts.find(acc => acc.id === account.id.toString())?.selected ?? true
        }))
    )
  }, [state.accounts])

  // Toggle selection of an ad account
  const toggleAccountSelection = (id: string) => {
    setAdAccounts(
      adAccounts.map((account) =>
        account.id === id ? { ...account, selected: !account.selected } : account
      )
    )
  }

  // Toggle all ad accounts
  const toggleAllAccounts = (selected: boolean) => {
    setAdAccounts(
      adAccounts.map((account) => ({ ...account, selected }))
    )
  }

  // Calculate total amount to consolidate
  const totalToConsolidate = adAccounts
    .filter((account) => account.selected)
    .reduce((sum, account) => sum + account.balance, 0)

  // Handle consolidation
  const handleConsolidate = async () => {
    if (totalToConsolidate <= 0) return

    const selectedAccountIds = adAccounts
      .filter((account) => account.selected)
      .map((account) => parseInt(account.id)) // Convert string IDs to numbers

    if (selectedAccountIds.length === 0) return

    try {
      setIsLoading(true)
      
      // Use the context method to consolidate funds
      await consolidateFunds(selectedAccountIds)
      
      // Success - close dialog
      onOpenChange(false)
    } catch (error) {
      console.error('Consolidation failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto bg-card dark:bg-gradient-to-br dark:from-[#111111] dark:to-[#0a0a0a] border-border dark:border-[#222222]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-transparent bg-clip-text">
            Consolidate Funds
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            <p>Consolidate funds from ad accounts to your main wallet</p>
          </div>

          {adAccounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No ad accounts with funds available to consolidate.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={adAccounts.every((account) => account.selected)}
                    onCheckedChange={(checked) => toggleAllAccounts(!!checked)}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium">
                    Select all accounts
                  </label>
                </div>
                <span className="text-sm text-muted-foreground">
                  {adAccounts.filter((account) => account.selected).length} of {adAccounts.length} selected
                </span>
              </div>

              <ScrollArea className="h-[240px] rounded-md border border-border p-2">
                <div className="space-y-2">
                  {adAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50"
                    >
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`account-${account.id}`}
                          checked={account.selected}
                          onCheckedChange={() => toggleAccountSelection(account.id)}
                        />
                        <div>
                          <label htmlFor={`account-${account.id}`} className="text-sm font-medium block">
                            {account.name}
                          </label>
                          <span className="text-xs text-muted-foreground">{account.business}</span>
                        </div>
                      </div>
                      <span className="text-sm font-medium">${formatCurrency(account.balance)}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="bg-muted/30 p-3 rounded-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total to consolidate</span>
                  <span className="text-lg font-semibold">${formatCurrency(totalToConsolidate)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black font-medium"
            disabled={totalToConsolidate <= 0 || isLoading || adAccounts.length === 0}
            onClick={handleConsolidate}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span>Processing...</span>
              </div>
            ) : (
              <>
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Consolidate ${formatCurrency(totalToConsolidate)}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
