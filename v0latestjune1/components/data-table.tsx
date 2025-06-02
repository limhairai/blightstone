import type React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Lock } from "lucide-react"
import { StatusBadge } from "@/components/status-badge"

interface DataTableProps {
  data: any[]
  columns: {
    key: string
    header: string
    render?: (value: any, row: any) => React.ReactNode
  }[]
}

export function DataTable({ data, columns }: DataTableProps) {
  return (
    <div className="rounded-md border border-border overflow-hidden">
      <Table>
        <TableHeader className="bg-secondary/30">
          <TableRow className="border-b-border hover:bg-transparent">
            {columns.map((column) => (
              <TableHead key={column.key} className="text-muted-foreground">
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, i) => (
            <TableRow key={i} className="border-b-border hover:bg-secondary/10">
              {columns.map((column) => (
                <TableCell key={column.key} className="font-medium">
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// Example usage
export function StockTable() {
  const stockData = [
    {
      symbol: "AMZN",
      name: "Amazon.com Inc",
      price: 178.52,
      change: "+6.13%",
      status: "active",
      volume: "12.05M",
    },
    {
      symbol: "NVDA",
      name: "Nvidia Corp",
      price: 442.96,
      change: "-1.30%",
      status: "pending",
      volume: "85.52k",
    },
  ]

  const columns = [
    {
      key: "symbol",
      header: "Symbol",
      render: (value: string, row: any) => (
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono">{value}</span>
        </div>
      ),
    },
    { key: "name", header: "Name" },
    { key: "price", header: "Price", render: (value: number) => `$${value.toFixed(2)}` },
    {
      key: "change",
      header: "Change",
      render: (value: string) => (
        <span className={value.startsWith("+") ? "text-green-400" : "text-red-400"}>{value}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (value: string) => <StatusBadge status={value as any} size="sm" />,
    },
    { key: "volume", header: "Volume" },
  ]

  return <DataTable data={stockData} columns={columns} />
}
