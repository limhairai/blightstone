"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MOCK_BUSINESSES } from "@/data/mock-businesses"
import { Search } from "lucide-react"

interface CompactFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: string
  onStatusChange: (status: string) => void
  businessFilter: string
  onBusinessChange: (business: string) => void
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
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search accounts, businesses, or IDs..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-9 bg-background border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Status Filter */}
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[140px] h-9 bg-background border-border text-foreground">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          <SelectItem value="all" className="text-popover-foreground hover:bg-accent">
            All Status
          </SelectItem>
          <SelectItem value="active" className="text-popover-foreground hover:bg-accent">
            Active
          </SelectItem>
          <SelectItem value="pending" className="text-popover-foreground hover:bg-accent">
            Pending
          </SelectItem>
          <SelectItem value="inactive" className="text-popover-foreground hover:bg-accent">
            Inactive
          </SelectItem>
          <SelectItem value="error" className="text-popover-foreground hover:bg-accent">
            Error
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Business Filter */}
      <Select value={businessFilter} onValueChange={onBusinessChange}>
        <SelectTrigger className="w-[160px] h-9 bg-background border-border text-foreground">
          <SelectValue placeholder="Business" />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          <SelectItem value="all" className="text-popover-foreground hover:bg-accent">
            All Businesses
          </SelectItem>
          {MOCK_BUSINESSES.map((business) => (
            <SelectItem key={business.id} value={business.name} className="text-popover-foreground hover:bg-accent">
              {business.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
