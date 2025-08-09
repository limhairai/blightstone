"use client"

import type React from "react"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface FunnelLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  showBackButton?: boolean
  backButtonUrl?: string
  backButtonText?: string
}

export function FunnelLayout({
  children,
  title,
  subtitle,
  showBackButton = false,
  backButtonUrl = "/dashboard",
  backButtonText = "Back to dashboard",
}: FunnelLayoutProps) {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      <header className="border-b border-[#222222] py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-2xl font-bold">
            <span className="text-foreground font-inter font-bold">Blightstone</span>
          </Link>

          {showBackButton && (
            <Link href={backButtonUrl} className="flex items-center text-sm text-[#B6BEC4] hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {backButtonText}
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1">
        <div className="text-center pt-12 pb-10">
          <h1 className={`text-4xl font-bold mb-4`}>{title}</h1>
          {subtitle && <p className="text-[#B6BEC4] max-w-2xl mx-auto">{subtitle}</p>}
        </div>

        {children}
      </main>

      <footer className="py-8 border-t border-[#222222] mt-16">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-muted-foreground font-inter">© 2025 Blightstone. All rights reserved.</p>
          </div>
          <div className="flex gap-6">
            <Link href="/terms" className="text-sm text-[#666666] hover:text-[#B6BEC4]">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm text-[#666666] hover:text-[#B6BEC4]">
              Privacy
            </Link>
            <Link href="/help" className="text-sm text-[#666666] hover:text-[#B6BEC4]">
              Help
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
