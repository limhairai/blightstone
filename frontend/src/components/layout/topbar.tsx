"use client"

import { Button } from "../ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"

import { Bell, Globe, ExternalLink, CreditCard, Building2 } from "lucide-react"
import { User, Settings, Moon, Sun, Monitor, LogOut, Zap, Shield } from "lucide-react"
import { usePageTitle } from "../core/simple-providers"
import { useAuth } from "../../contexts/AuthContext"
import { useTheme } from "next-themes"
import Link from "next/link"
import { formatCurrency } from "../../utils/format"
import { useState, useEffect } from "react"
import { gradientTokens } from "../../lib/design-tokens"
import { useRouter } from "next/navigation"
import { useOrganizationStore } from '@/lib/stores/organization-store'
import useSWR from 'swr'
import { useCurrentOrganization } from '@/lib/swr-config'
import { useSubscription } from '@/hooks/useSubscription'
import { useAdminRoute } from '@/hooks/useAdminRoute'

import { PlanUpgradeDialog } from '../pricing/plan-upgrade-dialog'

interface TopbarProps {
  isAdmin?: boolean
  hasNotifications?: boolean
  setupWidgetState?: "expanded" | "collapsed" | "closed"
  onSetupWidgetStateChange?: (state: "expanded" | "collapsed" | "closed") => void
  showEmptyStateElements?: boolean
  setupProgress?: {
    emailVerification: { completed: boolean }
    walletFunding: { completed: boolean }
    businessSetup: { completed: boolean }
    adAccountSetup: { completed: boolean }
  }
}

export function Topbar({ 
  isAdmin = false, 
  hasNotifications = false,
  setupWidgetState,
  onSetupWidgetStateChange,
  showEmptyStateElements = true,
  setupProgress
}: TopbarProps) {
  const { pageTitle } = usePageTitle()
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  const router = useRouter()
  const { canViewAdmin } = useAdminRoute()

  const { currentOrganizationId } = useOrganizationStore();
  // Use the proper authenticated hook
  const { data: orgData, isLoading: isOrgLoading } = useCurrentOrganization(currentOrganizationId);
  const organization = orgData?.organizations?.[0];
  const totalBalance = organization?.balance_cents ? organization.balance_cents / 100 : 0;
  
  // Use subscription hook for plan data
  const { currentPlan, isLoading: isSubscriptionLoading } = useSubscription();
  const planName = currentPlan?.name || 'Free';

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate setup progress percentage
  const calculateSetupProgress = () => {
    if (!setupProgress) return 75
    const completed = Object.values(setupProgress).filter(item => item.completed).length
    return Math.round((completed / Object.keys(setupProgress).length) * 100)
  }

  const setupPercentage = calculateSetupProgress()

  // Use real user data from demo state
  const userInitial = user?.user_metadata?.name ? user.user_metadata.name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2) : 'AD'
  const userEmail = user?.email || ''
  const userName = user?.user_metadata?.name || 'User'
  const userAvatar = user?.user_metadata?.avatar_url

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
  }

  return (
    <div className="sticky top-0 z-50 h-16 border-b border-border/20 flex items-center justify-between px-3 md:px-4 bg-card/80 backdrop-blur-md">
      {/* Left: Page Title */}
      <div className="flex items-center gap-3 ml-4">
        <h1 className="text-xl font-semibold text-foreground">{pageTitle}</h1>
      </div>
      
      {/* Right: Controls */}
      <div className="flex items-center gap-2 md:gap-3 ml-auto">
        {/* Setup Guide Button with Circular Progress */}
        {showEmptyStateElements && (
          <Button
            variant="outline"
            size="sm"
            className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-md border-border ${gradientTokens.light} hover:opacity-80`}
            onClick={() => onSetupWidgetStateChange?.(setupWidgetState === "expanded" ? "collapsed" : "expanded")}
          >
                            <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
            <span className="font-medium text-foreground">Setup Guide</span>
          </Button>
        )}
        
        {/* Notification Bell */}
        <Button variant="ghost" size="icon" className="relative hover:bg-accent">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {hasNotifications && (
            <span className={`absolute top-1 right-1 w-2 h-2 ${gradientTokens.primary.replace('bg-gradient-to-r', 'bg-gradient-to-r').replace('hover:opacity-90 text-black', '')} rounded-full`} />
          )}
        </Button>


        {/* Main Account Balance & Top Up - Now with real-time data */}
        <div className="hidden md:flex bg-muted rounded-full px-4 py-1.5 items-center border border-border">
          <span className="text-sm font-medium text-foreground">
            {isOrgLoading ? "..." : formatCurrency(totalBalance)}
          </span>
        </div>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent">
              <Avatar className="h-8 w-8">
                <AvatarImage src={userAvatar} alt="User" />
                <AvatarFallback className={gradientTokens.avatar}>
                  {userInitial}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 bg-popover border-border p-0">
            <div className="px-4 py-3 border-b border-border">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-popover-foreground">{userName}</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
                <p className="text-xs text-muted-foreground">{isSubscriptionLoading ? "..." : planName} Plan</p>
              </div>
            </div>

            <div className="py-2">
              <Link href="/dashboard/settings/account">
                <DropdownMenuItem className="text-popover-foreground hover:bg-accent px-4 py-2">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
              </Link>
              <Link href="/dashboard/settings">
                <DropdownMenuItem className="text-popover-foreground hover:bg-accent px-4 py-2">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
              </Link>
            </div>

            <DropdownMenuSeparator className="bg-border" />

            <div className="py-2">
              <DropdownMenuItem className="text-popover-foreground hover:bg-accent px-4 py-2">
                <Moon className="h-4 w-4 mr-2" />
                Theme
                <div className="ml-auto flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-6 w-6 rounded-sm ${theme === 'system' ? 'bg-accent' : ''}`}
                    onClick={() => handleThemeChange('system')}
                  >
                    <Monitor className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-6 w-6 rounded-sm ${theme === 'light' ? 'bg-accent' : ''}`}
                    onClick={() => handleThemeChange('light')}
                  >
                    <Sun className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-6 w-6 rounded-sm ${theme === 'dark' ? 'bg-accent' : ''}`}
                    onClick={() => handleThemeChange('dark')}
                  >
                    <Moon className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </DropdownMenuItem>
            </div>

            <DropdownMenuSeparator className="bg-border" />

            <div className="py-2">
              {/* Admin Panel Access - Only show for users with admin permissions */}
              {canViewAdmin && (
                <DropdownMenuItem
                  className="text-popover-foreground hover:bg-accent px-4 py-2"
                  onClick={() => router.push('/admin')}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Go to Admin Panel
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-popover-foreground hover:bg-accent px-4 py-2" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </div>

            <div className="p-2 border-t border-border">
              <Button
                className="w-full bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black border-0"
                size="sm"
                onClick={() => setUpgradeDialogOpen(true)}
              >
                <Zap className="h-4 w-4 mr-2" />
                {currentPlan?.id !== 'free' ? 'Upgrade Plan' : 'Choose Plan'}
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

                          <PlanUpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
      />
    </div>
  )
}
