"use client"

import { useState } from "react"
import { MoreHorizontal, Settings, Wallet, Filter, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge, type StatusType } from "@/components/core/status-badge"
import { StatusDot } from "@/components/core/status-dot"
import { AccountsTable } from "@/components/accounts/accounts-table"
import { AccountsCardGrid } from "./accounts-card-grid"
import { AccountsFilter } from "./accounts-filter"
import { ViewToggle } from "@/components/ui/view-toggle"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreateAdAccountDialog } from "./create-ad-account-dialog"

interface Account {
  id: string
  name: string
  accountId: string
  project: string
  status: "active" | "pending" | "inactive" | "suspended"
  balance: number
  spendLimit: number
  dateAdded: string
  quota: number
}

export function AccountsTab() {
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])

  // Mock data from accountspage2.txt
  const accounts: Account[] = [
    { id: "1", name: "Meta Ads Primary", accountId: "123456789", project: "Marketing Campaigns", status: "active", balance: 1250.0, spendLimit: 5000.0, dateAdded: "04/15/2025", quota: 58, },
    { id: "2", name: "Google Ads Main", accountId: "987654321", project: "Marketing Campaigns", status: "active", balance: 3750.0, spendLimit: 10000.0, dateAdded: "04/10/2025", quota: 84, },
    { id: "3", name: "TikTok Campaign", accountId: "456789123", project: "Social Media", status: "pending", balance: 0.0, spendLimit: 2500.0, dateAdded: "04/18/2025", quota: 0, },
    { id: "4", name: "Meta Ads Promotions", accountId: "789123456", project: "Product Launch", status: "active", balance: 947.05, spendLimit: 3000.0, dateAdded: "04/05/2025", quota: 32, },
    { id: "5", name: "Meta Ads Marketing", accountId: "654321987", project: "Brand Awareness", status: "inactive", balance: 920.6, spendLimit: 4000.0, dateAdded: "03/28/2025", quota: 23, },
  ]

  const handleSelectAccount = (accountId: string, checked: boolean) => {
    if (checked) {
      setSelectedAccounts([...selectedAccounts, accountId])
    } else {
      setSelectedAccounts(selectedAccounts.filter((id) => id !== accountId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAccounts(accounts.map((account) => account.id))
    } else {
      setSelectedAccounts([])
    }
  }

  // Get threshold color based on percentage
  const getThresholdColor = (quota: number) => {
    if (quota === 0) return "text-gray-400"
    if (quota < 60) return "text-[#34D197]"
    if (quota < 80) return "text-[#FFC857]"
    return "text-[#F56565]"
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Ad Accounts</h2>
      </div>

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left">
                  <Checkbox
                    checked={accounts.length > 0 && selectedAccounts.length === accounts.length}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  />
                </th>
                <th className="p-3 text-left font-medium">Name</th>
                <th className="p-3 text-left font-medium">Project</th>
                <th className="p-3 text-left font-medium">Ad Account</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="p-3 text-left font-medium">Balance</th>
                <th className="p-3 text-left font-medium">Spend Limit</th>
                <th className="p-3 text-left font-medium">Date Added</th>
                <th className="p-3 text-left font-medium">Threshold</th>
                <th className="p-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="border-b hover:bg-muted/50">
                  <td className="p-3">
                    <Checkbox
                      checked={selectedAccounts.includes(account.id)}
                      onCheckedChange={(checked) => handleSelectAccount(account.id, !!checked)}
                    />
                  </td>
                  <td className="p-3 font-medium">
                    {account.name}
                    <div className="text-xs text-muted-foreground">{account.accountId.substring(0, 4)}</div>
                  </td>
                  <td className="p-3">{account.project}</td>
                  <td className="p-3 font-mono text-xs">{account.accountId}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <StatusDot status={account.status} />
                      <StatusBadge status={account.status} size="sm" />
                    </div>
                  </td>
                  <td className="p-3 font-medium">${account.balance.toFixed(2)}</td>
                  <td className="p-3">${account.spendLimit.toFixed(2)}</td>
                  <td className="p-3">{account.dateAdded}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="relative h-2 w-16 rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className={`absolute left-0 top-0 h-full rounded-full ${
                            account.quota === 0
                              ? "bg-gray-400"
                              : account.quota < 60
                                ? "bg-[#34D197]"
                                : account.quota < 80
                                  ? "bg-[#FFC857]"
                                  : "bg-[#F56565]"
                          }`}
                          style={{ width: `${account.quota}%` }}
                        />
                      </div>
                      <span className={getThresholdColor(account.quota)}>{account.quota}%</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View details</DropdownMenuItem>
                        <DropdownMenuItem>Edit account</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Top up</DropdownMenuItem>
                        <DropdownMenuItem>Pause account</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
