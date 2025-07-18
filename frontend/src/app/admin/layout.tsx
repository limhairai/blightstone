"use client";

import React from "react";
import dynamic from "next/dynamic";
import { AdminAccessCheck } from "../../components/admin/admin-access-check"
import { AdminProvider } from "../../contexts/AdminContext";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminPerformance, initializeAdminPerformance } from "@/lib/admin-performance";
import { AdminPerformanceMonitor } from "@/components/admin/admin-performance-monitor";

// Lazy load admin components for better performance
const AdminSidebar = dynamic(() => import("../../components/admin/admin-sidebar").then(mod => ({ default: mod.AdminSidebar })), {
  loading: () => <Skeleton className="h-full w-64" />,
  ssr: false
});

const AdminTopbar = dynamic(() => import("../../components/admin/admin-topbar").then(mod => ({ default: mod.AdminTopbar })), {
  loading: () => <Skeleton className="h-16 w-full" />,
  ssr: false
});

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [pageTitle, setPageTitle] = useState("Dashboard");
  
  // Initialize admin performance optimizations
  const adminPerformance = useAdminPerformance();
  
  useEffect(() => {
    initializeAdminPerformance();
  }, []);

  const getPageInfo = useCallback(() => {
    const segments = (pathname || "").split("/").filter(Boolean);
    
    // Remove 'admin' from the beginning if present
    const relevantSegments = segments[0] === "admin" ? segments.slice(1) : segments;
    
    if (relevantSegments.length === 0) {
      return { title: "Dashboard" };
    }

    // Handle specific admin routes
    const routeMap: Record<string, string> = {
      "organizations": "Organizations",
      "applications": "Applications",
      "teams": "Teams",
      "assets": "Assets",
      "businesses": "Businesses",
      "analytics": "Analytics",
      "stats": "Statistics",
      "activity": "Activity Log",
      "files": "Files",
      "support": "Support",
      "infrastructure": "Infrastructure",
      "access-codes": "Access Codes",
      "finances": "Finances",
      "revenue": "Revenue"
    };

    const firstSegment = relevantSegments[0];
    if (routeMap[firstSegment]) {
      return { title: routeMap[firstSegment] };
    }

    // Handle nested routes
    if (relevantSegments.length > 1) {
      const parentRoute = routeMap[firstSegment];
      const childRoute = relevantSegments[1].charAt(0).toUpperCase() + relevantSegments[1].slice(1).replace(/-/g, " ");
      return { 
        title: parentRoute ? `${parentRoute} - ${childRoute}` : childRoute
      };
    }

    // Fallback: capitalize the last segment
    const lastSegment = segments[segments.length - 1] || "dashboard";
    return { 
      title: lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, " ")
    };
  }, [pathname]);

  useEffect(() => {
    const { title } = getPageInfo();
    setPageTitle(title);
  }, [getPageInfo]);

  return (
    <AdminProvider>
      <div className="flex h-screen bg-background">
        {/* Admin Sidebar */}
        <AdminSidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Admin Top Bar with dynamic title */}
          <AdminTopbar pageTitle={pageTitle} />
          
          {/* Page Content with padding */}
          <main className="flex-1 overflow-y-auto bg-background p-6">
            {children}
          </main>
        </div>
        
        {/* Dev tools removed for cleaner production UI */}
        
        {/* Removed duplicate Toaster - using root layout's DynamicToaster */}
        
        {/* Performance Monitor */}
        <AdminPerformanceMonitor />
      </div>
    </AdminProvider>
  );
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAccessCheck>
      <AdminShell>
        {children}
      </AdminShell>
    </AdminAccessCheck>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
} 