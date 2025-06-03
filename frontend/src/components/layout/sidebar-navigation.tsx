"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import type { NavItem } from "@/types/nav"

interface SidebarNavigationProps {
  isAdmin?: boolean
}

export function SidebarNavigation({ isAdmin = false }: SidebarNavigationProps) {
  const [isOpen, setIsOpen] = useState(true)

  return <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} isAdmin={isAdmin} />
}
