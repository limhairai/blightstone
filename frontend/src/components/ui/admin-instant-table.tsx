import React, { useState, useCallback, useMemo } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table'
import { Button } from './button'
import { Input } from './input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Checkbox } from './checkbox'
import { ChevronUp, ChevronDown, Search, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminInstantTableProps<T> {
  data: T[]
  columns: {
    key: string
    header: string
    render?: (item: T) => React.ReactNode
    sortable?: boolean
    filterable?: boolean
  }[]
  onRowClick?: (item: T) => void
  onSelectionChange?: (selectedIds: string[]) => void
  bulkActions?: {
    label: string
    action: (ids: string[]) => void | Promise<void>
    variant?: 'default' | 'destructive' | 'outline'
  }[]
  searchable?: boolean
  filterable?: boolean
  sortable?: boolean
  selectable?: boolean
  idField?: keyof T
  className?: string
}

export function AdminInstantTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  onSelectionChange,
  bulkActions,
  searchable = true,
  filterable = true,
  sortable = true,
  selectable = false,
  idField = 'id' as keyof T,
  className
}: AdminInstantTableProps<T>) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<Record<string, any>>({})

  // Instant row selection
  const toggleRowSelection = useCallback((id: string) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  // Instant sorting
  const sortData = useCallback((key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { key, direction: 'asc' }
    })
  }, [])

  // Instant filtering
  const updateFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }, [])

  // Filter and sort data
  const filteredData = useMemo(() => {
    let result = [...data]

    // Apply search
    if (searchTerm) {
      result = result.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        result = result.filter(item => {
          const itemValue = item[key]
          if (typeof value === 'string') {
            return String(itemValue).toLowerCase().includes(value.toLowerCase())
          }
          return itemValue === value
        })
      }
    })

    // Apply sorting
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [data, searchTerm, filters, sortConfig])

  // Select all rows (moved after filteredData definition)
  const toggleSelectAll = useCallback(() => {
    if (selectedRows.size === filteredData.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(filteredData.map(item => String(item[idField]))))
    }
  }, [selectedRows.size, filteredData, idField])

  // Update parent selection
  React.useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(Array.from(selectedRows))
    }
  }, [selectedRows, onSelectionChange])

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        {searchable && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
        
        {filterable && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {columns
              .filter(col => col.filterable)
              .map(col => (
                <Select
                  key={col.key}
                  value={filters[col.key] || ''}
                  onValueChange={(value) => updateFilter(col.key, value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder={col.header} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    {Array.from(new Set(data.map(item => item[col.key])))
                      .filter(Boolean)
                      .map(value => (
                        <SelectItem key={value} value={String(value)}>
                          {String(value)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              ))}
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectable && selectedRows.size > 0 && bulkActions && (
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground">
            {selectedRows.size} selected
          </span>
          {bulkActions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'outline'}
              size="sm"
              onClick={() => action.action(Array.from(selectedRows))}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedRows.size === filteredData.length && filteredData.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
              )}
              {columns.map(column => (
                <TableHead key={column.key} className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span>{column.header}</span>
                    {sortable && column.sortable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => sortData(column.key)}
                        className="h-6 w-6 p-0"
                      >
                        {sortConfig?.key === column.key ? (
                          sortConfig.direction === 'asc' ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )
                        ) : (
                          <div className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item, index) => {
              const itemId = String(item[idField])
              const isSelected = selectedRows.has(itemId)
              
              return (
                <TableRow
                  key={itemId}
                  className={cn(
                    'admin-table-row cursor-pointer transition-colors',
                    isSelected && 'bg-accent/50',
                    onRowClick && 'hover:bg-muted/50'
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {selectable && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleRowSelection(itemId)}
                      />
                    </TableCell>
                  )}
                  {columns.map(column => (
                    <TableCell key={column.key}>
                      {column.render ? column.render(item) : item[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Empty State */}
      {filteredData.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm || Object.values(filters).some(Boolean) 
            ? 'No results found for your search criteria.'
            : 'No data available.'
          }
        </div>
      )}
    </div>
  )
} 