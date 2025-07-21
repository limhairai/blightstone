import { useState, useEffect, useMemo, useCallback } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, ChevronLeft, ChevronRight, MoreHorizontal, Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDebounce } from 'use-debounce'

interface AdminDataTableProps<T> {
  data: T[]
  columns: Array<{
    key: keyof T
    label: string
    sortable?: boolean
    searchable?: boolean
    render?: (value: any, item: T) => React.ReactNode
    width?: string | number
  }>
  searchPlaceholder?: string
  filters?: Array<{
    key: keyof T
    label: string
    options: Array<{ value: string; label: string; count?: number }>
  }>
  serverSide?: {
    totalCount: number
    currentPage: number
    pageSize: number
    onPageChange: (page: number) => void
    onSearch: (query: string) => void
    onFilter: (filters: Record<string, string>) => void
    onSort: (column: keyof T, direction: 'asc' | 'desc') => void
    loading?: boolean
  }
  actions?: (item: T) => React.ReactNode
  emptyState?: React.ReactNode
  className?: string
}

export function AdminDataTable<T extends Record<string, any>>({
  data,
  columns,
  searchPlaceholder = "Search...",
  filters = [],
  serverSide,
  actions,
  emptyState,
  className
}: AdminDataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500)
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  
  // Local pagination state for client-side mode
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 25

  // Notify server of search changes
  useEffect(() => {
    if (serverSide?.onSearch && debouncedSearchQuery !== searchQuery) {
      serverSide.onSearch(debouncedSearchQuery)
    }
  }, [debouncedSearchQuery, serverSide])

  // Notify server of filter changes
  useEffect(() => {
    if (serverSide?.onFilter) {
      serverSide.onFilter(activeFilters)
    }
  }, [activeFilters, serverSide])

  // Handle sorting
  const handleSort = useCallback((column: keyof T) => {
    const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc'
    setSortColumn(column)
    setSortDirection(newDirection)
    
    if (serverSide?.onSort) {
      serverSide.onSort(column, newDirection)
    }
  }, [sortColumn, sortDirection, serverSide])

  // Handle filter changes
  const handleFilterChange = useCallback((filterKey: keyof T, value: string) => {
    setActiveFilters(prev => {
      if (value === 'all' || value === '') {
        const { [filterKey]: removed, ...rest } = prev
        return rest
      }
      return { ...prev, [filterKey]: value }
    })
  }, [])

  // Clear filters
  const clearFilters = useCallback(() => {
    setActiveFilters({})
    setSearchQuery('')
  }, [])

  // Client-side filtering and sorting (when not using server-side)
  const processedData = useMemo(() => {
    if (serverSide) return data

    let filtered = data

    // Apply search
    if (debouncedSearchQuery) {
      const searchableColumns = columns.filter(col => col.searchable !== false)
      filtered = filtered.filter(item =>
        searchableColumns.some(col => {
          const value = item[col.key]
          return value?.toString().toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        })
      )
    }

    // Apply filters
    filtered = filtered.filter(item => {
      return Object.entries(activeFilters).every(([key, value]) => {
        return item[key]?.toString() === value
      })
    })

    // Apply sorting
    if (sortColumn) {
      filtered.sort((a, b) => {
        const aVal = a[sortColumn]
        const bVal = b[sortColumn]
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          const result = aVal.localeCompare(bVal)
          return sortDirection === 'asc' ? result : -result
        }
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
        }
        
        return 0
      })
    }

    return filtered
  }, [data, debouncedSearchQuery, activeFilters, sortColumn, sortDirection, columns, serverSide])

  // Pagination calculations
  const totalCount = serverSide?.totalCount ?? processedData.length
  const totalPages = Math.ceil(totalCount / (serverSide?.pageSize ?? pageSize))
  const page = serverSide?.currentPage ?? currentPage
  
  // Get current page data for client-side pagination
  const paginatedData = useMemo(() => {
    if (serverSide) return processedData
    
    const startIndex = (currentPage - 1) * pageSize
    return processedData.slice(startIndex, startIndex + pageSize)
  }, [processedData, currentPage, pageSize, serverSide])

  // Handle page changes
  const handlePageChange = useCallback((newPage: number) => {
    if (serverSide?.onPageChange) {
      serverSide.onPageChange(newPage)
    } else {
      setCurrentPage(newPage)
    }
  }, [serverSide])

  const activeFilterCount = Object.keys(activeFilters).length

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {filters.map((filter) => (
            <Select
              key={filter.key as string}
                             value={activeFilters[filter.key as string] || 'all'}
              onValueChange={(value) => handleFilterChange(filter.key, value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  All {filter.label} ({filter.options.reduce((sum, opt) => sum + (opt.count || 0), 0)})
                </SelectItem>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label} {option.count !== undefined && `(${option.count})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
          
          {activeFilterCount > 0 && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear ({activeFilterCount})
            </Button>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Showing {paginatedData.length} of {totalCount.toLocaleString()} results
          {debouncedSearchQuery && ` for "${debouncedSearchQuery}"`}
        </div>
        
        {serverSide?.loading && (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Loading...
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key as string}
                  className={cn(
                    "text-left",
                    column.sortable !== false && "cursor-pointer hover:bg-muted/50",
                    column.width && { width: column.width }
                  )}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable !== false && sortColumn === column.key && (
                      <span className="text-xs">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
              {actions && <TableHead className="w-[50px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="h-24 text-center">
                  {emptyState || (
                    <div className="text-muted-foreground">
                      {debouncedSearchQuery || activeFilterCount > 0 
                        ? "No results found. Try adjusting your search or filters."
                        : "No data available."
                      }
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={column.key as string}>
                      {column.render 
                        ? column.render(item[column.key], item)
                        : item[column.key]?.toString() || '—'
                      }
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell>
                      {actions(item)}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1 || serverSide?.loading}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i
                if (pageNum > totalPages) return null
                
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    disabled={serverSide?.loading}
                    className="w-9"
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || serverSide?.loading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 