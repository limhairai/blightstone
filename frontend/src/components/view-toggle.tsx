"use client"

import { LayoutGrid, List } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ViewToggleProps {
  view: "table" | "grid"
  onViewChange: (view: "table" | "grid") => void
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex bg-[#111111] border border-[#333333] rounded-md overflow-hidden">
      <Button
        variant="ghost"
        size="icon"
        className={`h-10 w-10 rounded-none ${
          view === "table" ? "bg-[#222222] text-white" : "text-[#888888] hover:text-white"
        }`}
        onClick={() => onViewChange("table")}
        aria-label="List view"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-10 w-10 rounded-none ${
          view === "grid" ? "bg-[#222222] text-white" : "text-[#888888] hover:text-white"
        }`}
        onClick={() => onViewChange("grid")}
        aria-label="Grid view"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
    </div>
  )
}
