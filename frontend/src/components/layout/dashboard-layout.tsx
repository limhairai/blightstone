import type React from "react"
import { AppShell } from "@/components/layout/app-shell"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">{children}</div>
      </div>
    </AppShell>
  )
}
