"use client";
import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function AdminOrgTransactionsTable({ orgId, isSuperuser }: { orgId: string, isSuperuser: boolean }) {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (!isSuperuser) return;
    setLoading(true)
    setError("")
    fetch(`/api/v1/organizations/${orgId}/transactions?limit=${pageSize}&offset=${(page-1)*pageSize}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch org transactions")
        return res.json()
      })
      .then(data => {
        setTransactions(data.transactions || [])
        setTotal(data.total || 0)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [orgId, isSuperuser, page, pageSize])

  if (!isSuperuser) return <div className="p-4 text-center text-red-500">Not authorized</div>
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>
  if (loading) return <div className="p-4 text-center">Loading org transactions...</div>

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Gross</TableHead>
            <TableHead>Fee</TableHead>
            <TableHead>Net</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell>{tx.date || tx.timestamp || '-'}</TableCell>
              <TableCell>{tx.type}</TableCell>
              <TableCell>${tx.grossAmount?.toLocaleString() ?? '-'}</TableCell>
              <TableCell>${tx.fee?.toLocaleString() ?? '-'}</TableCell>
              <TableCell>${tx.netAmount?.toLocaleString() ?? '-'}</TableCell>
              <TableCell>{tx.status || 'confirmed'}</TableCell>
            </TableRow>
          ))}
          {!transactions.length && <TableRow><TableCell colSpan={6} className="text-center p-4">No transactions found.</TableCell></TableRow>}
        </TableBody>
      </Table>
      {/* Pagination Controls */}
      <div className="flex flex-wrap gap-2 justify-between items-center p-4 border-t border-border">
        <button className="px-4 py-2 border rounded disabled:opacity-50" onClick={() => setPage(page-1)} disabled={page === 1 || loading}>Prev</button>
        <span className="text-sm text-muted-foreground">Page</span>
        <input
          type="number"
          min={1}
          max={Math.max(1, Math.ceil(total / pageSize))}
          value={page}
          onChange={e => setPage(Math.max(1, Math.min(Number(e.target.value), Math.ceil(total / pageSize))))}
          className="w-12 text-center border rounded bg-transparent"
          disabled={loading}
        />
        <span className="text-sm text-muted-foreground">of {Math.max(1, Math.ceil(total / pageSize))}</span>
        <button className="px-4 py-2 border rounded disabled:opacity-50" onClick={() => setPage(page+1)} disabled={page * pageSize >= total || loading}>Next</button>
        <select
          value={pageSize}
          onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
          className="ml-4 border rounded px-2 py-1"
          disabled={loading}
        >
          {[10, 20, 50, 100].map(size => (
            <option key={size} value={size}>{size} / page</option>
          ))}
        </select>
      </div>
    </div>
  )
} 