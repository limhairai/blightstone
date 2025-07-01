import { Button } from "../ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Badge } from "../ui/badge"
import { DownloadIcon, FilterIcon } from "lucide-react"
import { useAuth } from "../../contexts/AuthContext"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import useSWR from "swr"

interface Transaction {
  id: string
  date: string
  description: string
  amount: string
  status: "completed" | "pending" | "failed"
  type: "deposit" | "withdrawal" | "transfer"
}

interface TransactionTableProps {
  transactions?: Transaction[]
  showFilters?: boolean
}

export function TransactionTable({ transactions: propTransactions, showFilters = true }: TransactionTableProps) {
  const { session } = useAuth()
  const { currentOrganizationId } = useOrganizationStore()

  // Fetch transactions if not provided as props
  const { data: fetchedTransactions, isLoading } = useSWR(
    !propTransactions && session && currentOrganizationId ? ['/api/transactions', session.access_token] : null,
    async ([url, token]) => {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch transactions')
      const result = await response.json()
      const data = result.transactions || []
      
      // Transform API data to match our interface
      return data.map((t: any) => ({
        id: t.id,
        date: new Date(t.created_at).toLocaleDateString(),
        description: t.description || 'Transaction',
        amount: `$${Math.abs(t.amount_cents / 100).toFixed(2)}`,
        status: t.status || 'completed',
        type: t.type || 'deposit'
      }))
    }
  )

  // Use provided transactions or fetched transactions, with fallback to empty array
  const transactions = propTransactions || fetchedTransactions || []

  // Updated status colors to match our brand colors
  const statusColors = {
    completed:
      "bg-purple-100/80 text-purple-800 border-purple-300/50 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-700/50",
    pending:
      "bg-amber-100/80 text-amber-800 border-amber-300/50 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-700/50",
    failed: "bg-red-100/80 text-red-800 border-red-300/50 dark:bg-red-950/30 dark:text-red-300 dark:border-red-700/50",
  }

  const typeColors = {
    deposit: "text-[#34D197]",
    withdrawal: "text-red-600 dark:text-red-400",
    transfer: "text-blue-600 dark:text-blue-400",
  }

  if (isLoading && !propTransactions) {
    return (
      <div className="rounded-md border border-gray-200 dark:border-[#1A1A1A] overflow-hidden bg-white dark:bg-[#0A0A0A]">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading transactions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-md border border-gray-200 dark:border-[#1A1A1A] overflow-hidden bg-white dark:bg-[#0A0A0A]">
      {showFilters && (
        <div className="bg-gray-50 dark:bg-secondary/30 p-4 border-b border-gray-200 dark:border-[#1A1A1A] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 bg-white dark:bg-[#0A0A0A] border-gray-200 dark:border-[#1A1A1A] hover:bg-gray-50 dark:hover:bg-[#1A1A1A]"
            >
              <FilterIcon className="h-3.5 w-3.5 mr-2" />
              Filter
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 bg-white dark:bg-[#0A0A0A] border-gray-200 dark:border-[#1A1A1A] hover:bg-gray-50 dark:hover:bg-[#1A1A1A]"
            >
              All Time
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 bg-white dark:bg-[#0A0A0A] border-gray-200 dark:border-[#1A1A1A] hover:bg-gray-50 dark:hover:bg-[#1A1A1A]"
          >
            <DownloadIcon className="h-3.5 w-3.5 mr-2" />
            Export
          </Button>
        </div>
      )}
      <Table>
        <TableHeader className="bg-gray-50 dark:bg-secondary/30">
          <TableRow className="border-b-gray-200 dark:border-b-[#1A1A1A] hover:bg-transparent">
            <TableHead className="text-xs font-medium text-gray-500 dark:text-muted-foreground">Date</TableHead>
            <TableHead className="text-xs font-medium text-gray-500 dark:text-muted-foreground">Description</TableHead>
            <TableHead className="text-xs font-medium text-gray-500 dark:text-muted-foreground">Amount</TableHead>
            <TableHead className="text-xs font-medium text-gray-500 dark:text-muted-foreground">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <TableRow
                key={transaction.id}
                className="border-b-gray-200 dark:border-b-[#1A1A1A] hover:bg-gray-50 dark:hover:bg-secondary/5"
              >
                <TableCell className="text-sm">{transaction.date}</TableCell>
                <TableCell className="text-sm">{transaction.description}</TableCell>
                <TableCell className={`text-sm ${typeColors[transaction.type]}`}>
                  {transaction.type === "deposit" ? "+" : transaction.type === "withdrawal" ? "-" : ""}
                  {transaction.amount}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusColors[transaction.status]}>
                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8">
                <div className="text-muted-foreground">
                  <p className="text-sm">No transactions found</p>
                  <p className="text-xs mt-1">Transactions will appear here after you add funds or make payments</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
