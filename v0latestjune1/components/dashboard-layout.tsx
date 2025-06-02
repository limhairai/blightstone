import type React from "react"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto p-6">{children}</div>
    </div>
  )
}
