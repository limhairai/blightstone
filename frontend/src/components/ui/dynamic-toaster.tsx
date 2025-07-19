"use client"

import { Toaster } from "sonner"
import { useTheme } from "next-themes"

export function DynamicToaster() {
  const { theme } = useTheme()

  return (
    <Toaster 
      theme={theme as "light" | "dark" | "system" | undefined}
      position="top-right"
      expand={false}
      richColors={true}
      closeButton={true}
      offset={0}
      gap={8}
      toastOptions={{
        duration: 5000,
        style: {
          background: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          border: '1px solid hsl(var(--border))',
        },
      }}
    />
  )
} 