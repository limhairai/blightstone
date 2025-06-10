"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CircularProgress } from "@/components/ui/circular-progress"
import { CompactHeaderMetrics } from "@/components/dashboard/compact-header-metrics"
import { OrganizationSelector } from "@/components/dashboard/organization-selector"
import { TopUpDialog } from "@/components/dashboard/top-up-dialog"
import { MOCK_FINANCIAL_DATA } from "@/lib/mock-data"
import { formatCurrency } from "@/lib/format"
import { Bell, Plus, User, Settings, LogOut, Wallet } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Topbar() {
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false)

  // Calculate setup progress (this could come from user profile data)
  const setupSteps = {
    completed: 3,
    total: 5,
  }
  const setupProgress = (setupSteps.completed / setupSteps.total) * 100

  return (
    <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left side - Organization selector and metrics */}
        <div className="flex items-center gap-6">
          <OrganizationSelector />
          <CompactHeaderMetrics />
        </div>

        {/* Right side - Actions and user menu */}
        <div className="flex items-center gap-4">
          {/* Setup Progress */}
          <div className="flex items-center gap-3">
            <CircularProgress 
              percentage={setupProgress} 
              size={32}
            />
            <div className="text-sm">
              <div className="font-medium text-foreground">Setup Progress</div>
              <div className="text-muted-foreground">{setupProgress}% complete</div>
            </div>
          </div>

          {/* Main Balance */}
          <div className="hidden md:flex bg-muted rounded-full px-4 py-1.5 items-center border border-border">
            <span className="text-sm font-medium text-foreground">
              ${formatCurrency(MOCK_FINANCIAL_DATA.walletBalance)}
            </span>
          </div>

          {/* Top Up Button */}
          <Button
            onClick={() => setTopUpDialogOpen(true)}
            className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Top Up
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative hover:bg-accent">
            <Bell className="h-5 w-5 text-foreground" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
              3
            </span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-accent">
                <User className="h-5 w-5 text-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
              <div className="px-3 py-2 border-b border-border">
                <div className="font-medium text-popover-foreground">John Doe</div>
                <div className="text-sm text-muted-foreground">john@example.com</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Balance: ${formatCurrency(MOCK_FINANCIAL_DATA.walletBalance)}
                </div>
              </div>
              <DropdownMenuItem className="text-popover-foreground hover:bg-accent">
                <Wallet className="h-4 w-4 mr-2" />
                Wallet
              </DropdownMenuItem>
              <DropdownMenuItem className="text-popover-foreground hover:bg-accent">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem className="text-popover-foreground hover:bg-accent">
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Top Up Dialog */}
      <TopUpDialog
        account={null} // For main wallet top-up
        open={topUpDialogOpen}
        onOpenChange={setTopUpDialogOpen}
        mainBalance={MOCK_FINANCIAL_DATA.walletBalance}
      />
    </div>
  )
}
