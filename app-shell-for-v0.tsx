"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { 
  Home, Building2, Settings, ChevronDown, Menu, FolderOpen, CheckSquare, 
  Target, Users, Bell, User, LogOut, Sun, Moon, Monitor, Search, Plus, Check, Loader2
} from "lucide-react"

// Mock data for v0
interface Project {
  id: string
  name: string
  description?: string
  status: "active" | "paused" | "completed"
  completedTasks: number
  tasksCount: number
}

const mockProjects: Project[] = [
  {
    id: "1",
    name: "Grounding.co",
    description: "E-commerce grounding products",
    status: "active",
    completedTasks: 3,
    tasksCount: 8
  },
  {
    id: "2", 
    name: "Brand X Marketing",
    description: "Social media campaign",
    status: "paused",
    completedTasks: 1,
    tasksCount: 5
  },
  {
    id: "3",
    name: "Product Launch",
    description: "New product launch strategy",
    status: "completed",
    completedTasks: 12,
    tasksCount: 12
  }
]

// Blightstone Logo Component
function BlightstoneLogo({ className, size = "md" }: { className?: string, size?: "sm" | "md" | "lg" | "xl" }) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-xl", 
    lg: "text-2xl",
    xl: "text-3xl",
  }

  return (
    <div className={cn("font-bold font-inter", sizeClasses[size], className)}>
      <span className="text-foreground">Blight</span>
      <span className="text-muted-foreground">stone</span>
    </div>
  )
}

