"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { AdHubLogo } from "@/components/core/AdHubLogo"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="border-b border-border backdrop-blur-md bg-background/50 sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/">
          <AdHubLogo size="lg" />
        </Link>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-foreground/80 hover:text-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        {/* Desktop navigation */}
        <nav className="hidden md:flex gap-8">
          <Link href="/" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            Home
          </Link>
          <Link
            href="/#features"
            className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
          >
            Features
          </Link>
          <Link
            href="/pricing"
            className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
          >
            Pricing
          </Link>
        </nav>

        {/* Mobile navigation */}
        <div
          className={cn(
            "fixed inset-0 top-16 bg-background z-40 md:hidden transition-transform transform",
            mobileMenuOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <nav className="flex flex-col p-6 space-y-4">
            <Link
              href="/"
              className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/#features"
              className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <div className="pt-4 flex flex-col gap-3">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full text-foreground/80 hover:text-foreground hover:bg-secondary">
                  Login
                </Button>
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black">
                  Get Started
                </Button>
              </Link>
            </div>
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-foreground/80 hover:text-foreground hover:bg-secondary">
              Login
            </Button>
          </Link>
          <Link href="/register">
            <Button className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
