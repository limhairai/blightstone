"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Wallet,
  Users,
  Settings,
  HelpCircle,
  ChevronRight,
  Menu,
  ShieldCheck,
  X,
  MoreHorizontal,
  ChevronDown,
  LogOut,
  Plus,
  Folder,
  CheckCircle,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { useOrganization } from "@/components/organization-context"
import { OrganizationSwitcher } from "@/components/organization-switcher"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Logo } from "./logo"
import { Loader } from "@/components/Loader"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isSuperuser, setIsSuperuser] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const { organizations, setOrganizations, currentOrg, setCurrentOrg, loading } = useOrganization()

  // Auto-collapse on mobile
  useEffect(() => {
    if (isMobile) {
      setCollapsed(true)
    }
  }, [isMobile])

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Auto-expand the section that contains the current path
  useEffect(() => {
    const currentSection = navItems.find(
      (item) => item.children && item.children.some((child) => pathname.startsWith(child.path)),
    )

    if (currentSection) {
      setExpandedItem(currentSection.name)
    }
  }, [pathname, navItems])

  // Fetch superuser status on mount
  useEffect(() => {
    const token = localStorage.getItem("adhub_token");
    fetch("/api/v1/auth/me", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(res => res.json())
      .then(data => setIsSuperuser(!!data.is_superuser))
      .catch(() => setIsSuperuser(false));
  }, []);

  // Toggle expanded state for items with children
  const toggleExpand = (item: string) => {
    if (expandedItem === item) {
      setExpandedItem(null)
    } else {
      setExpandedItem(item)
    }
  }

  // Check if the current path matches the nav item
  const isActive = (path: string) => {
    // Exact match for dashboard
    if (path === "/dashboard" && pathname === "/dashboard") {
      return true
    }
    // Exact match for wallet (but not transactions)
    if (path === "/wallet" && pathname === "/wallet") {
      return true
    }
    // Exact match for transactions
    if (path === "/wallet/transactions" && pathname === "/wallet/transactions") {
      return true
    }
    // Other: startsWith for other sections
    if (!["/dashboard","/wallet","/wallet/transactions"].includes(path) && pathname.startsWith(path)) {
      return true
    }
    return false
  }

  // Main navigation items - memoized
  const navItems = useMemo(() => [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Wallet",
      path: "/wallet",
      icon: Wallet,
    },
    {
      name: "Transactions",
      path: "/wallet/transactions",
      icon: Wallet,
    },
    {
      name: "Accounts",
      path: "/account-management",
      icon: Users,
    },
    // Only show Admin for superusers
    ...(isSuperuser ? [{
      name: "Admin",
      path: "/admin",
      icon: ShieldCheck,
    }] : []),
    {
      name: "Settings",
      path: "/settings",
      icon: Settings,
    },
  ], [isSuperuser]);

  // Bottom navigation items - memoized
  const bottomNavItems = useMemo(() => [
    // Admin item - only shown to superusers
    ...(isSuperuser
      ? [
          {
            name: "Admin",
            path: "/admin",
            icon: ShieldCheck,
          },
        ]
      : []),
    // No settings/help/log out here
  ], [isSuperuser]);

  // Add useEffect to prevent body scroll when mobileMenuOpen is true
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Loading guard to prevent DOM mismatch
  if (loading || organizations === undefined) return <Loader size={24} />;

  // Mobile bottom navigation
  if (isMobile) {
    return (
      <>
        {/* Mobile Hamburger Menu */}
        <div
          className={cn(
            "fixed top-0 left-0 w-full h-16 bg-background border-b border-border flex items-center px-4 z-40",
          )}
        >
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-foreground hover:bg-muted h-9 w-9 flex items-center justify-center rounded-md"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Logo size="default" className="ml-3" linkWrapper={true} />
        </div>

        {/* Mobile Slide-out Menu */}
        <div
          className={cn(
            "fixed top-0 left-0 w-64 h-full bg-background border-r border-border z-50 transition-transform duration-300 transform",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center h-16 px-4 border-b border-border">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-foreground hover:bg-muted h-9 w-9 flex items-center justify-center rounded-md"
            >
              <X className="h-5 w-5" />
            </button>
            <Logo size="default" className="ml-3" linkWrapper={true} />
          </div>

          <div className="px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground tracking-wider">OVERVIEW</p>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            <nav className="space-y-1 px-2">
              {navItems.map((item) => (
                <div key={item.path}>
                  {item.children ? (
                    <>
                      <button
                        onClick={() => toggleExpand(item.name)}
                        className={cn(
                          "flex items-center justify-between w-full px-2 py-2.5 rounded-md transition-colors text-left",
                          isActive(item.path)
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted",
                        )}
                      >
                        <div className="flex items-center">
                          <item.icon
                            className={cn("h-5 w-5", isActive(item.path) ? "text-white" : "text-muted-foreground")}
                          />
                          <span className="ml-3 flex items-center">
                            {item.name}
                            {item.isNew && (
                              <span className="ml-2 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                                NEW
                              </span>
                            )}
                          </span>
                        </div>
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 transition-transform text-muted-foreground",
                            expandedItem === item.name && "transform rotate-90",
                          )}
                        />
                      </button>
                      {expandedItem === item.name && item.children && (
                        <div className="mt-1 ml-8 space-y-1">
                          {item.children.map((child) => (
                            <Link
                              key={child.path}
                              href={child.path}
                              className={cn(
                                "flex items-center px-2 py-2 rounded-md transition-colors",
                                isActive(child.path)
                                  ? "bg-muted text-foreground"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
                              )}
                            >
                              {child.icon && (
                                <child.icon
                                  className={cn(
                                    "h-4 w-4 mr-2",
                                    isActive(child.path) ? "text-primary" : "text-muted-foreground",
                                  )}
                                />
                              )}
                              <span>{child.name}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.path}
                      className={cn(
                        "flex items-center justify-between px-2 py-2.5 rounded-md transition-colors",
                        isActive(item.path)
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted",
                      )}
                    >
                      <div className="flex items-center">
                        <item.icon
                          className={cn(
                            "h-5 w-5",
                            isActive(item.path)
                              ? "text-white"
                              : "text-muted-foreground",
                          )}
                        />
                        {!collapsed && (
                          <span className="ml-3 flex items-center">
                            {item.name}
                            {item.isNew && (
                              <span className="ml-2 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                                NEW
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>

          <OrganizationSwitcher
            organizations={organizations || []}
            currentOrganizationId={currentOrg?.id}
            onOrganizationChange={(id) => {
              if (!organizations) return;
              const org = organizations.find((o) => o.id === id);
              if (org) setCurrentOrg(org);
            }}
            onCreateOrganization={() => router.push('/organizations/new')}
            collapsed={collapsed}
            className="border-t border-border pt-2 pb-4"
          />
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 w-full h-16 bg-white dark:bg-zinc-900 border-t border-border flex justify-around items-center z-40" style={{backgroundColor: 'white', backgroundImage: 'none'}}>
          {navItems.slice(0, 4).map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex flex-col items-center justify-center h-full w-full",
                isActive(item.path) ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          ))}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center h-full w-full text-muted-foreground"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-xs mt-1">More</span>
          </button>
        </div>

        {/* Content padding for mobile */}
        <div className="pt-16 pb-16">{/* This is where the main content would go */}</div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-40"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu overlay"
          />
        )}
      </>
    )
  }

  // Desktop sidebar (logo top left, org switcher below)
  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-white dark:bg-zinc-900 border-r border-border text-foreground transition-all duration-300 sticky top-0 left-0",
        collapsed ? "w-16" : "w-64",
        className,
      )}
    >
      {/* Organization Switcher at the very top */}
      <div className={cn("px-4 pt-4 pb-2", collapsed && "px-2 pt-2 pb-1")}> 
        <OrganizationSwitcher
          organizations={organizations || []}
          currentOrganizationId={currentOrg?.id}
          onOrganizationChange={(id) => {
            if (!organizations) return;
            const org = organizations.find((o) => o.id === id);
            if (org) setCurrentOrg(org);
          }}
          onCreateOrganization={() => router.push('/organizations/new')}
          collapsed={collapsed}
        />
      </div>
      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-2">
        <nav className="space-y-1 px-2 text-sm">
          {navItems.map((item) => (
            <div key={item.path}>
              {item.children ? (
                <button
                  onClick={() => toggleExpand(item.name)}
                  className={cn(
                    "flex items-center justify-between w-full px-2 py-2.5 rounded-md transition-colors text-left",
                    isActive(item.path)
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                    collapsed && "justify-center",
                  )}
                >
                  <div className="flex items-center">
                    <item.icon
                      className={cn("h-5 w-5", isActive(item.path) ? "text-white" : "text-muted-foreground")}
                    />
                    {!collapsed && (
                      <span className="ml-3 flex items-center">
                        {item.name}
                        {item.isNew && (
                          <span className="ml-2 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                            NEW
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  {!collapsed && (
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 transition-transform text-muted-foreground",
                        expandedItem === item.name && "transform rotate-90",
                      )}
                    />
                  )}
                </button>
              ) : (
                <Link
                  href={item.path}
                  className={cn(
                    "flex items-center justify-between px-2 py-2.5 rounded-md transition-colors",
                    isActive(item.path)
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                    collapsed && "justify-center",
                  )}
                >
                  <div className="flex items-center">
                    <item.icon
                      className={cn(
                        "h-5 w-5",
                        isActive(item.path)
                          ? "text-white"
                          : "text-muted-foreground",
                      )}
                    />
                    {!collapsed && (
                      <span className="ml-3 flex items-center">
                        {item.name}
                        {item.isNew && (
                          <span className="ml-2 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                            NEW
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </Link>
              )}
              {/* Dropdown items */}
              {!collapsed && expandedItem === item.name && item.children && (
                <div className="mt-1 ml-8 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.path}
                      href={child.path}
                      className={cn(
                        "flex items-center px-2 py-2 rounded-md transition-colors",
                        isActive(child.path)
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted",
                      )}
                    >
                      {child.icon && (
                        <child.icon
                          className={cn(
                            "h-4 w-4 mr-2",
                            isActive(child.path) ? "text-primary" : "text-muted-foreground",
                          )}
                        />
                      )}
                      <span>{child.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
      {/* Bottom hamburger and logo, Airwallex style */}
      <div className="border-t border-border pt-2 pb-2 flex flex-row items-center gap-2 px-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-foreground hover:bg-muted h-9 w-9 flex items-center justify-center rounded-md"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu className="h-5 w-5" />
        </button>
        <Logo size={collapsed ? "small" : "default"} linkWrapper={true} />
      </div>
    </div>
  )
}
