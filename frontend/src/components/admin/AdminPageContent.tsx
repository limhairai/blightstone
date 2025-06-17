"use client";

import React, { useState } from 'react';
import { useSuperuser } from "../../contexts/SuperuserContext";
import { useAuth } from "../../contexts/AuthContext";
import { Loader } from "../core/Loader";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTopBar } from "./admin-topbar";
import { Button } from "../ui/button";
import { Shield, RefreshCw } from "lucide-react";

export default function AdminPageContent({ children }: { children: React.ReactNode }) {
  const { isSuperuser, loading, error, refreshStatus } = useSuperuser();
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshStatus();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Show loading state while verifying credentials
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

  // Show error state if there's an error
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

  // Show access denied if not superuser
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
    <div className="flex h-screen bg-background">
      {/* Admin Sidebar */}
      <AdminSidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Admin Top Bar */}
        <AdminTopBar user={user} />
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
} 