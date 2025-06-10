"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Filter, Search, ChevronDown, Building2 } from "lucide-react"

interface CompactFiltersProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusChange: (value: string) => void
  businessFilter: string
  onBusinessChange: (value: string) => void
}

export function CompactFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  businessFilter,
  onBusinessChange,
}: CompactFiltersProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Filters Button */}
      <Button variant="outline" size="sm" className="h-8 border-border bg-background hover:bg-accent">
        <Filter className="h-3 w-3 mr-2" />
        Filters
      </Button>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <Input
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8 w-48 pl-8 bg-background border-border text-sm"
        />
      </div>

      {/* Status Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 border-border bg-background hover:bg-accent">
            Status
            <ChevronDown className="h-3 w-3 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-popover border-border">
          <DropdownMenuItem onClick={() => onStatusChange("all")} className="text-popover-foreground hover:bg-accent">
            All Statuses
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onStatusChange("active")}
            className="text-popover-foreground hover:bg-accent"
          >
            Active
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onStatusChange("pending")}
            className="text-popover-foreground hover:bg-accent"
          >
            Pending
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onStatusChange("inactive")}
            className="text-popover-foreground hover:bg-accent"
          >
            Inactive
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onStatusChange("error")} className="text-popover-foreground hover:bg-accent">
            Failed
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Business Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 border-border bg-background hover:bg-accent">
            <Building2 className="h-3 w-3 mr-2" />
            Business
            <ChevronDown className="h-3 w-3 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-popover border-border">
          <DropdownMenuItem onClick={() => onBusinessChange("all")} className="text-popover-foreground hover:bg-accent">
            All Businesses
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onBusinessChange("TechFlow Solutions")}
            className="text-popover-foreground hover:bg-accent"
          >
            TechFlow Solutions
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onBusinessChange("Digital Marketing Co")}
            className="text-popover-foreground hover:bg-accent"
          >
            Digital Marketing Co
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onBusinessChange("StartupHub Inc")}
            className="text-popover-foreground hover:bg-accent"
          >
            StartupHub Inc
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
