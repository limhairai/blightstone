"use client"

import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface ThemeToggleButtonProps {
  className?: string
}

export function ThemeToggleButton({ className }: ThemeToggleButtonProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className={cn("relative h-8 w-20 rounded-full bg-neutral-800 transition-colors", className)} />
  }

  const isDark = theme === "dark"

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark")
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative h-8 w-20 rounded-full transition-colors",
        isDark ? "bg-[#ffb4a0]" : "bg-[#b4a0ff]",
        className,
      )}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <div
        className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity",
          isDark ? "opacity-100" : "opacity-0",
        )}
      >
        <Moon className="h-4 w-4 text-black" />
      </div>
      <div
        className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity",
          isDark ? "opacity-0" : "opacity-100",
        )}
      >
        <Sun className="h-4 w-4 text-black" />
      </div>
    </button>
  )
}
