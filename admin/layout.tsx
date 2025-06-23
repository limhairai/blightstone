"use client"

import type React from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Toaster } from "sonner"
import { AdminTopbar } from "@/components/admin/admin-topbar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopbar />
        <main className="flex-1 overflow-auto p-6 min-h-0">{children}</main>
      </div>
      <Toaster />
    </div>
  )
}
