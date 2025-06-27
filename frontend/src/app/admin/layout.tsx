"use client";

import React from "react";
import { AdminAccessCheck } from "../../components/admin/admin-access-check"
import { Toaster } from "sonner";
import { AdminSidebar } from "../../components/admin/admin-sidebar";
import { AdminTopbar } from "../../components/admin/admin-topbar";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [pageTitle, setPageTitle] = useState("");

  // Dynamic page title extraction for admin pages
  const getPageInfo = useCallback(() => {
    if (!pathname) return { title: "Admin Dashboard" };

    // Map of admin paths to their display titles
    const pathInfo: Record<string, { title: string }> = {
      "/admin": { title: "Dashboard" },
      "/admin/teams": { title: "Teams" },
      "/admin/applications": { title: "Applications" }, 
      "/admin/assets": { title: "Assets" },
      "/admin/organizations": { title: "Organizations" },
      "/admin/businesses": { title: "Businesses" },
      "/admin/transactions": { title: "Transactions" },
      "/admin/transactions/topups": { title: "Top-up Requests" },
      "/admin/transactions/history": { title: "Transaction History" },
      "/admin/applications/history": { title: "Application History" },
      "/admin/access-codes": { title: "Access Codes" },
      "/admin/analytics": { title: "Analytics" },
      "/admin/stats": { title: "Statistics" },
      "/admin/infrastructure": { title: "Infrastructure" },
      "/admin/finances": { title: "Finances" },
      "/admin/files": { title: "Files" },
      "/admin/workflow": { title: "Workflow" },
      "/admin/workflow-guide": { title: "Workflow Guide" },
      "/admin/notes": { title: "Notes" },
      "/admin/activity": { title: "Activity" },
      "/admin/tasks": { title: "Tasks" },
    };

    // Check for exact match first
    if (pathInfo[pathname]) {
      return pathInfo[pathname];
    }

    // Handle dynamic routes (e.g., /admin/teams/123)
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length >= 2) {
      const baseRoute = `/${segments[0]}/${segments[1]}`;
      if (pathInfo[baseRoute]) {
        return pathInfo[baseRoute];
      }
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
    </div>
  );
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAccessCheck>
      <AdminShell>
        {children}
        <Toaster />
      </AdminShell>
    </AdminAccessCheck>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
} 