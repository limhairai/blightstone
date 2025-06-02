import DashboardSidebar from "@/components/dashboard-sidebar"

import type { ReactNode } from "react"

interface AdminLayoutProps {
  children: ReactNode
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <div className="flex h-screen bg-gray-100">
      <DashboardSidebar />
      <div className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
        <main className="m-4">{children}</main>
      </div>
    </div>
  )
}

export default AdminLayout
