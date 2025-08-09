"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

interface CompactFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: string
  onStatusChange: (status: string) => void
  businessFilter: string
  onBusinessChange: (business: string) => void
  businessManagers: any[]
}

export function CompactFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  businessFilter,
  onBusinessChange,
  businessManagers,
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
          <SelectItem value="all" className="text-popover-foreground hover:bg-[#F5F5F5]">
            All Status
          </SelectItem>
          <SelectItem value="active" className="text-popover-foreground hover:bg-[#F5F5F5]">
            Active
          </SelectItem>
          <SelectItem value="pending" className="text-popover-foreground hover:bg-[#F5F5F5]">
            Pending
          </SelectItem>
          <SelectItem value="inactive" className="text-popover-foreground hover:bg-[#F5F5F5]">
            Inactive
          </SelectItem>
          <SelectItem value="restricted" className="text-popover-foreground hover:bg-[#F5F5F5]">
            Restricted
          </SelectItem>
          <SelectItem value="suspended" className="text-popover-foreground hover:bg-[#F5F5F5]">
            Suspended
          </SelectItem>
          <SelectItem value="error" className="text-popover-foreground hover:bg-[#F5F5F5]">
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
          <SelectItem value="all" className="text-popover-foreground hover:bg-[#F5F5F5]">
            All Businesses
          </SelectItem>
          {Array.isArray(businessManagers) && businessManagers.map((business: any) => (
            <SelectItem 
              key={business.id} 
              value={business.name || business.metadata?.business_manager || `BM ${business.id}`} 
              className="text-popover-foreground hover:bg-[#F5F5F5]"
            >
              {business.name || business.metadata?.business_manager || `BM ${business.id}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
