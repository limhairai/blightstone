"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { OrganizationSelector } from "@/components/organization-selector"
import { cn } from "@/lib/utils"
import { Home, Building2, Wallet, Receipt, Settings, ChevronDown, Menu, CreditCard } from "lucide-react"

interface SidebarItem {
  name: string
  href?: string
  icon: any
  subItems?: { name: string; href: string; icon?: any }[]
  action?: () => void
}

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>(["Businesses"]) // Default expanded
  const pathname = usePathname()

  const sidebarItems: SidebarItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    {
      name: "Businesses",
      href: "/businesses",
      icon: Building2,
      subItems: [
        { name: "All Businesses", href: "/businesses" },
        { name: "Ad Accounts", href: "/accounts" },
      ],
    },
    { name: "Wallet", href: "/dashboard/wallet", icon: Wallet },
    { name: "Transactions", href: "/dashboard/wallet/transactions", icon: Receipt },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ]

  const toggleExpanded = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName) ? prev.filter((name) => name !== itemName) : [...prev, itemName],
    )
  }

  const isExpanded = (itemName: string) => expandedItems.includes(itemName)

  const isItemActive = (href?: string) => {
    if (!href) return false
    if (href === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname === href || pathname.startsWith(href)
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
            const isActive = isItemActive(item.href)
            const isSubItemActive = hasSubItems && item.subItems.some((subItem) => isItemActive(subItem.href))

            return (
              <div key={item.name}>
                {/* Main Item */}
                <div className="flex items-center">
                  {item.action ? (
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault()
                        item.action()
                      }}
                    >
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start rounded-md text-sm",
                          isActive || isSubItemActive
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent",
                          collapsed ? "justify-center h-10 px-0" : "h-10 px-3",
                        )}
                      >
                        <Icon
                          className={cn(
                            isActive || isSubItemActive ? "text-[#c4b5fd]" : "",
                            collapsed ? "h-5 w-5" : "h-4 w-4 mr-3",
                          )}
                        />
                        {!collapsed && <span className="flex-1 text-left">{item.name}</span>}
                      </Button>
                    </div>
                  ) : hasSubItems ? (
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
                          isActive || isSubItemActive
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent",
                          collapsed ? "justify-center h-10 px-0" : "h-10 px-3",
                        )}
                      >
                        <Icon
                          className={cn(
                            isActive || isSubItemActive ? "text-[#c4b5fd]" : "",
                            collapsed ? "h-5 w-5" : "h-4 w-4 mr-3",
                          )}
                        />
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-left">{item.name}</span>
                            {hasSubItems && (
                              <ChevronDown
                                className={cn("h-4 w-4 transition-transform", isItemExpanded ? "rotate-180" : "")}
                              />
                            )}
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Link href={item.href!} className="flex-1">
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start rounded-md text-sm",
                          isActive || isSubItemActive
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent",
                          collapsed ? "justify-center h-10 px-0" : "h-10 px-3",
                        )}
                      >
                        <Icon
                          className={cn(
                            isActive || isSubItemActive ? "text-[#c4b5fd]" : "",
                            collapsed ? "h-5 w-5" : "h-4 w-4 mr-3",
                          )}
                        />
                        {!collapsed && <span className="flex-1 text-left">{item.name}</span>}
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Sub Items */}
                {hasSubItems && !collapsed && isItemExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.subItems.map((subItem) => {
                      const SubIcon = subItem.icon
                      return (
                        <Link href={subItem.href} key={subItem.name}>
                          <Button
                            variant="ghost"
                            className={cn(
                              "w-full justify-start rounded-md text-sm h-8 px-3",
                              isItemActive(subItem.href)
                                ? "bg-accent/50 text-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent",
                            )}
                          >
                            {SubIcon && <SubIcon className="h-3.5 w-3.5 mr-2" />}
                            {!SubIcon && subItem.name === "All Businesses" && (
                              <Building2 className="h-3.5 w-3.5 mr-2" />
                            )}
                            {!SubIcon && subItem.name === "Ad Accounts" && <CreditCard className="h-3.5 w-3.5 mr-2" />}
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
                <span className="text-sm font-semibold bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] bg-clip-text text-transparent">
                  AdHub
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
