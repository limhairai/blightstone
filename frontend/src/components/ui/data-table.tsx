"use client"

import * as React from "react"

// Simple placeholder component - replace with actual table implementation when needed
export function DataTable({ data, columns }: { data: any[]; columns: any[] }) {
  return (
    <div className="rounded-md border p-4">
      <p className="text-center text-muted-foreground">
        Data table component needs to be implemented
      </p>
      <p className="text-sm text-center text-muted-foreground mt-2">
        {data.length} items, {columns.length} columns
      </p>
    </div>
  )
} 