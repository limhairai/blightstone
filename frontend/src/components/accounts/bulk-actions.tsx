"use client"

import { Button } from "../ui/button"
import { Download, Archive, Trash2 } from "lucide-react"

interface BulkActionsProps {
  selectedCount: number
  onClearSelection: () => void
}

export function BulkActions({ selectedCount, onClearSelection: _onClearSelection }: BulkActionsProps) {
  return (
    <div
      className="flex items-center justify-between bg-card border border-border rounded-md px-4 py-3"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm">{selectedCount} accounts selected</span>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" className="h-9 px-3 text-[#888888] hover:text-white hover:bg-[#222222]">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
        <Button variant="ghost" size="sm" className="h-9 px-3 text-[#888888] hover:text-white hover:bg-[#222222]">
          <Archive className="mr-2 h-4 w-4" />
          Archive
        </Button>
        <Button variant="ghost" size="sm" className="h-9 px-3 text-muted-foreground hover:text-muted-foreground hover:bg-[#222222]">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  )
}
