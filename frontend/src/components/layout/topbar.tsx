"use client"

import { Bell, Search, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { usePageTitle } from "@/components/core/providers"

interface TopbarProps {
  isAdmin?: boolean
  hasNotifications?: boolean
}

export function Topbar({ isAdmin = false, hasNotifications = false }: TopbarProps) {
  const { pageTitle } = usePageTitle();

  return (
    <header className="border-b border-border h-16 flex items-center justify-between px-4 md:px-6 bg-card">
      <div className="flex items-center gap-3">
        {isAdmin && (
          <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
            <Shield className="h-3 w-3 mr-1" /> Admin Mode
          </Badge>
        )}
        <h1 className="text-lg font-semibold text-foreground whitespace-nowrap">
          {pageTitle || "Dashboard"}
        </h1>
      </div>
      <div className="flex items-center gap-4 md:gap-6">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search..." className="w-64 pl-8 bg-background" />
        </div>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasNotifications && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          )}
        </Button>
      </div>
    </header>
  )
}
