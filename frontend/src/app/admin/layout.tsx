"use client";

import React from "react";
import { useSuperuser, useAppData } from "../../contexts/AppDataContext"
import { Loader } from "../../components/core/Loader";
import { Toaster } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { AdminSidebar } from "../../components/admin/admin-sidebar";
import { AdminTopbar } from "../../components/admin/admin-topbar";
import { Button } from "../../components/ui/button";
import { Shield, RefreshCw } from "lucide-react";
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
  const { user } = useAuth()
  
  // State for UI
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [adminDataLoaded, setAdminDataLoaded] = React.useState(false)
  
  // Call all hooks at the top - they must be called unconditionally
  const { isSuperuser, loading, error, refreshStatus } = useSuperuser()
  const { adminGetAllData, state } = useAppData()

  // Load admin data when layout mounts and user is verified as superuser
  React.useEffect(() => {
    if (isSuperuser && !adminDataLoaded && !loading) {
      adminGetAllData().then(() => {
        setAdminDataLoaded(true)
      });
    }
  }, [isSuperuser, adminDataLoaded, loading, adminGetAllData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshStatus();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
        <div className="p-8 bg-card rounded-lg shadow-xl max-w-md text-center">
          <Shield className="h-12 w-12 text-[#c4b5fd] mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Verifying Admin Access</h2>
          <p className="text-muted-foreground mb-6">
            Please wait while we verify your credentials...
          </p>
          <Loader />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
        <div className="p-8 bg-card rounded-lg shadow-xl max-w-md text-center">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-destructive mb-4">Authentication Error</h1>
          <p className="text-muted-foreground mb-6">
            {error}
          </p>
          <Button 
            onClick={handleRefresh} 
            variant="outline"
            className="w-full"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Retrying...' : 'Retry'}
          </Button>
        </div>
      </div>
    );
  }

  if (!isSuperuser) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
        <div className="p-8 bg-card rounded-lg shadow-xl max-w-md text-center">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-destructive mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You are not authorized to view this page. Please contact an administrator if you believe this is an error.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => window.location.href = '/dashboard'} 
              variant="outline"
              className="w-full"
            >
              Return to Dashboard
            </Button>
            <Button 
              onClick={handleRefresh} 
              variant="ghost"
              size="sm"
              className="w-full"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Retrying...' : 'Retry Verification'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminShell>
      {children}
      <Toaster />
    </AdminShell>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
} 