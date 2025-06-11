"use client";

import React from 'react';
import { useSuperuser } from "../../contexts/SuperuserContext";
import { Loader } from "../core/Loader";

export default function AdminPageContent({ children }: { children: React.ReactNode }) {
  const { isSuperuser, loading, error } = useSuperuser();

  if (loading) return <Loader fullScreen />;
  if (error) return <div className="p-4 text-center text-red-500">Error: {error}</div>;
  if (!isSuperuser) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
        <div className="p-8 bg-card rounded-lg shadow-xl max-w-md text-center">
          <h1 className="text-3xl font-bold text-destructive mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You are not authorized to view this page. Please contact an administrator if you believe this is an error.
          </p>
          <Loader /> 
          <p className="text-sm text-muted-foreground mt-4">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 