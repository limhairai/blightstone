"use client";

import React from "react";
import { AdminAccessCheck } from "../../components/admin/admin-access-check"
import { AdminSidebar } from "../../components/admin/admin-sidebar";
import { AdminTopbar } from "../../components/admin/admin-topbar";
import { AdminProvider } from "../../contexts/AdminContext";
// Removed dev tools for production
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [pageTitle, setPageTitle] = useState("Dashboard");

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