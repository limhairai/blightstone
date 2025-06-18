# AdHub Admin Panel - Complete Code Export

## Table of Contents
1. [Layout & Navigation](#layout--navigation)
2. [Main Admin Pages](#main-admin-pages)
3. [Core Components](#core-components)
4. [Specialized Components](#specialized-components)
5. [Hooks & Utilities](#hooks--utilities)

## Layout & Navigation

### Admin Layout
```tsx
// frontend/src/app/admin/layout.tsx
"use client";

import React from 'react';
import { SuperuserProvider } from "../../contexts/SuperuserContext";
import { AdminSidebar } from "../../components/admin/admin-sidebar";
import { useSuperuser } from "../../contexts/SuperuserContext";
import { Loader } from "../../components/core/Loader";
import dynamicImport from 'next/dynamic';

const AdminPageContent = dynamicImport(() => import('../../components/admin/AdminPageContent'), {
  loading: () => <Loader fullScreen />,
  ssr: false,
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
      <SuperuserProvider>
        <AdminPageContent>{children}</AdminPageContent>
      </SuperuserProvider>
  );
}
```

### Admin Sidebar Component
```tsx
// frontend/src/components/admin/admin-sidebar.tsx
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "../../lib/utils"
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
  CreditCard,
  Building2,
  type LucideIcon,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"

interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  children?: NavItem[];
  badge?: string | number;
}

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    path: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Applications",
    path: "/admin/applications",
    icon: FileText,
    badge: "New",
    children: [
      {
        name: "All Applications",
        path: "/admin/applications",
        icon: FileText,
      },
      {
        name: "Workflow",
        path: "/admin/workflow",
        icon: Settings,
      },
    ],
  },
  {
    name: "Organizations",
    path: "/admin/organizations",
    icon: Users,
    children: [
      {
        name: "All Organizations",
        path: "/admin/organizations",
        icon: Users,
      },
      {
        name: "Businesses",
        path: "/admin/businesses",
        icon: Building2,
      },
    ],
  },
  {
    name: "Infrastructure",
    path: "/admin/infrastructure",
    icon: ShieldCheck,
    children: [
      {
        name: "Monitoring",
        path: "/admin/infrastructure",
        icon: ShieldCheck,
      },
      {
        name: "Assets",
        path: "/admin/assets",
        icon: Building2,
      },
    ],
  },
  {
    name: "Finances",
    path: "/admin/finances",
    icon: DollarSign,
  },
  {
    name: "Analytics",
    path: "/admin/analytics",
    icon: BarChart3,
  },
  {
    name: "Access Codes",
    path: "/admin/access-codes",
    icon: ShieldCheck,
  },
]

const bottomNavItems: NavItem[] = [
  {
    name: "Workflow Guide",
    path: "/admin/workflow-guide",
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

  useEffect(() => {
    const currentSection = navItems.find(
      (item) => item.children && item.children.some((child) => pathname === child.path),
    )

    if (currentSection) {
      setExpandedItem(currentSection.name)
    }
  }, [pathname])

  const toggleExpand = (item: string) => {
    if (expandedItem === item) {
      setExpandedItem(null)
    } else {
      setExpandedItem(item)
    }
  }

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
            <span className="ml-2 text-xs bg-[#b4a0ff] text-black px-2.5 py-1 rounded-full">ADMIN</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-2 space-y-1">
          {navItems.map((item) => (
            <div key={item.name}>
              {item.children ? (
                <div>
                  <button
                    onClick={() => toggleExpand(item.name)}
                    className={cn(
                      "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      "text-white hover:bg-[#1A1A1A]"
                    )}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.name}</span>
                        {item.badge && (
                          <span className="bg-[#b4a0ff] text-black text-xs px-2 py-0.5 rounded-full mr-2">
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 transition-transform",
                            expandedItem === item.name && "rotate-90"
                          )}
                        />
                      </>
                    )}
                  </button>
                  {!collapsed && expandedItem === item.name && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.path}
                          href={child.path}
                          className={cn(
                            "flex items-center px-3 py-2 text-sm rounded-md transition-colors",
                            isActive(child.path)
                              ? "bg-[#b4a0ff]/20 text-[#b4a0ff]"
                              : "text-gray-300 hover:bg-[#1A1A1A] hover:text-white"
                          )}
                        >
                          <child.icon className="h-4 w-4 mr-3" />
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.path}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive(item.path)
                      ? "bg-[#b4a0ff]/20 text-[#b4a0ff]"
                      : "text-white hover:bg-[#1A1A1A]"
                  )}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.name}</span>
                      {item.badge && (
                        <span className="bg-[#b4a0ff] text-black text-xs px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="border-t border-[#1A1A1A] p-2">
        <div className="space-y-1">
          {bottomNavItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:bg-[#1A1A1A] hover:text-white rounded-md transition-colors"
            >
              <item.icon className="h-5 w-5 mr-3" />
              {!collapsed && item.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
```

## Main Admin Pages

### Admin Dashboard
```tsx
// frontend/src/app/admin/page.tsx
"use client"

import { AdminView } from "../../components/admin/admin-view"

export const dynamic = 'force-dynamic'

export default function AdminPage() {
  return <AdminView />
}
```

### Applications Page
```tsx
// frontend/src/app/admin/applications/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { 
  ArrowLeft,
  FileText,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  Eye,
  MoreHorizontal,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { VirtualizedTable } from "../../../components/admin/VirtualizedTable";
import { useDebouncedSearch } from "../../../hooks/useDebouncedSearch";
import { adminMockData } from "../../../lib/mock-data/admin-mock-data";

export default function ApplicationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { debouncedTerm } = useDebouncedSearch(searchTerm, 300);

  const allApplications = adminMockData.getApplications();

  const filteredApplications = useMemo(() => {
    return allApplications
      .filter(application => {
        const matchesSearch = !debouncedTerm || 
          application.id.toLowerCase().includes(debouncedTerm.toLowerCase()) ||
          application.clientName.toLowerCase().includes(debouncedTerm.toLowerCase()) ||
          application.businessName.toLowerCase().includes(debouncedTerm.toLowerCase());
        
        const matchesStage = stageFilter === "all" || application.stage === stageFilter;
        const matchesType = typeFilter === "all" || application.type === typeFilter;
        const matchesPriority = priorityFilter === "all" || application.priority === priorityFilter;
        
        return matchesSearch && matchesStage && matchesType && matchesPriority;
      })
      .sort((a, b) => {
        let aVal: any, bVal: any;
        
        switch (sortBy) {
          case "createdAt":
            aVal = new Date(a.createdAt).getTime();
            bVal = new Date(b.createdAt).getTime();
            break;
          case "client":
            aVal = a.clientName;
            bVal = b.clientName;
            break;
          case "stage":
            aVal = a.stage;
            bVal = b.stage;
            break;
          case "priority":
            aVal = a.priority;
            bVal = b.priority;
            break;
          default:
            return 0;
        }
        
        if (typeof aVal === "string") {
          return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      });
  }, [allApplications, debouncedTerm, stageFilter, typeFilter, priorityFilter, sortBy, sortOrder]);

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "under_review":
        return "bg-blue-100 text-blue-800";
      case "submitted":
        return "bg-purple-100 text-purple-800";
      case "document_prep":
        return "bg-yellow-100 text-yellow-800";
      case "received":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const columns = [
    {
      key: "id",
      header: "Application ID",
      width: 120,
      render: (application: any) => (
        <div className="font-mono text-sm">{application.id}</div>
      )
    },
    {
      key: "client",
      header: "Client",
      width: 180,
      render: (application: any) => (
        <div>
          <div className="font-medium">{application.clientName}</div>
          <div className="text-sm text-muted-foreground">{application.businessName}</div>
        </div>
      )
    },
    {
      key: "stage",
      header: "Stage",
      width: 140,
      render: (application: any) => (
        <Badge className={getStageColor(application.stage)}>
          {application.stage.replace('_', ' ').toUpperCase()}
        </Badge>
      )
    },
    {
      key: "priority",
      header: "Priority",
      width: 100,
      render: (application: any) => (
        <Badge className={`text-xs ${
          application.priority === 'urgent' ? 'bg-red-100 text-red-800' :
          application.priority === 'high' ? 'bg-orange-100 text-orange-800' :
          application.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {application.priority}
        </Badge>
      )
    },
    {
      key: "actions",
      header: "Actions",
      width: 100,
      render: (application: any) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Applications Management</h1>
          <p className="text-muted-foreground">
            Review and manage all application submissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="document_prep">Document Prep</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Applications ({filteredApplications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <VirtualizedTable
            data={filteredApplications}
            columns={columns}
            height={600}
          />
        </CardContent>
      </Card>
    </div>
  );
}
```

### Access Codes Page
```tsx
// frontend/src/app/admin/access-codes/page.tsx
"use client";

import React from 'react';
import AccessCodeManager from '../../../components/admin/AccessCodeManager';

export default function AccessCodesPage() {
  const organizationId = "demo-org-123";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Access Code Management</h1>
        <p className="text-muted-foreground">
          Generate and manage secure access codes for bot authentication
        </p>
      </div>
      
      <AccessCodeManager organizationId={organizationId} organizationName="Demo Organization" />
    </div>
  );
}
```

## Core Components

### VirtualizedTable Component
```tsx
// frontend/src/components/admin/VirtualizedTable.tsx
"use client";

import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';

interface Column {
  key: string;
  header: string;
  width: number;
  render: (item: any) => React.ReactNode;
}

interface VirtualizedTableProps {
  data: any[];
  columns: Column[];
  height: number;
  rowHeight?: number;
}

export function VirtualizedTable({ 
  data, 
  columns, 
  height, 
  rowHeight = 60 
}: VirtualizedTableProps) {
  const totalWidth = useMemo(() => 
    columns.reduce((sum, col) => sum + col.width, 0), 
    [columns]
  );

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = data[index];
    
    return (
      <div 
        style={style} 
        className="flex items-center border-b border-border hover:bg-muted/50"
      >
        {columns.map((column) => (
          <div
            key={column.key}
            style={{ width: column.width }}
            className="px-4 py-2 flex items-center"
          >
            {column.render(item)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="border rounded-lg">
      {/* Header */}
      <div className="flex bg-muted/50 border-b">
        {columns.map((column) => (
          <div
            key={column.key}
            style={{ width: column.width }}
            className="px-4 py-3 font-medium text-sm"
          >
            {column.header}
          </div>
        ))}
      </div>
      
      {/* Virtualized Rows */}
      <List
        height={height}
        itemCount={data.length}
        itemSize={rowHeight}
        width={totalWidth}
      >
        {Row}
      </List>
    </div>
  );
}
```

This code export includes the core structure and key components. Would you like me to continue with more specific components like AccessCodeManager, ApplicationsReviewTable, or any other particular sections? 