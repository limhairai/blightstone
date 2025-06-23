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
import { CircularProgress } from "../ui/circular-progress"
import { Bell, Globe, ExternalLink, CreditCard, Building2 } from "lucide-react"
import { User, Settings, Moon, Sun, Monitor, LogOut, Zap } from "lucide-react"
import { usePageTitle } from "../core/simple-providers"
import { useAuth } from "../../contexts/AuthContext"
import { useAppData } from "../../contexts/AppDataContext"
import { useTheme } from "next-themes"
import Link from "next/link"
import { formatCurrency } from "../../lib/mock-data"
import { useState, useEffect } from "react"
import { gradientTokens } from "../../lib/design-tokens"
import { useRouter } from "next/navigation"

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
  const { state } = useAppData()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

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
  const userProfile = state.userProfile
  const userInitial = userProfile?.name ? userProfile.name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2) : 'DA'
  const userEmail = userProfile?.email || 'admin@adhub.tech'
  const userName = userProfile?.name || 'Demo Admin'

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
            <CircularProgress percentage={setupPercentage} size={16} />
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

        {/* Connect Account Button */}
        <Button
          variant="outline"
          size="sm"
          className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-md border-border ${gradientTokens.light} hover:opacity-80`}
        >
          <Globe className="h-4 w-4 text-[#b4a0ff]" />
          <span className="font-medium text-foreground">Connect Account</span>
          <ExternalLink className="h-3.5 w-3.5 ml-1 opacity-70" />
        </Button>

        {/* Main Account Balance & Top Up - Now with real-time data */}
        <div className="hidden md:flex bg-muted rounded-full px-4 py-1.5 items-center border border-border">
          <span className="text-sm font-medium text-foreground">
            ${formatCurrency(state.financialData.totalBalance)}
          </span>
        </div>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent">
              <Avatar className="h-8 w-8">
                <AvatarImage src={userProfile?.avatar} alt="User" />
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
                <p className="text-xs text-muted-foreground">{state.currentOrganization?.plan || 'Free'} Plan</p>
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
              <DropdownMenuItem className="text-popover-foreground hover:bg-accent px-4 py-2" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </div>

            <div className="p-2 border-t border-border">
              <Button
                className={gradientTokens.primary}
                size="sm"
              >
                <Zap className="h-4 w-4 mr-2" />
                Upgrade to Pro
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
