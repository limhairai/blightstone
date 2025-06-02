"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"

interface SidebarNavigationProps {
  isAdmin?: boolean
}

export function SidebarNavigation({ isAdmin = false }: SidebarNavigationProps) {
  const [isOpen, setIsOpen] = useState(true)

  return <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} isAdmin={isAdmin} />
}
