"use client"

import { Button } from "@/components/ui/button"
import { LayoutGrid, List } from "lucide-react"
import { cn } from "@/lib/utils"

interface BusinessesViewToggleProps {
  view: "grid" | "list"
  onViewChange: (view: "grid" | "list") => void
}

export function BusinessesViewToggle({ view, onViewChange }: BusinessesViewToggleProps) {
  return (
    <div className="flex items-center border border-border rounded-md p-1 bg-muted/30">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange("grid")}
        className={cn("h-7 px-2", view === "grid" ? "bg-background shadow-sm" : "hover:bg-background/50")}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange("list")}
        className={cn("h-7 px-2", view === "list" ? "bg-background shadow-sm" : "hover:bg-background/50")}
      >
        <List className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
