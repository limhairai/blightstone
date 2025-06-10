"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MOCK_ACCOUNTS } from "@/data/mock-accounts"
import { formatCurrency } from "@/utils/format"

interface ConsolidateFundsProps {
  onConsolidate: () => void
}

export function ConsolidateFunds({ onConsolidate }: ConsolidateFundsProps) {
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [targetAccount, setTargetAccount] = useState("")
  const [selectAll, setSelectAll] = useState(false)

  // Use existing mock accounts with balance
  const accountsWithBalance = MOCK_ACCOUNTS.filter((account) => account.balance > 0).slice(0, 6)

  // Handle selecting all accounts
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedAccounts(accountsWithBalance.map((account) => account.id.toString()))
    } else {
      setSelectedAccounts([])
    }
  }

  // Handle selecting an individual account
  const handleSelectAccount = (accountId: string, checked: boolean) => {
    if (checked) {
      setSelectedAccounts([...selectedAccounts, accountId])
    } else {
      setSelectedAccounts(selectedAccounts.filter((id) => id !== accountId))
    }
  }

  // Calculate total amount to be consolidated
  const totalAmount = accountsWithBalance
    .filter((account) => selectedAccounts.includes(account.id.toString()))
    .reduce((sum, account) => sum + account.balance, 0)

  // Filter out accounts that are selected as source for the target dropdown
  const getAvailableTargetAccounts = () => {
    // Include main wallet and accounts not selected as sources
    return [
      { id: "main", name: "Main Wallet", balance: 0, status: "active" },
      ...accountsWithBalance.filter((account) => !selectedAccounts.includes(account.id.toString())),
    ]
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onConsolidate()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>From</Label>
        <div className="border border-border dark:border-[#222222] rounded-md overflow-hidden max-h-[240px] overflow-y-auto">
          <Table>
            <TableHeader className="bg-muted/50 dark:bg-[#111111] sticky top-0 z-10">
              <TableRow className="border-b-border dark:border-b-[#222222] hover:bg-transparent">
                <TableHead className="w-8 py-2">
                  <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} aria-label="Select all accounts" />
                </TableHead>
                <TableHead className="text-muted-foreground py-2">Account</TableHead>
                <TableHead className="text-muted-foreground text-right py-2">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accountsWithBalance.map((account) => (
                <TableRow
                  key={account.id}
                  className="border-b-border dark:border-b-[#222222] hover:bg-muted/50 dark:hover:bg-[#111111]/50"
                >
                  <TableCell className="py-1.5">
                    <Checkbox
                      checked={selectedAccounts.includes(account.id.toString())}
                      onCheckedChange={(checked) => handleSelectAccount(account.id.toString(), !!checked)}
                      aria-label={`Select ${account.name}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium py-1.5">{account.name}</TableCell>
                  <TableCell className="text-right py-1.5">${formatCurrency(account.balance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="space-y-2">
        <Label>To</Label>
        <Select value={targetAccount} onValueChange={setTargetAccount}>
          <SelectTrigger className="bg-background dark:bg-[#111111] border-border dark:border-[#222222]">
            <SelectValue placeholder="Select target account" />
          </SelectTrigger>
          <SelectContent>
            {getAvailableTargetAccounts().map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name} {account.id !== "main" && `($${formatCurrency(account.balance)})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">Total amount to consolidate:</span>
        <span className="text-[#a0ffb4] dark:text-[#a0ffb4] text-emerald-600">${formatCurrency(totalAmount)}</span>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black"
          disabled={selectedAccounts.length === 0 || !targetAccount}
        >
          Consolidate
        </Button>
      </div>
    </form>
  )
}
