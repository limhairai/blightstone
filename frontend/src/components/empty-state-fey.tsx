"use client"

import { Button } from "@/components/ui/button"
import type { LucideIcon } from "lucide-react"

interface EmptyStateFeyProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  shortcut?: {
    key: string
    description: string
  }
}

export function EmptyStateFey({ icon: Icon, title, description, action, shortcut }: EmptyStateFeyProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 bg-card/20 border border-border rounded-lg">
      {Icon && (
        <div className="mb-6 p-6 rounded-full bg-secondary/10">
          <Icon className="h-12 w-12 text-muted-foreground opacity-30" />
        </div>
      )}
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>}

      {shortcut && (
        <div className="text-xs text-muted-foreground mb-6">
          {shortcut.description}{" "}
          <kbd className="inline-flex h-5 items-center justify-center rounded border border-border bg-secondary/50 px-1.5 font-mono text-xs font-medium text-muted-foreground">
            {shortcut.key}
          </kbd>
        </div>
      )}

      {action && (
        <Button onClick={action.onClick} className="bg-secondary/50 hover:bg-secondary/70 border-border">
          {action.label}
        </Button>
      )}
    </div>
  )
}
