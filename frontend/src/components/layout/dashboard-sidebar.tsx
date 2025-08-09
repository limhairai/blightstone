"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "../ui/button"
import { ProjectSelector } from "../projects/project-selector"
import { BlightstoneLogo } from "../core/BlightstoneLogo"
import { cn } from "../../lib/utils"
import { Home, Building2, Wallet, Receipt, Settings, ChevronDown, Menu, CreditCard, Users, Target, MessageSquare, FileText, Globe, FolderOpen, Brain, BarChart3, CheckSquare } from "lucide-react"
import { useOrganizationStore } from '@/lib/stores/organization-store'
import { useCurrentOrganization } from '@/lib/swr-config'
import { useAuth } from '@/contexts/AuthContext'

interface SidebarItem {
  name: string
  href?: string
  icon: any
  subItems?: { name: string; href: string; icon?: any }[]
  action?: () => void
}

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([]) // No expanded items needed for flat navigation
  const pathname = usePathname()
  const router = useRouter()
  
  // Get organization and user data
  const { currentOrganizationId } = useOrganizationStore()
  const { data: orgData } = useCurrentOrganization(currentOrganizationId)
  const { user, session } = useAuth()

  // ⚡ AGGRESSIVE ROUTE PREFETCHING: Prefetch all dashboard routes for instant navigation
  useEffect(() => {
    const routesToPrefetch = [
      '/dashboard/wallet',
      '/dashboard/support', 
      '/dashboard/settings',
      '/dashboard/topup-requests',
      '/dashboard/business-managers',
      '/dashboard/accounts',
      '/dashboard/pixels',
      '/dashboard/applications'
    ]

    // Prefetch all routes after a short delay to not interfere with initial load
    const timer = setTimeout(() => {
      routesToPrefetch.forEach(route => {
        router.prefetch(route)
      })
      console.log('🚀 All dashboard routes prefetched for instant navigation!')
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])
  
  // Get organization name or user name for initials
  const organization = orgData?.organizations?.[0]
  const getInitials = () => {
    if (organization?.name) {
      // Get organization initials (e.g., "My Company" -> "MC")
      return organization.name
        .split(' ')
        .map((word: any) => word.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase()
    }
    
    // Fallback to user initials
    if (user?.user_metadata?.name) {
      return user.user_metadata.name
        .split(' ')
        .map((word: any) => word.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase()
    }
    
    // Final fallback
    return user?.email?.charAt(0).toUpperCase() || 'U'
  }

  const sidebarItems: SidebarItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
    { name: "Creative Tracker", href: "/dashboard/creative-tracker", icon: Target },
    { name: "Customer Avatars", href: "/dashboard/customer-avatars", icon: Users },
    { name: "Competitor Analysis", href: "/dashboard/competitors", icon: Building2 },
    { name: "Awareness Stages", href: "/dashboard/awareness-stages", icon: Brain },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
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

  // 🚀 PREDICTIVE PRELOADING: Preload data when user hovers over nav items
  const preloadData = useCallback((route: string) => {
    if (!session?.access_token || !currentOrganizationId) return

    const headers = { 'Authorization': `Bearer ${session.access_token}` }
    
    switch (route) {
      case '/dashboard/business-managers':
        // Preload business managers data
        fetch(`/api/organizations/${currentOrganizationId}/business-managers`, { headers })
          .catch(() => {}) // Silent fail
        break
      
      case '/dashboard/accounts':
        // Preload ad accounts data (already loaded in dashboard)
        break
      
      case '/dashboard/pixels':
        // Preload pixels data
        fetch(`/api/organizations/${currentOrganizationId}/pixels`, { headers })
          .catch(() => {}) // Silent fail
        break
      
      case '/dashboard/pages':
        // ⚡ PREDICTIVE: Preload pages data for instant loading
        fetch(`/api/pages?organization_id=${currentOrganizationId}`, { headers })
          .catch(() => {}) // Silent fail
        // Also preload page requests
        fetch(`/api/page-requests?organization_id=${currentOrganizationId}`, { headers })
          .catch(() => {}) // Silent fail
        break
      
      case '/dashboard/settings':
        // REMOVED: Topup usage preloading - this endpoint is extremely slow (17+ seconds)
        // Only load when user actually visits settings page
        // fetch(`/api/topup-usage?organization_id=${currentOrganizationId}`, { headers })
        //   .catch(() => {}) // Silent fail
        break
      
      case '/dashboard/applications':
        // Preload applications data
        fetch('/api/applications', { headers })
          .catch(() => {}) // Silent fail
        break
        
      case '/dashboard/support':
        // Preload support tickets
        fetch('/api/support/tickets', { headers })
          .catch(() => {}) // Silent fail
        break
      case '/dashboard/topup-requests':
        // Preload transactions data
        fetch('/api/transactions', { headers })
          .catch(() => {}) // Silent fail
        break
    }
  }, [session, currentOrganizationId])

  // Debounced preload to avoid excessive requests
  const debouncedPreload = useMemo(() => {
    let timeoutId: NodeJS.Timeout
    return (route: string) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => preloadData(route), 200) // 200ms delay
    }
  }, [preloadData])

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
                <span className="text-sm font-semibold bg-primary bg-clip-text text-transparent">
                  {/* Replace with actual organization name initials or user initials */}
                  {getInitials()}
                </span>
              </Button>
            </div>
          ) : (
            <ProjectSelector />
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
                      onMouseEnter={() => item.href && debouncedPreload(item.href)}
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
                            onMouseEnter={() => debouncedPreload(subItem.href)}
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
                <BlightstoneLogo size="sm" />
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
} 