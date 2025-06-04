"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Home, Settings, Users, Menu, Receipt, Wallet } from "lucide-react"
import { OrganizationSelector } from "../organization/organization-selector"
import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AdHubLogo } from "@/components/core/AdHubLogo"

const sidebarItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Accounts", href: "/dashboard/accounts", icon: Users },
  { name: "Wallet", href: "/dashboard/wallet", icon: Wallet },
  { name: "Transactions", href: "/dashboard/wallet/transactions", icon: Receipt },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export default function DashboardSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleSidebar = () => {
    setCollapsed(!collapsed)
  }

  // Improved isActive logic to prevent multiple active items
  const isItemActive = (href: string) => {
    if (!mounted) return false
    if (!pathname) return false

    if (href === "/dashboard") {
      // Only exact match for dashboard
      return pathname === href
    } else if (href === "/dashboard/wallet") {
      // For wallet, don't mark active when on transactions page
      return pathname === href
    } else if (href === "/dashboard/wallet/transactions") {
      // For transactions, only mark active when on transactions page
      return pathname === href || pathname.startsWith(href)
    }
    // For other items, check if the path starts with the href
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={cn(
        "flex flex-col h-screen border-r border-border bg-background transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center px-4 border-b border-border">
        {collapsed ? (
          <div className="w-full flex justify-center">
            <Avatar className="h-10 w-10 bg-secondary">
              <AvatarImage src="/abstract-geometric-SP.png" alt="Current Organization" />
              <AvatarFallback className="text-lg">S</AvatarFallback>
            </Avatar>
          </div>
        ) : (
          <OrganizationSelector />
        )}
      </div>

      {/* Main Navigation - using flex-1 to make it fill available space */}
      <div className="flex-1 overflow-y-auto">
        <nav className={cn("space-y-2 p-2", collapsed && "pt-4")}>
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = isItemActive(item.href)
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start rounded-md",
                    isActive
                      ? "bg-gradient-to-r from-[#b4a0ff]/20 to-[#ffb4a0]/20 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                    collapsed ? "justify-center h-12 px-0" : "h-10 px-3",
                  )}
                >
                  <Icon className={cn(isActive ? "text-[#b4a0ff]" : "", collapsed ? "h-5 w-5" : "h-4 w-4 mr-2")} />
                  {!collapsed && item.name}
                </Button>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Footer with Collapse Button - fixed at bottom */}
      <div className="border-t border-border p-4 mt-auto">
        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between")}>
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-md hover:bg-secondary"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>

          {!collapsed && (
            <div className="flex items-center">
              <AdHubLogo size="lg" />
            </div>
          )}
        </div>
      </div>
    </aside>
  )
} 