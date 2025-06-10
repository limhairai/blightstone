"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CircularProgress } from "@/components/circular-progress"
import { Bell, Globe, ExternalLink } from "lucide-react"
import { User, Settings, Moon, Sun, Monitor, LogOut, Zap } from "lucide-react"

interface TopbarProps {
  pageTitle?: string
  showEmptyStateElements?: boolean
  setupProgress?: number
}

export function Topbar({ pageTitle = "Ad Accounts", showEmptyStateElements = true, setupProgress = 75 }: TopbarProps) {
  const hasNotifications = true
  const userInitial = "J"
  const userEmail = "john@example.com"

  const signOut = () => {
    console.log("Sign out")
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
            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-md border-border bg-gradient-to-r from-[#c4b5fd]/10 to-[#ffc4b5]/10 hover:from-[#c4b5fd]/20 hover:to-[#ffc4b5]/20"
          >
            <CircularProgress percentage={setupProgress} size={16} />
            <span className="font-medium text-foreground">Setup Guide</span>
          </Button>
        )}

        {/* Notification Bell */}
        <Button variant="ghost" size="icon" className="relative hover:bg-accent">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {hasNotifications && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] rounded-full" />
          )}
        </Button>

        {/* Connect Account Button */}
        <Button
          variant="outline"
          size="sm"
          className="hidden md:flex items-center gap-2 px-3 py-2 rounded-md border-border bg-gradient-to-r from-[#c4b5fd]/10 to-[#ffc4b5]/10 hover:from-[#c4b5fd]/20 hover:to-[#ffc4b5]/20"
        >
          <Globe className="h-4 w-4 text-[#c4b5fd]" />
          <span className="font-medium text-foreground">Connect Account</span>
          <ExternalLink className="h-3.5 w-3.5 ml-1 opacity-70" />
        </Button>

        {/* Main Account Balance & Top Up */}
        <div className="hidden md:flex bg-muted rounded-full px-4 py-1.5 items-center border border-border">
          <span className="text-sm font-medium text-foreground">$45,231.89</span>
        </div>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg?height=32&width=32&text=J" alt="User" />
                <AvatarFallback className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] text-white">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 bg-popover border-border p-0">
            <div className="px-4 py-3 border-b border-border">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-popover-foreground">{userEmail}</p>
                <p className="text-xs text-muted-foreground">Business Plan</p>
              </div>
            </div>

            <div className="py-2">
              <DropdownMenuItem
                className="text-popover-foreground hover:bg-accent px-4 py-2"
                onClick={() => (window.location.href = "/settings/account")}
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-popover-foreground hover:bg-accent px-4 py-2"
                onClick={() => (window.location.href = "/settings")}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
            </div>

            <DropdownMenuSeparator className="bg-border" />

            <div className="py-2">
              <DropdownMenuItem className="text-popover-foreground hover:bg-accent px-4 py-2">
                <Moon className="h-4 w-4 mr-2" />
                Theme
                <div className="ml-auto flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm">
                    <Monitor className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm">
                    <Sun className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm bg-accent">
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
                className="w-full bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0"
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
