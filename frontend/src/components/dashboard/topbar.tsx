"use client"

import { useState } from "react"
import useSWR from 'swr'
import { Button } from "../ui/button"

import { CompactHeaderMetrics } from "./compact-header-metrics"
import { OrganizationSelector } from "../organization/organization-selector"
import { TopUpDialog } from "./top-up-dialog"
import { useAuth } from "../../contexts/AuthContext"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { formatCurrency } from "@/lib/utils"
import { Bell, Plus, User, Settings, LogOut, Wallet, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function Topbar() {
  const { user } = useAuth()
  const { currentOrganizationId } = useOrganizationStore();
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false)

  const { data: orgData, isLoading: isOrgLoading } = useSWR(
    currentOrganizationId ? `/api/organizations?id=${currentOrganizationId}` : null,
    fetcher
  );
  const { data: bizData, isLoading: isBizLoading } = useSWR(
    currentOrganizationId ? `/api/businesses?organization_id=${currentOrganizationId}` : null,
    fetcher
  );
  const { data: accData, isLoading: isAccLoading } = useSWR(
    currentOrganizationId ? `/api/ad-accounts?organization_id=${currentOrganizationId}` : null,
    fetcher
  );

  const walletBalance = orgData?.organizations?.[0]?.balance_cents / 100 ?? 0;
  const businessesCount = bizData?.businesses?.length ?? 0;
  const accountsCount = accData?.accounts?.length ?? 0;
  const isLoading = isOrgLoading || isBizLoading || isAccLoading;

  // Calculate setup progress (this could come from user profile data)
  const setupSteps = {
    completed: (user?.email_confirmed_at ? 1 : 0) + (walletBalance > 0 ? 1 : 0) + (businessesCount > 0 ? 1 : 0) + (accountsCount > 0 ? 1 : 0),
    total: 4,
  }
  const setupProgress = (setupSteps.completed / setupSteps.total) * 100

  // Get user info
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const userEmail = user?.email || ''

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
            <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
            <div className="text-sm">
              <div className="font-medium text-foreground">Setup Progress</div>
              <div className="text-muted-foreground">{setupProgress.toFixed(0)}% complete</div>
            </div>
          </div>

          {/* Main Balance */}
          <div className="hidden md:flex bg-muted rounded-full px-4 py-1.5 items-center border border-border min-w-[80px] justify-center">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <span className="text-sm font-medium text-foreground">
                {formatCurrency(walletBalance)}
              </span>
            )}
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
                <div className="font-medium text-popover-foreground">{userName}</div>
                <div className="text-sm text-muted-foreground">{userEmail}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Balance: {isLoading ? '...' : formatCurrency(walletBalance)}
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
        mainBalance={walletBalance}
      />
    </div>
  )
}
