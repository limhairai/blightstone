"use client"

import { Toaster } from "sonner"
import { useTheme } from "next-themes"

export function DynamicToaster() {
  const { theme } = useTheme()

  return (
    <Toaster 
      theme={theme as "light" | "dark" | "system" | undefined}
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          border: '1px solid hsl(var(--border))',
        },
      }}
    />
  )
} 