// Project Selector Component
function ProjectSelector() {
  const router = useRouter()
  const [currentProjectId, setCurrentProjectId] = useState("1")
  const [componentIsLoading, setComponentIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const currentProject = mockProjects.find(p => p.id === currentProjectId)

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return mockProjects
    return mockProjects.filter(project =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery])

  const handleProjectSelect = useCallback((projectId: string) => {
    if (projectId === currentProjectId) return
    
    setComponentIsLoading(true)
    setCurrentProjectId(projectId)
    setIsDropdownOpen(false)
    router.push('/dashboard')
    
    setTimeout(() => {
      setComponentIsLoading(false)
    }, 500)
  }, [currentProjectId, router])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 border-green-200"
      case "paused": return "bg-yellow-100 text-yellow-800 border-yellow-200" 
      case "completed": return "bg-blue-100 text-blue-800 border-blue-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getProgressPercentage = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0
  }

  if (!currentProject) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-muted-foreground">
        <FolderOpen className="h-4 w-4" />
        <span>No Project</span>
      </div>
    )
  }

  return (
    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="w-full justify-between px-3 py-2 h-auto hover:bg-accent/10"
          disabled={componentIsLoading}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex-shrink-0">
              <FolderOpen className="h-5 w-5 text-black" />
            </div>
            <div className="flex flex-col items-start min-w-0 flex-1">
              <div className="flex items-center gap-2 w-full">
                <span className="font-medium text-foreground truncate">
                  {currentProject.name}
                </span>
                <Badge className={cn("text-xs", getStatusColor(currentProject.status))} variant="secondary">
                  {currentProject.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground w-full">
                <span>{getProgressPercentage(currentProject.completedTasks, currentProject.tasksCount)}% complete</span>
                <span>•</span>
                <span>{currentProject.completedTasks}/{currentProject.tasksCount} tasks</span>
              </div>
            </div>
          </div>
          {componentIsLoading ? (
            <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 flex-shrink-0" />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80" align="start">
        <DropdownMenuLabel className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4" />
          Switch Project
        </DropdownMenuLabel>
        
        <div className="px-2 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Separator />

        <div className="max-h-60 overflow-y-auto">
          {filteredProjects.map((project) => (
            <DropdownMenuItem
              key={project.id}
              className="flex items-center gap-3 p-3 cursor-pointer"
              onSelect={() => handleProjectSelect(project.id)}
            >
              <div className="flex-shrink-0">
                <FolderOpen className="h-4 w-4 text-black" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium truncate">{project.name}</span>
                  <Badge className={cn("text-xs", getStatusColor(project.status))} variant="secondary">
                    {project.status}
                  </Badge>
                  {project.id === currentProjectId && (
                    <Check className="h-4 w-4 text-black" />
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{getProgressPercentage(project.completedTasks, project.tasksCount)}% complete</span>
                  <span>•</span>
                  <span>{project.completedTasks}/{project.tasksCount} tasks</span>
                </div>
                
                <div className="w-full bg-muted rounded-full h-1 mt-1">
                  <div 
                    className="bg-black h-1 rounded-full transition-all duration-300" 
                    style={{ width: `${getProgressPercentage(project.completedTasks, project.tasksCount)}%` }}
                  />
                </div>
              </div>
            </DropdownMenuItem>
          ))}
        </div>

        <Separator />
        
        <DropdownMenuItem className="flex items-center gap-2 p-3">
          <Plus className="h-4 w-4" />
          <span>Create New Project</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Sidebar Component
function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const sidebarItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
    { name: "Creative Tracker", href: "/dashboard/creative-tracker", icon: Target },
    { name: "Customer Avatars", href: "/dashboard/customer-avatars", icon: Users },
    { name: "Competitor Analysis", href: "/dashboard/competitors", icon: Building2 },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ]

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname === href || (pathname && pathname.startsWith(href))
  }

  const toggleSidebar = () => setCollapsed(!collapsed)

  return (
    <aside
      className={cn(
        "flex flex-col h-screen border-r border-border bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Project Selector Header */}
      <div className="h-16 flex items-center px-4 border-b border-border">
        {collapsed ? (
          <div className="w-full flex justify-center">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent">
              <span className="text-sm font-semibold text-black">
                GC
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

          return (
            <div key={item.name}>
              <Link 
                href={item.href} 
                className={cn(
                  "flex items-center rounded-md text-sm transition-colors h-10",
                  isActive(item.href)
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                  collapsed ? "justify-center px-0" : "px-3",
                )}
              >
                <Icon
                  className={cn(
                    isActive(item.href) ? "text-black" : "",
                    collapsed ? "h-5 w-5" : "h-4 w-4 mr-3",
                  )}
                />
                {!collapsed && <span className="flex-1 text-left">{item.name}</span>}
              </Link>
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
  )
}

// Topbar Component
function Topbar() {
  const [theme, setTheme] = useState("light")
  const pageTitle = "Project Dashboard"

  // Mock user data
  const user = {
    name: "John Doe",
    email: "john@example.com",
    avatar: null,
    initials: "JD"
  }

  const handleSignOut = () => {
    console.log("Sign out clicked")
  }

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
  }

  return (
    <div className="sticky top-0 z-50 h-16 border-b border-border/20 flex items-center justify-between px-3 md:px-4 bg-card/80 backdrop-blur-md">
      {/* Left: Page Title */}
      <div className="flex items-center gap-3 ml-4">
        <h1 className="text-xl font-semibold text-foreground">{pageTitle}</h1>
      </div>
      
      {/* Right: Controls */}
      <div className="flex items-center gap-2 md:gap-3 ml-auto">
        {/* Balance Display */}
        <div className="hidden md:flex bg-muted rounded-full px-4 py-1.5 items-center border border-border">
          <span className="text-sm font-medium text-foreground">
            $2,500.00
          </span>
        </div>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar || ""} alt="User" />
                <AvatarFallback className="bg-black text-white">
                  {user.initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 bg-popover border-border p-0">
            <div className="px-4 py-3 border-b border-border">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-popover-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground">Pro Plan</p>
              </div>
            </div>

            <div className="py-2">
              <Link href="/dashboard/settings/account">
                <DropdownMenuItem className="text-popover-foreground hover:bg-accent px-4 py-2">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
              </Link>
              <Link href="/dashboard/settings">
                <DropdownMenuItem className="text-popover-foreground hover:bg-accent px-4 py-2">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
              </Link>
            </div>

            <DropdownMenuSeparator className="bg-border" />

            <div className="py-2">
              <DropdownMenuItem className="text-popover-foreground hover:bg-accent px-4 py-2">
                <Moon className="h-4 w-4 mr-2" />
                Theme
                <div className="ml-auto flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-6 w-6 rounded-sm ${theme === 'system' ? 'bg-accent' : ''}`}
                    onClick={() => handleThemeChange('system')}
                  >
                    <Monitor className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-6 w-6 rounded-sm ${theme === 'light' ? 'bg-accent' : ''}`}
                    onClick={() => handleThemeChange('light')}
                  >
                    <Sun className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-6 w-6 rounded-sm ${theme === 'dark' ? 'bg-accent' : ''}`}
                    onClick={() => handleThemeChange('dark')}
                  >
                    <Moon className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </DropdownMenuItem>
            </div>

            <DropdownMenuSeparator className="bg-border" />

            <div className="py-2">
              <DropdownMenuItem className="text-popover-foreground hover:bg-accent px-4 py-2" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </div>

            <div className="p-2 border-t border-border">
              <Button
                className="w-full bg-black hover:bg-black/90 text-white border-0"
                size="sm"
              >
                Upgrade Plan
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// Main App Shell Component
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

// Example usage with sample content
export function AppShellDemo() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome to Blightstone CRM</h1>
          <p className="text-muted-foreground">Your internal project management dashboard</p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="font-semibold mb-2">Active Projects</h3>
            <p className="text-2xl font-bold">3</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="font-semibold mb-2">Tasks Completed</h3>
            <p className="text-2xl font-bold">16</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="font-semibold mb-2">Overall Progress</h3>
            <p className="text-2xl font-bold">68%</p>
          </div>
        </div>
      </div>
    </AppShell>
  )
}