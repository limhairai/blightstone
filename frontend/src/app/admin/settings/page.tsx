"use client"

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic'

import { AdminTeamManagement } from "../../../components/admin/admin-team-management"
import { cn } from "../../../lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Badge } from "../../../components/ui/badge"

export default function AdminSettingsPage() {
  const pathname = usePathname()

  const tabs = [
    { name: "Team", href: "/admin/settings" },
  ]

  return (
    <div className="max-w-full mx-auto py-4">
      <div className="border-b border-border mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                "py-2 px-1 border-b-2 font-medium text-sm transition-colors",
                pathname === tab.href
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
              )}
            >
              {tab.name}
            </Link>
          ))}
        </nav>
      </div>

      <AdminTeamManagement />
    </div>
  )
} 