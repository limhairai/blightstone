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
import { useOrganization } from "@/contexts/organization-context"
import { OrganizationSwitcher } from "@/components/organization/organization-switcher"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/core/Logo"
import { Loader } from "@/components/core/Loader"
import { useUser } from "@/contexts/user-context"
import { toast } from "@/components/ui/use-toast"
import type { NavItem, NavChildItem } from "@/types/nav"
import type { LucideIcon } from 'lucide-react'

interface SidebarProps {
  className?: string
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  isAdmin: boolean
}

export function Sidebar({ className, isOpen, setIsOpen, isAdmin }: SidebarProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const { organizations, setOrganizations, currentOrg, setCurrentOrg, loading } = useOrganization()
  const { userProfile, loading: userLoading, error: userError } = useUser()

  // Main navigation items - memoized
  const navItems: NavItem[] = useMemo(() => [
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
    ...(isAdmin ? [{
      name: "Admin",
      path: "/admin",
      icon: ShieldCheck,
    }] : []),
    {
      name: "Settings",
      path: "/settings",
      icon: Settings,
    },
  ], [isAdmin]);

  // Auto-collapse on mobile
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false)
    }
  }, [isMobile, setIsOpen])

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Auto-expand the section that contains the current path
  useEffect(() => {
    const currentSection = navItems.find(
      (item) => item.children && item.children.some((child) => pathname && pathname.startsWith(child.path)),
    );

    if (currentSection) {
      setExpandedItem(currentSection.name)
    }
  }, [pathname, navItems])

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
    if (!["/dashboard","/wallet","/wallet/transactions"].includes(path) && pathname && pathname.startsWith(path)) {
      return true
    }
    return false
  }

  // Bottom navigation items - memoized
  const bottomNavItems = useMemo(() => [
    // Admin item - only shown to superusers
    ...(isAdmin
      ? [
          {
            name: "Admin",
            path: "/admin",
            icon: ShieldCheck,
          },
        ]
      : []),
    // No settings/help/log out here
  ], [isAdmin]);

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
  if (loading || organizations === undefined) return <Loader />;

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
                          {item.children.map((child) => {
                            const ChildIconComponent = child.icon;
                            return (
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
                                {ChildIconComponent && (
                                  <ChildIconComponent
                                    className={cn(
                                      "h-4 w-4 mr-2",
                                      isActive(child.path) ? "text-primary" : "text-muted-foreground",
                                    )}
                                  />
                                )}
                                <span>{child.name}</span>
                              </Link>
                            );
                          })}
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
                        {!isOpen && (
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

          <div className="p-4 border-b border-border">
            <OrganizationSwitcher />
          </div>
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
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setMobileMenuOpen(false);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Close menu overlay"
          />
        )}
      </>
    )
  }

  // Desktop sidebar (logo top left, org switcher below)
  if (!isMobile) {
    return (
      <div
        className={cn(
          "hidden md:flex flex-col h-full border-r border-border bg-background transition-all duration-300 ease-in-out",
          !isOpen ? "w-16" : "w-64",
          className,
        )}
      >
        {/* Sidebar Header (Logo + Org Switcher) */}
        <div className={cn("h-16 flex items-center px-4 border-b border-border", !isOpen && "justify-center")}>
          {!isOpen ? (
            <button onClick={() => setIsOpen(true)} className="text-foreground">
              <Menu className="h-6 w-6" />
            </button>
          ) : (
            <Logo size="default" linkWrapper={true} />
          )}
          {isOpen && (
            <div className="ml-auto">
              <OrganizationSwitcher />
            </div>
          )}
        </div>

        {/* Navigation */}
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
                        !isOpen && "justify-center",
                      )}
                    >
                      <div className="flex items-center">
                        <item.icon
                          className={cn("h-5 w-5", isActive(item.path) ? "text-white" : "text-muted-foreground")}
                        />
                        {isOpen && (
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
                      {isOpen && (
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 transition-transform",
                            expandedItem === item.name && "rotate-90",
                          )}
                        />
                      )}
                    </button>
                    {isOpen && expandedItem === item.name && (
                      <div className="pl-6 space-y-1 mt-1">
                        {item.children.map((child) => {
                          const ChildIconComponent = child.icon;
                          return (
                            <Link
                              key={child.path}
                              href={child.path}
                              className={cn(
                                "flex items-center px-2 py-2.5 rounded-md transition-colors text-sm",
                                isActive(child.path)
                                  ? "bg-muted text-foreground"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
                              )}
                            >
                              {ChildIconComponent && (
                                <ChildIconComponent className="h-4 w-4 mr-2" />
                              )}
                              {child.name}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.path}
                    className={cn(
                      "flex items-center px-2 py-2.5 rounded-md transition-colors",
                      isActive(item.path)
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted",
                      !isOpen && "justify-center",
                    )}
                  >
                    <item.icon
                      className={cn("h-5 w-5", isActive(item.path) ? "text-white" : "text-muted-foreground")}
                    />
                    {isOpen && (
                      <span className="ml-3 flex items-center">
                        {item.name}
                        {item.isNew && (
                          <span className="ml-2 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                            NEW
                          </span>
                        )}
                      </span>
                    )}
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer (User Info + Collapse Button) */}
        <div className={cn("h-16 flex items-center px-4 border-t border-border", !isOpen && "justify-center")}>
          {isOpen && (
            userLoading ? (
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              </div>
            ) : userProfile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 p-1 h-auto">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userProfile.photoURL || undefined} alt={userProfile.displayName || userProfile.email || "User"} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {userProfile.displayName?.charAt(0) || userProfile.email?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    {isOpen && (
                      <div className="text-left">
                        <p className="text-sm font-medium leading-none truncate max-w-[100px]">
                          {userProfile.displayName || userProfile.email}
                        </p>
                        {currentOrg && (
                           <p className="text-xs text-muted-foreground leading-none truncate max-w-[100px]">
                             {currentOrg.name}
                           </p>
                        )}
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="top" className="w-56 mb-1">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {userProfile.displayName || "User"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {userProfile.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/settings/profile')}>
                    <Users className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {
                    // Implement actual logout logic, e.g., calling a function from AuthContext
                    localStorage.removeItem("adhub_token"); // Example, replace with proper auth
                    router.push('/login'); 
                    toast({ title: "Logged Out", description: "You have been successfully logged out." });
                  }} className="text-red-500 focus:text-red-600 focus:bg-red-50">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" onClick={() => router.push('/login')}>Login</Button>
            )
          )}
          <button
            onClick={() => setIsOpen(!isOpen)} 
            className={cn("ml-auto text-muted-foreground hover:text-foreground", !isOpen && "ml-0")}
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isOpen ? <ChevronRight className="h-5 w-5 rotate-180" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
    )
  }
}
