"use client";

import React from 'react';
import { SuperuserProvider } from "@/contexts/SuperuserContext";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { useSuperuser } from "@/contexts/SuperuserContext";
import { Loader } from "@/components/core/Loader";
import dynamicImport from 'next/dynamic';

const AdminPageContent = dynamicImport(() => import('@/components/admin/AdminPageContent'), {
  loading: () => <Loader fullScreen />,
  ssr: false, // Don't run on server, defer to client side
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
      <SuperuserProvider>
        <AdminPageContent>{children}</AdminPageContent>
      </SuperuserProvider>
  );
} 