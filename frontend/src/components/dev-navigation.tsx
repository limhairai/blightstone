"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronDown, Menu, Palette, Box, Layout, User, FileText, LayoutDashboard } from "lucide-react"

export function DevNavigation() {
  const [isOpen, setIsOpen] = useState(false)

  const sections = [
    {
      name: "Main Pages",
      routes: [
        { name: "Home", path: "/" },
        { name: "Dashboard", path: "/dashboard" },
        { name: "Empty Dashboard", path: "/empty-dashboard" },
        { name: "Accounts", path: "/accounts" },
        { name: "Wallet", path: "/wallet" },
        { name: "Transactions", path: "/wallet/transactions" },
        { name: "Settings", path: "/settings" },
        { name: "Help", path: "/help" },
      ],
    },
    {
      name: "Auth Pages",
      routes: [
        { name: "Login", path: "/login" },
        { name: "Register", path: "/register" },
        { name: "Forgot Password", path: "/forgot-password" },
        { name: "Reset Password", path: "/reset-password" },
      ],
    },
    {
      name: "Admin Pages",
      routes: [
        { name: "Admin Dashboard", path: "/admin/dashboard" },
        { name: "Admin", path: "/admin" },
        { name: "Admin Clients", path: "/admin/clients" },
        { name: "Admin Requests", path: "/admin/requests" },
        { name: "Admin Finances", path: "/admin/finances" },
        { name: "Admin Settings", path: "/admin/settings" },
      ],
    },
    {
      name: "Application Pages",
      routes: [
        { name: "Account Application", path: "/account-application" },
        { name: "Pricing", path: "/pricing" },
      ],
    },
    {
      name: "Design & Components",
      routes: [
        { name: "Components Showcase", path: "/components-showcase" },
        { name: "Style Guide", path: "/style-guide" },
        { name: "Fey Components", path: "/fey-inspired" },
        { name: "Illustrations", path: "/illustrations" },
      ],
    },
    {
      name: "Empty States",
      routes: [
        { name: "Empty Dashboard", path: "/empty-dashboard" },
        { name: "Onboarding", path: "/onboarding" },
      ],
    },
  ]

  const icons = {
    "Main Pages": <LayoutDashboard className="h-4 w-4" />,
    "Auth Pages": <User className="h-4 w-4" />,
    "Admin Pages": <Layout className="h-4 w-4" />,
    "Application Pages": <FileText className="h-4 w-4" />,
    "Design & Components": <Palette className="h-4 w-4" />,
    "Empty States": <Box className="h-4 w-4" />,
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-secondary/80 backdrop-blur-md hover:bg-secondary rounded-full h-12 w-12 shadow-lg"
      >
        {isOpen ? <ChevronDown className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {isOpen && (
        <div className="absolute bottom-14 right-0 bg-secondary/80 backdrop-blur-md p-4 rounded-lg shadow-lg border border-border w-72 max-h-[80vh] overflow-y-auto">
          <h3 className="text-sm font-medium mb-4 text-white/70">Development Navigation</h3>

          <div className="space-y-4">
            {sections.map((section) => (
              <div key={section.name} className="space-y-1">
                <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-white/50 uppercase tracking-wider">
                  {icons[section.name as keyof typeof icons]}
                  <span>{section.name}</span>
                </div>
                <div className="space-y-1 pl-2">
                  {section.routes.map((route) => (
                    <Link key={route.path} href={route.path} className="block">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-sm h-8 hover:bg-secondary/50"
                        onClick={() => setIsOpen(false)}
                      >
                        {route.name}
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
