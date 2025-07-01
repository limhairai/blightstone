"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "../ui/button"
import { OrganizationSelector } from "../organization/organization-selector"
import { AdHubLogo } from "../core/AdHubLogo"
import { cn } from "../../lib/utils"
import { Home, Building2, Wallet, Receipt, Settings, ChevronDown, Menu, CreditCard, TrendingUp, Users } from "lucide-react"

interface SidebarItem {
  name: string
  href?: string
  icon: any
  subItems?: { name: string; href: string; icon?: any }[]
  action?: () => void
}

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>(["Assets"]) // Only expand Assets by default
  const pathname = usePathname()

  const sidebarItems: SidebarItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    {
      name: "Assets",
      icon: Building2,
      subItems: [
        { name: "Business Managers", href: "/dashboard/business-managers", icon: Building2 },
        { name: "Ad Accounts", href: "/dashboard/accounts", icon: CreditCard },
      ],
    },
    { name: "Wallet", href: "/dashboard/wallet", icon: Wallet },
    { name: "Top-up Requests", href: "/dashboard/topup-requests", icon: TrendingUp },
    { name: "Transactions", href: "/dashboard/transactions", icon: Receipt },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ]

  const toggleExpanded = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName) ? prev.filter((name) => name !== itemName) : [...prev, itemName],
    )
  }

  const isExpanded = (itemName: string) => expandedItems.includes(itemName)

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard"
    }
    
    // For exact matches
    if (pathname === href) {
      return true
    }
    
    // For sections that have sub-routes (settings), use startsWith
    if (href === "/dashboard/settings") {
      return pathname && pathname.startsWith(href)
    }
    
    return false
  }

  const isSubItemActive = (parentName: string, subItems?: { name: string; href: string; icon?: any }[]) => {
    if (!subItems) return false
    return subItems.some((subItem) => pathname === subItem.href)
  }

  const toggleSidebar = () => setCollapsed(!collapsed)

  return (
    <>
      <aside
        className={cn(
          "flex flex-col h-screen border-r border-border bg-card transition-all duration-300",
          collapsed ? "w-16" : "w-64",
        )}
      >
        {/* Organization Selector Header */}
        <div className="h-16 flex items-center px-4 border-b border-border">
          {collapsed ? (
            <div className="w-full flex justify-center">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent">
                <span className="text-sm font-semibold bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] bg-clip-text text-transparent">
                  SP
                </span>
              </Button>
            </div>
          ) : (
            <OrganizationSelector />
          )}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1 p-3 flex-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const hasSubItems = item.subItems && item.subItems.length > 0
            const isItemExpanded = hasSubItems && isExpanded(item.name)
            const hasActiveSubItem = hasSubItems && isSubItemActive(item.name, item.subItems)

            return (
              <div key={item.name}>
                {/* Main Item */}
                <div className="flex items-center">
                  {hasSubItems ? (
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault()
                        if (!collapsed) {
                          toggleExpanded(item.name)
                        }
                      }}
                    >
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start rounded-md text-sm",
                          hasActiveSubItem
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent",
                          collapsed ? "justify-center h-10 px-0" : "h-10 px-3",
                        )}
                      >
                        <Icon
                          className={cn(
                            hasActiveSubItem ? "text-[#c4b5fd]" : "",
                            collapsed ? "h-5 w-5" : "h-4 w-4 mr-3",
                          )}
                        />
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-left">{item.name}</span>
                            <ChevronDown
                              className={cn("h-4 w-4 transition-transform", isItemExpanded ? "rotate-180" : "")}
                            />
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Link 
                      href={item.href!} 
                      className={cn(
                        "flex-1 rounded-md text-sm transition-colors flex items-center",
                        (item.href && isActive(item.href))
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent",
                        collapsed ? "justify-center h-10 px-0" : "h-10 px-3",
                      )}
                      prefetch={false}
                    >
                      <Icon
                        className={cn(
                          (item.href && isActive(item.href)) ? "text-[#c4b5fd]" : "",
                          collapsed ? "h-5 w-5" : "h-4 w-4 mr-3",
                        )}
                      />
                      {!collapsed && <span className="flex-1 text-left">{item.name}</span>}
                    </Link>
                  )}
                </div>

                {/* Sub Items */}
                {hasSubItems && !collapsed && isItemExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.subItems?.map((subItem) => {
                      const SubIcon = subItem.icon
                      return (
                        <Link href={subItem.href} key={subItem.name}>
                          <Button
                            variant="ghost"
                            className={cn(
                              "w-full justify-start rounded-md text-sm h-8 px-3",
                              isActive(subItem.href)
                                ? "bg-accent/50 text-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent",
                            )}
                          >
                            {SubIcon && <SubIcon className="h-3.5 w-3.5 mr-2" />}
                            <span className="text-xs">{subItem.name}</span>
                          </Button>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Collapse Toggle Footer */}
        <div className="border-t border-border p-4">
          <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between")}>
            <button
              onClick={toggleSidebar}
              className="p-1 rounded-md hover:bg-accent"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Menu className="h-4 w-4 text-muted-foreground" />
            </button>

            {!collapsed && (
              <div className="flex items-center">
                <AdHubLogo size="sm" />
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
} 