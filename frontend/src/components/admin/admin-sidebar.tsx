"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "../../lib/utils"
import { useAdminPerformance } from "@/lib/admin-performance"
import { Button } from "../ui/button"
import {
  Home,
  Users,
  FileText,
  CreditCard,
  ChevronDown,
  Menu,
  Shield,
  Settings,
  TrendingUp,
  DollarSign,
  Building2,
  Package,
  History,
  MessageSquare,
  Zap,
  Target,
  Globe,
  type LucideIcon,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { gradientTokens } from "../../lib/design-tokens"

interface SidebarItem {
  name: string
  href?: string
  icon: LucideIcon
  subItems?: { name: string; href: string; icon?: LucideIcon }[]
}

export function AdminSidebar({ className }: { className?: string }) {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([
    "Teams",
    "Applications", 
    "Transactions",
    "System Management",
  ])
  const pathname = usePathname()
  const { navigateToAdmin } = useAdminPerformance()

  const sidebarItems: SidebarItem[] = [
    { name: "Dashboard", href: "/admin", icon: Home },
    { name: "Assets", href: "/admin/assets", icon: Package },
    { name: "Support", href: "/admin/support", icon: MessageSquare },
    {
      name: "Teams",
      href: "/admin/teams",
      icon: Users,
      subItems: [
        { name: "All Teams", href: "/admin/teams", icon: Users },
        { name: "All Organizations", href: "/admin/organizations", icon: Building2 },
      ],
    },
    {
      name: "Applications",
      href: "/admin/applications",
      icon: FileText,
      subItems: [
        { name: "BM & Ad Account Apps", href: "/admin/applications", icon: FileText },
        { name: "Page Requests", href: "/admin/applications/page-requests", icon: Globe },
        { name: "Pixel Requests", href: "/admin/applications/pixel-requests", icon: Target },
        { name: "Application History", href: "/admin/applications/history", icon: FileText },
      ],
    },
    {
      name: "Transactions",
      href: "/admin/transactions/history",
      icon: CreditCard,
      subItems: [
        { name: "Top-up Requests", href: "/admin/transactions/topups", icon: TrendingUp },
        { name: "Transaction History", href: "/admin/transactions/history", icon: History },
        { name: "Business Analytics", href: "/admin/analytics", icon: TrendingUp },
      ],
    },
    {
      name: "System Management",
      href: "/admin/system",
      icon: Settings,
      subItems: [
        { name: "Access Codes", href: "/admin/access-codes", icon: Shield },
        { name: "Settings", href: "/admin/settings", icon: Settings },
      ],
    },
  ]

  const toggleExpanded = (itemName: string) =>
    setExpandedItems((prev) => (prev.includes(itemName) ? prev.filter((n) => n !== itemName) : [...prev, itemName]))

  const isExpanded = (itemName: string) => expandedItems.includes(itemName)

  const isItemActive = (href?: string) => {
    if (!href || !pathname) return false
    if (href === "/admin") return pathname === "/admin"
    
    // For exact matches, return true
    if (pathname === href) return true
    
    // For sub-items, only match exact paths to avoid parent highlighting
    // Don't use startsWith for sub-pages to prevent double highlighting
    return false
  }

  const toggleSidebar = () => setCollapsed((c) => !c)

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-border bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className,
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center border-b border-border px-4">
        {collapsed ? (
          <div className={`h-8 w-8 rounded-full ${gradientTokens.avatar} flex items-center justify-center`}>
            <span className="text-sm font-semibold">
              AP
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${gradientTokens.avatar}`}>
              <span className="text-sm font-semibold">AP</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Admin Panel</p>
              <p className="text-xs text-muted-foreground">Team Management</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3" data-admin-nav>
        {sidebarItems.map((item) => {
          const Icon = item.icon
          const hasSub = !!item.subItems?.length
          const active = isItemActive(item.href)
          const subActive = hasSub && item.subItems!.some((s) => isItemActive(s.href))

          const MainButton = (
            <Button
              variant="ghost"
                  className={cn(
                "w-full justify-start rounded-md text-sm",
                active || subActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-[#F5F5F5] hover:text-foreground",
                collapsed ? "h-10 px-0 justify-center" : "h-10 px-3",
                  )}
                >
              <Icon
                className={cn(collapsed ? "h-5 w-5" : "mr-3 h-4 w-4", active || subActive ? "text-primary" : "")}
                    />
              {!collapsed && <span className="flex-1 text-left">{item.name}</span>}
              {!collapsed && hasSub && (
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform", isExpanded(item.name) ? "rotate-180" : "")}
                    />
                  )}
            </Button>
          )

          return (
            <div key={item.name}>
              <div className="flex items-center">
                {hasSub ? (
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault()
                      if (!collapsed) toggleExpanded(item.name)
                    }}
                  >
                    {MainButton}
                  </div>
                                ) : (
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => navigateToAdmin(item.href!)}
                  >
                    {MainButton}
                  </div>
                )}
              </div>

              {/* Sub-items */}
              {hasSub && !collapsed && isExpanded(item.name) && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.subItems!.map((sub) => {
                    const SubIcon = sub.icon
                    return (
                      <div key={sub.name} className="cursor-pointer">
                        <Button
                          variant="ghost"
                          onClick={() => navigateToAdmin(sub.href)}
                      className={cn(
                            "h-8 w-full justify-start rounded-md px-3 text-sm",
                            isItemActive(sub.href)
                              ? "bg-accent/50 text-foreground"
                              : "text-muted-foreground hover:bg-[#F5F5F5] hover:text-foreground",
                      )}
                    >
                          {SubIcon && <SubIcon className="mr-2 h-3.5 w-3.5" />}
                          <span className="text-xs">{sub.name}</span>
                        </Button>
                    </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
        </nav>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between")}>
          <button
            onClick={toggleSidebar}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="rounded-md p-1 hover:bg-[#F5F5F5]"
          >
            <Menu className="h-4 w-4 text-muted-foreground" />
          </button>
          {!collapsed && (
            <span className="bg-primary bg-clip-text text-sm font-semibold text-transparent">
              Blightstone CRM Admin
            </span>
          )}
        </div>
      </div>
    </aside>
  )
}
