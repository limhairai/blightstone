"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, ChevronRight, BarChart3, Edit, Trash2, Wallet } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AccountTopUpDialog } from "@/components/wallet/account-top-up-dialog"
import { cn } from "@/lib/utils"

interface Account {
  id: string
  name: string
  status: "active" | "pending" | "disabled"
  balance: string
  spendLimit: string
  dateAdded: string
}

interface AccountsCardGridProps {
  accounts: Account[]
  onViewAccount?: (id: string) => void
}

export function AccountsCardGrid({ accounts, onViewAccount }: AccountsCardGridProps) {
  const [isTopUpDialogOpen, setIsTopUpDialogOpen] = useState(false);
  const [selectedAccountForTopUp, setSelectedAccountForTopUp] = useState<Account | null>(null);

  const openTopUpDialog = (account: Account) => {
    setSelectedAccountForTopUp(account);
    setIsTopUpDialogOpen(true);
  };

  const closeTopUpDialog = () => {
    setSelectedAccountForTopUp(null);
    setIsTopUpDialogOpen(false);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {accounts.map((account) => (
          <Card
            key={account.id}
            className="bg-card border border-border hover:border-primary transition-colors flex flex-col justify-between"
          >
            <CardContent className="p-5 pb-2">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-medium text-lg truncate">{account.name}</h3>
                  <p className="text-xs text-[#6C6C6C] mt-1">ID: {account.id}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#0a0a0a] border-[#1A1A1A]">
                    <DropdownMenuItem
                      className="hover:bg-[#1A1A1A] cursor-pointer"
                      onClick={() => onViewAccount?.(account.id)}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-[#1A1A1A] cursor-pointer">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Account
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-[#1A1A1A] text-red-400 cursor-pointer">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#6C6C6C]">Status</span>
                  <Badge
                    variant={account.status === "active" ? "default" : "outline"}
                    className={cn(
                      account.status === "active"
                        ? "bg-green-500/20 text-green-500 border-green-500"
                        : account.status === "pending"
                          ? "bg-yellow-500/10 text-yellow-500 border-yellow-500"
                          : "bg-red-500/10 text-red-500 border-red-500",
                    )}
                  >
                    {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#6C6C6C]">Balance</span>
                  <span className="font-semibold">{account.balance}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#6C6C6C]">Spend Limit</span>
                  <span className="font-semibold">{account.spendLimit}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#6C6C6C]">Date Added</span>
                  <span className="text-sm">{account.dateAdded}</span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-4 pt-2 flex justify-between gap-2">
              <Button 
                size="sm" 
                className="flex-1 bg-gradient-to-r from-[#b19cd9] to-[#f8c4b4] text-black hover:opacity-90"
                onClick={() => openTopUpDialog(account)}
              >
                <Wallet className="h-4 w-4 mr-2" />
                Top Up
              </Button>

              <Button variant="secondary" size="sm" className="flex-1" onClick={() => onViewAccount?.(account.id)}>
                View Details
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      {selectedAccountForTopUp && (
        <AccountTopUpDialog
          isOpen={isTopUpDialogOpen}
          onClose={closeTopUpDialog}
          accountId={selectedAccountForTopUp.id}
          accountName={selectedAccountForTopUp.name}
          currentBalance={selectedAccountForTopUp.balance}
        />
      )}
    </>
  )
} 