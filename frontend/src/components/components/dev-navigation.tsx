"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const devRoutes = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/dashboard/accounts", label: "Accounts" },
  { path: "/dashboard/wallet", label: "Wallet" },
  { path: "/dashboard/wallet/transactions", label: "Transactions" },
  { path: "/dashboard/settings", label: "Settings" },
]

export function DevNavigation() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  if (process.env.NODE_ENV === "production") {
    return null
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
        isOpen ? "translate-x-0" : "translate-x-[calc(100%-40px)]"
      }`}
    >
      <div className="bg-background border border-border rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">Dev Navigation</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="space-y-2">
          {devRoutes.map((route) => (
            <Link
              key={route.path}
              href={route.path}
              className={`block px-3 py-1.5 text-sm rounded-md transition-colors ${
                pathname === route.path
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary"
              }`}
            >
              {route.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
} 