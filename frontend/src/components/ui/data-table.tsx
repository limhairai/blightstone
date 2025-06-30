"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table"
import { Input } from "./input"
import { Search } from "lucide-react"

interface DataTableColumn {
  accessorKey: string
  header: string
  size?: number
  cell?: ({ row }: { row: { original: any; getValue: (key: string) => any } }) => React.ReactNode
}

interface DataTableProps {
  data: any[]
  columns: DataTableColumn[]
  searchKey?: string
  searchPlaceholder?: string
}

export function DataTable({ 
  data, 
  columns, 
  searchKey = "name",
  searchPlaceholder = "Search..."
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredData = useMemo(() => {
    if (!searchTerm) return data
    
    return data.filter((item) => {
      const searchValue = item[searchKey]
      if (typeof searchValue === 'string') {
        return searchValue.toLowerCase().includes(searchTerm.toLowerCase())
      }
      return false
    })
  }, [data, searchTerm, searchKey])

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-muted/50">
              {columns.map((column) => (
                <TableHead 
                  key={column.accessorKey} 
                  className="text-muted-foreground"
                  style={column.size ? { width: column.size } : undefined}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={columns.length} 
                  className="text-center py-8 text-muted-foreground"
                >
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item, index) => (
                <TableRow key={index} className="border-border hover:bg-muted/30">
                  {columns.map((column) => (
                    <TableCell key={column.accessorKey}>
                      {column.cell ? (
                        column.cell({
                          row: {
                            original: item,
                            getValue: (key: string) => item[key]
                          }
                        })
                      ) : (
                        item[column.accessorKey]
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 