"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  DollarSign,
  BarChart3,
  ShieldCheck,
  Menu,
  ChevronRight,
  type LucideIcon,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Define an interface for navigation items
interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  children?: NavItem[];
  badge?: string | number;
}

// Moved navItems and bottomNavItems outside the component for stable references
const navItems: NavItem[] = [
  {
    name: "Dashboard",
    path: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Requests",
    path: "/admin/requests",
    icon: FileText,
    children: [
      {
        name: "All Requests",
        path: "/admin/requests",
        icon: FileText,
      },
      {
        name: "Pending Review",
        path: "/admin/requests/pending",
        icon: FileText,
      },
    ],
  },
  {
    name: "Clients",
    path: "/admin/clients",
    icon: Users,
    children: [
      {
        name: "All Clients",
        path: "/admin/clients",
        icon: Users,
      },
      {
        name: "Active Accounts",
        path: "/admin/clients/active",
        icon: Users,
      },
    ],
  },
  {
    name: "Finances",
    path: "/admin/finances",
    icon: DollarSign,
    children: [
      {
        name: "Revenue",
        path: "/admin/finances/revenue",
        icon: DollarSign,
      },
      {
        name: "Transactions",
        path: "/admin/finances/transactions",
        icon: DollarSign,
      },
    ],
  },
  {
    name: "Analytics",
    path: "/admin/analytics",
    icon: BarChart3,
  },
]

const bottomNavItems: NavItem[] = [
  {
    name: "Settings",
    path: "/admin/settings",
    icon: Settings,
  },
  {
    name: "Exit Admin",
    path: "/dashboard",
    icon: ShieldCheck,
  },
]

interface AdminSidebarProps {
  className?: string
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const pathname = usePathname()

  // Admin navigation items
  // const navItems = [...] // Moved outside

  // Bottom navigation items
  // const bottomNavItems = [...] // Moved outside

  // Auto-expand the section that contains the current path
  useEffect(() => {
    const currentSection = navItems.find(
      (item) => item.children && item.children.some((child) => pathname === child.path),
    )

    if (currentSection) {
      setExpandedItem(currentSection.name)
    }
  }, [pathname])

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
    if (path === "/admin" && pathname === "/admin") {
      return true
    }
    if (path !== "/admin" && pathname && pathname.startsWith(path)) {
      return true
    }
    return false
  }

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-[#0A0A0A] border-r border-[#1A1A1A] transition-all duration-300 sticky top-0 left-0",
        collapsed ? "w-16" : "w-64",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center h-16 px-4 border-b border-[#1A1A1A]">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-white hover:bg-[#1A1A1A] h-9 w-9 flex items-center justify-center rounded-md"
        >
          <Menu className="h-5 w-5" />
        </button>
        {!collapsed && (
          <div className="ml-3 font-bold text-xl">
            <span className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] bg-clip-text text-transparent">Ad</span>
            <span>Hub</span>
            <span className="ml-2 text-xs bg-[#b4a0ff] text-black px-1.5 py-0.5 rounded-full">ADMIN</span>
          </div>
        )}
      </div>

      {/* Admin Section */}
      {!collapsed && (
        <div className="px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground tracking-wider">ADMIN PANEL</p>
        </div>
      )}

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-2">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => (
            <div key={item.path}>
              {item.children ? (
                // For items with children, make the main item a button
                <button
                  onClick={() => toggleExpand(item.name)}
                  className={cn(
                    "flex items-center justify-between w-full px-2 py-2.5 rounded-md transition-colors text-left",
                    isActive(item.path)
                      ? "bg-[#1A1A1A] text-white"
                      : "text-muted-foreground hover:text-white hover:bg-[#1A1A1A]",
                    collapsed && "justify-center",
                  )}
                >
                  <div className="flex items-center">
                    <item.icon
                      className={cn("h-5 w-5", isActive(item.path) ? "text-[#b4a0ff]" : "text-muted-foreground")}
                    />
                    {!collapsed && <span className="ml-3 flex items-center">{item.name}</span>}
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
                // For items without children, use a Link
                <Link
                  href={item.path}
                  className={cn(
                    "flex items-center justify-between px-2 py-2.5 rounded-md transition-colors",
                    isActive(item.path)
                      ? "bg-[#1A1A1A] text-white"
                      : "text-muted-foreground hover:text-white hover:bg-[#1A1A1A]",
                    collapsed && "justify-center",
                  )}
                >
                  <div className="flex items-center">
                    <item.icon
                      className={cn(
                        "h-5 w-5",
                        isActive(item.path)
                          ? "text-[#b4a0ff]" // Use the accent color from design tokens
                          : "text-muted-foreground",
                      )}
                    />
                    {!collapsed && <span className="ml-3 flex items-center">{item.name}</span>}
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
                          ? "bg-[#1A1A1A] text-white"
                          : "text-muted-foreground hover:text-white hover:bg-[#1A1A1A]",
                      )}
                    >
                      <span>{child.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* User Profile & Bottom Navigation */}
      <div className="border-t border-[#1A1A1A] pt-2 pb-4">
        <div className={cn("flex items-center px-4 py-3", collapsed ? "justify-center" : "justify-start")}>
          <Avatar className="h-10 w-10 border border-[#1A1A1A]">
            <AvatarImage src="/vibrant-street-market.png" alt="Admin" />
            <AvatarFallback className="bg-[#1A1A1A] text-xs">AD</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="ml-3">
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-muted-foreground">Super Admin</p>
            </div>
          )}
        </div>

        <nav className="mt-2 px-2 space-y-1">
          {bottomNavItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center px-2 py-2.5 rounded-md transition-colors",
                isActive(item.path)
                  ? "bg-[#1A1A1A] text-white"
                  : "text-muted-foreground hover:text-white hover:bg-[#1A1A1A]",
                collapsed && "justify-center",
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive(item.path) ? "text-[#b4a0ff]" : "text-muted-foreground")} />
              {!collapsed && (
                <div className="ml-3 flex items-center justify-between w-full">
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="bg-[#b4a0ff] text-black text-xs px-1.5 py-0.5 rounded-full">{item.badge}</span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
