"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, ExternalLink, Settings, Wallet } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AccountTopUpDialog } from "./account-top-up-dialog"
import { cn } from "@/lib/utils"

interface AccountCardProps {
  name: string
  accountId: string
  status: "active" | "pending" | "disabled"
  balance: string
  spendLimit: string
  dateAdded: string
  onViewDetails?: () => void
}

export function AccountCard({
  name,
  accountId,
  status,
  balance,
  spendLimit,
  dateAdded,
  onViewDetails,
}: AccountCardProps) {
  // No performance data or rendering of performance metrics anywhere in this component

  return (
    <Card className="bg-[#0f0a14] border-[#2C2C2E] hover:border-[#b19cd9] transition-colors">
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-medium text-lg truncate">{name}</h3>
            <p className="text-xs text-[#6C6C6C] mt-1">ID: {accountId}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#0f0a14] border-[#1A1A1A]">
              <DropdownMenuItem className="hover:bg-[#1A1A1A] cursor-pointer" onClick={onViewDetails}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-[#1A1A1A] cursor-pointer">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#6C6C6C]">Status</span>
            <Badge
              variant={status === "active" ? "default" : "outline"}
              className={cn(
                status === "active"
                  ? "bg-green-500/20 text-green-500 border-green-500"
                  : status === "pending"
                    ? "bg-yellow-500/10 text-yellow-500 border-yellow-500"
                    : "bg-red-500/10 text-red-500 border-red-500",
              )}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-[#6C6C6C]">Balance</span>
            <span className="font-semibold">{balance}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-[#6C6C6C]">Spend Limit</span>
            <span className="font-semibold">{spendLimit}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-[#6C6C6C]">Date Added</span>
            <span className="text-sm">{dateAdded}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex justify-between gap-2">
        <Button
          className="flex-1 bg-gradient-to-r from-[#b19cd9] to-[#f8c4b4] text-black hover:opacity-90"
          size="sm"
          asChild
        >
          <AccountTopUpDialog accountId={accountId} accountName={name} currentBalance={balance}>
            <div className="flex items-center justify-center">
              <Wallet className="h-4 w-4 mr-2" />
              Top Up
            </div>
          </AccountTopUpDialog>
        </Button>

        <Button variant="secondary" size="sm" className="flex-1" onClick={onViewDetails}>
          View Details
        </Button>
      </CardFooter>
    </Card>
  )
}
