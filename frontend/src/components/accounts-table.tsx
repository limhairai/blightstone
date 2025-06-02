"use client"

import { MoreHorizontal, Edit, ExternalLink, Archive, Trash2, AlertCircle, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { AccountTopUpDialog } from "@/components/account-top-up-dialog"
import { StatusBadge } from "@/components/status-badge"
import { StatusDot } from "@/components/status-dot"

interface Account {
  id: string
  name: string
  accountId: string
  status: string
  users?: number
  billings?: number
  type?: string
  partner?: string
  currency?: string
  ads?: number
  estimated?: string
  holds?: string
  balance: string | number
  totalSpend?: string | number
  spendToday?: string | number
  hasIssues?: boolean
  spendLimit?: string
  dateAdded?: string
  performance?: string
}

interface AccountsTableProps {
  accounts: Account[]
  selectedAccounts: string[]
  onSelectAccount: (accountId: string, checked: boolean) => void
  onSelectAll: (checked: boolean) => void
}

export function AccountsTable({ accounts, selectedAccounts, onSelectAccount, onSelectAll }: AccountsTableProps) {
  return (
    <div className="w-full overflow-auto bg-white dark:bg-transparent rounded-md border border-[#eaecf0] dark:border-[#222222] shadow-sm">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#eaecf0] dark:border-[#222222] bg-[#f9fafb] dark:bg-transparent">
            <th className="px-4 py-3 text-left">
              <Checkbox
                checked={accounts.length > 0 && selectedAccounts.length === accounts.length}
                onCheckedChange={onSelectAll}
                aria-label="Select all accounts"
                className="rounded-sm data-[state=checked]:bg-[#6941c6] data-[state=checked]:border-[#6941c6] dark:data-[state=checked]:bg-[#b4a0ff] dark:data-[state=checked]:border-[#b4a0ff]"
              />
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-[#667085] dark:text-[#888888]">Name</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-[#667085] dark:text-[#888888]">Ad Account</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-[#667085] dark:text-[#888888]">Status</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-[#667085] dark:text-[#888888]">Balance</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-[#667085] dark:text-[#888888]">Spend Limit</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-[#667085] dark:text-[#888888]">Date Added</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-[#667085] dark:text-[#888888]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <tr
              key={account.id}
              className="border-b border-[#eaecf0] dark:border-[#222222] hover:bg-[#f9fafb] dark:hover:bg-[#1A1A1A]"
            >
              <td className="px-4 py-3">
                <Checkbox
                  checked={selectedAccounts.includes(account.id)}
                  onCheckedChange={(checked) => onSelectAccount(account.id, !!checked)}
                  aria-label={`Select ${account.name}`}
                  className="rounded-sm data-[state=checked]:bg-[#6941c6] data-[state=checked]:border-[#6941c6] dark:data-[state=checked]:bg-[#b4a0ff] dark:data-[state=checked]:border-[#b4a0ff]"
                />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {account.hasIssues && <AlertCircle className="h-4 w-4 text-[#d92d20] dark:text-red-400" />}
                  <span className="font-medium text-[#101828] dark:text-white">{account.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-[#667085] dark:text-[#888888]">{account.accountId}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <StatusDot status={account.status as any} />
                  <StatusBadge status={account.status as any} size="sm" />
                </div>
              </td>
              <td className="px-4 py-3 font-medium text-[#101828] dark:text-white">
                {typeof account.balance === "number" ? `$${account.balance.toFixed(2)}` : account.balance}
              </td>
              <td className="px-4 py-3 text-[#667085] dark:text-[#888888]">{account.spendLimit}</td>
              <td className="px-4 py-3 text-[#667085] dark:text-[#888888]">{account.dateAdded}</td>
              <td className="px-4 py-3">
                <div className="flex items-center space-x-2">
                  <AccountTopUpDialog
                    accountId={account.accountId}
                    accountName={account.name}
                    currentBalance={
                      typeof account.balance === "number" ? `$${account.balance.toFixed(2)}` : account.balance
                    }
                  >
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-[#9e77ed] to-[#f9a8d4] text-black hover:opacity-90"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Top Up
                    </Button>
                  </AccountTopUpDialog>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[#667085] hover:text-[#101828] hover:bg-[#f9fafb] dark:text-[#888888] dark:hover:text-white dark:hover:bg-[#222222]"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-white dark:bg-[#0a0a0a] border-[#eaecf0] dark:border-[#222222]"
                    >
                      <DropdownMenuItem className="hover:bg-[#f9fafb] dark:hover:bg-[#222222]">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open in Meta
                      </DropdownMenuItem>
                      <DropdownMenuItem className="hover:bg-[#f9fafb] dark:hover:bg-[#222222]">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Account
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-[#eaecf0] dark:bg-[#222222]" />
                      <DropdownMenuItem className="hover:bg-[#f9fafb] dark:hover:bg-[#222222]">
                        <Archive className="h-4 w-4 mr-2" />
                        Archive Account
                      </DropdownMenuItem>
                      <DropdownMenuItem className="hover:bg-[#f9fafb] dark:hover:bg-[#222222] text-[#d92d20] dark:text-red-400">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
