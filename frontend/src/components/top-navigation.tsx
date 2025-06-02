"use client"

import { useState } from "react"
import { Bell, User, HelpCircle, LogOut, ExternalLink, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePathname } from "next/navigation"
import { getPageTitle } from "@/lib/get-greeting"
import { useUser } from "@/contexts/user-context"

interface TopNavigationProps {
  hasNotifications?: boolean
}

export function TopNavigation({ hasNotifications = true }: TopNavigationProps) {
  const [isConnected, setIsConnected] = useState(false)
  const pathname = usePathname()
  const pageTitleFromPath = getPageTitle(pathname)
  const { userProfile, loading: userLoading } = useUser()

  const handleConnect = () => {
    setIsConnected(true)
  }

  const displayBalance = userProfile?.walletBalance?.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  }) || "$0.00"

  const userInitial = userProfile?.initial || (userProfile?.displayName ? userProfile.displayName.charAt(0) : userProfile?.email ? userProfile.email.charAt(0) : "U")
  const userEmail = userProfile?.email || "user@example.com"
  const pageTitle = userProfile?.organizationName || pageTitleFromPath

  return (
    <div className="h-16 border-b border-border flex items-center justify-between px-4 md:px-6 bg-background">
      <h1 className="text-xl font-semibold">{pageTitle}</h1>

      <div className="flex items-center gap-3 md:gap-4 ml-auto">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasNotifications && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] rounded-full" />
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-md border transition-all duration-200 ${
            isConnected
              ? "bg-secondary text-foreground"
              : "bg-gradient-to-r from-[#b4a0ff]/10 to-[#ffb4a0]/10 border-[#b4a0ff]/20"
          }`}
          onClick={handleConnect}
        >
          <Globe className={`h-4 w-4 ${isConnected ? "" : "text-[#b4a0ff]"}`} />
          <span className="font-medium">{isConnected ? "Connected" : "Connect Account"}</span>
          {!isConnected && <ExternalLink className="h-3.5 w-3.5 ml-1 opacity-70" />}
        </Button>

        <div className="hidden md:flex bg-secondary rounded-full px-4 py-1.5 items-center border border-border">
          <span className="text-sm font-medium">{userLoading ? "Loading..." : displayBalance}</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-white">
                  {userLoading ? "L" : userInitial}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userLoading ? "Loading..." : userEmail}</p>
                <p className="text-xs leading-none text-muted-foreground">Business Plan</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Help</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-500">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
