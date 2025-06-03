"use client";

import React from 'react';
import { SuperuserProvider, useSuperuser } from "@/contexts/SuperuserContext";
import { Providers } from "@/components/providers";
import { Loader } from "@/components/Loader";

// This component will consume the context and render children or auth messages.
function AdminPageContent({ children }: { children: React.ReactNode }) {
  const { isSuperuser, loading, error } = useSuperuser();

  if (loading) return <Loader fullScreen />;
  if (error) return <div className="p-4 text-center text-red-500">Error: {error}</div>;
  if (!isSuperuser) return <div className="p-4 text-center text-red-500">Not authorized for admin access.</div>;

  return <>{children}</>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers> {/* Existing global providers */}
      <SuperuserProvider>
        <AdminPageContent>{children}</AdminPageContent>
      </SuperuserProvider>
    </Providers>
  );
} 