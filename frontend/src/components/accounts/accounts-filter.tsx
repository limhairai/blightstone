"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { SlidersHorizontal } from "lucide-react"
import { Input } from "../ui/input"

interface AccountsFilterProps {
  onFilterChange?: (filters: {
    search: string
    status: string
    sortBy: string
  }) => void
}

export function AccountsFilter({ onFilterChange }: AccountsFilterProps) {
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    sortBy: "name",
  })
  const [showFilters, setShowFilters] = useState(false)

  const handleFilterChange = (newFilters: { search: string; status: string; sortBy: string }) => {
    if (onFilterChange) {
      onFilterChange(newFilters)
    }
  }

  const handleReset = () => {
    setFilters({ search: "", status: "all", sortBy: "name" })
    if (onFilterChange) {
      onFilterChange({ search: "", status: "all", sortBy: "name" })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          className={`border-border ${showFilters ? "bg-secondary/50" : "bg-transparent"}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-4 p-4 bg-secondary/20 rounded-md border border-border">
          <div className="w-full sm:w-auto">
            <Input
              placeholder="Search accounts..."
              className="bg-[#1C1C1E] border-[#2C2C2E] focus:border-[#b19cd9] focus:ring-[#b19cd9]/20"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <div className="w-full sm:w-auto">
            <p className="text-xs text-muted-foreground mb-1.5">Status</p>
            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger className="bg-[#1C1C1E] border-[#2C2C2E] focus:border-[#b19cd9] focus:ring-[#b19cd9]/20">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-secondary/30 border-border">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-auto">
            <p className="text-xs text-muted-foreground mb-1.5">Sort By</p>
            <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value })}>
              <SelectTrigger className="w-[140px] bg-secondary/30 border-border">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-secondary/30 border-border">
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="balance">Balance</SelectItem>
                <SelectItem value="date">Date Added</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-auto flex items-end gap-2">
            <Button
              type="submit"
              className="bg-gradient-to-r from-[#b19cd9] to-[#f8c4b4] text-black hover:opacity-90"
              onClick={() => handleFilterChange(filters)}
            >
              Apply Filters
            </Button>

            <Button variant="outline" className="border-[#2C2C2E]" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 