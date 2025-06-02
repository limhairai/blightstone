"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

export function Loader({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <div
      className={cn(
        fullScreen ? "fixed inset-0 z-50 flex items-center justify-center bg-background/80 dark:bg-background/80" : "flex items-center justify-center",
        "transition-opacity duration-300 animate-fadeIn"
      )}
      role="status"
      aria-label="Loading"
    >
      <Loader2 className="animate-spin h-8 w-8 text-primary" />
    </div>
  )
} 