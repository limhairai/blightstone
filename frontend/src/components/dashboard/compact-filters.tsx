"use client"

import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { APP_BUSINESSES, APP_ACCOUNTS } from "../../lib/mock-data"
import { Search } from "lucide-react"

interface CompactFiltersProps {
  filters: {
    search: string
    status: string
    platform: string
    business: string
  }
  onFiltersChange: (filters: {
    search: string
    status: string
    platform: string
    business: string
  }) => void
}

export function CompactFilters({ filters, onFiltersChange }: CompactFiltersProps) {
  const updateFilter = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    })
  }

  // Get unique businesses and platforms from mock data
  const businesses = Array.from(new Set(APP_ACCOUNTS.map(account => account.business).filter(Boolean))) as string[]
  const platforms = Array.from(new Set(APP_ACCOUNTS.map(account => account.platform).filter(Boolean))) as string[]

  return (
    <div className="flex flex-col lg:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search accounts, businesses, or account IDs..."
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
          className="pl-10 h-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        {/* Status Filter */}
        <Select value={filters.status} onValueChange={(value) => updateFilter("status", value)}>
          <SelectTrigger className="w-[120px] h-10 bg-background border-border text-foreground">
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
            <SelectItem value="pending" className="text-popover-foreground hover:bg-accent">
              Paused
            </SelectItem>
            <SelectItem value="error" className="text-popover-foreground hover:bg-accent">
              Error
            </SelectItem>
            <SelectItem value="inactive" className="text-popover-foreground hover:bg-accent">
              Inactive
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Platform Filter */}
        <Select value={filters.platform} onValueChange={(value) => updateFilter("platform", value)}>
          <SelectTrigger className="w-[120px] h-10 bg-background border-border text-foreground">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all" className="text-popover-foreground hover:bg-accent">
              All Platforms
            </SelectItem>
            {platforms.map((platform) => (
              <SelectItem key={platform} value={platform} className="text-popover-foreground hover:bg-accent">
                {platform}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Business Filter */}
        <Select value={filters.business} onValueChange={(value) => updateFilter("business", value)}>
          <SelectTrigger className="w-[160px] h-10 bg-background border-border text-foreground">
            <SelectValue placeholder="Business" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all" className="text-popover-foreground hover:bg-accent">
              All Businesses
            </SelectItem>
            {businesses.map((business) => (
              <SelectItem key={business} value={business} className="text-popover-foreground hover:bg-accent">
                {business}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
