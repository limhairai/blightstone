"use client"

import { useState, useEffect, useMemo } from "react"
import useSWR from 'swr'
import { useDebounce } from 'use-debounce';
import { ArrowDownIcon, ArrowUpIcon, CalendarIcon, DownloadIcon, FilterIcon, SearchIcon, SlidersHorizontal, Receipt, ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from "../../../components/ui/button"
import { Card, CardHeader } from "../../../components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../components/ui/tabs"
import { Input } from "../../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "../../../components/ui/popover"
import { Calendar } from "../../../components/ui/calendar"
import { format } from "date-fns"
import { formatCurrency } from "../../../utils/format"
import { usePageTitle } from "../../../components/core/simple-providers"
import { ErrorBoundary } from "../../../components/ui/error-boundary"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { Skeleton } from "@/components/ui/skeleton";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function TransactionsPage() {
  const { setPageTitle } = usePageTitle()
  const { currentOrganizationId } = useOrganizationStore();
  
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [businessFilter, setBusinessFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    setPageTitle("Transactions")
  }, [setPageTitle])

  const { data: businessesData, isLoading: areBusinessesLoading } = useSWR(
    currentOrganizationId ? `/api/businesses?organization_id=${currentOrganizationId}` : null,
    fetcher
  );

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (currentOrganizationId) params.set('organization_id', currentOrganizationId);
    if (activeTab !== 'all') params.set('type', activeTab);
    if (debouncedSearchQuery) params.set('search', debouncedSearchQuery);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (businessFilter !== 'all') params.set('business_id', businessFilter);
    if (date) params.set('date', format(date, "yyyy-MM-dd"));
    params.set('page', currentPage.toString());
    params.set('limit', itemsPerPage.toString());
    return params.toString();
  }, [currentOrganizationId, activeTab, debouncedSearchQuery, statusFilter, businessFilter, date, currentPage, itemsPerPage]);

  const { data: transactionsData, error, isLoading } = useSWR(
    currentOrganizationId ? `/api/transactions?${queryString}` : null,
    fetcher,
    { keepPreviousData: true }
  );
  
  const transactions = transactionsData?.transactions || [];
  const totalPages = transactionsData?.totalPages || 1;

  // Get status dot color
  const getStatusDotColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "pending": return "bg-yellow-500";
      case "failed": return "bg-red-500";
      default: return "bg-gray-500";
    }
  }

  // Transaction type styling
  const getTypeIcon = (type: string, amount: number) => {
    const iconClass = "h-4 w-4";
    switch (type) {
      case "topup": return <div className="p-1.5 bg-emerald-500/10 rounded-full text-emerald-500"><ArrowDownIcon className={iconClass} /></div>;
      case "withdrawal": return <div className="p-1.5 bg-red-500/10 rounded-full text-red-500"><ArrowUpIcon className={iconClass} /></div>;
      case "transfer": return <div className="p-1.5 bg-blue-500/10 rounded-full text-blue-500">{amount > 0 ? <ArrowDownIcon className={iconClass} /> : <ArrowUpIcon className={iconClass} />}</div>;
      default: return <div className="p-1.5 bg-gray-500/10 rounded-full text-gray-500"><Receipt className={iconClass} /></div>;
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const renderPagination = () => (
    <div className="flex items-center justify-between p-4">
      <span className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Previous
        </Button>
        <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
          Next <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  function renderTransactionsTable() {
    if (isLoading && !transactionsData) return (
        <div>
            {Array.from({ length: itemsPerPage }).map((_, i) => <Skeleton key={i} className="h-12 w-full mt-2 rounded-md" />)}
        </div>
    );
    if (error) return <div className="text-red-500 text-center p-8">Failed to load transactions.</div>
    if (transactions.length === 0) return <div className="text-center text-muted-foreground p-8">No transactions found.</div>

    return (
      <>
        <div className="rounded-md border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 dark:bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium text-muted-foreground w-[5%]"></th>
                  <th className="text-left p-3 font-medium text-muted-foreground w-[30%]">Transaction</th>
                  <th className="text-left p-3 font-medium text-muted-foreground w-[20%]">Business</th>
                  <th className="text-right p-3 font-medium text-muted-foreground w-[15%]">Amount</th>
                  <th className="text-center p-3 font-medium text-muted-foreground w-[15%]">Status</th>
                  <th className="text-center p-3 font-medium text-muted-foreground w-[15%]">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-3">{getTypeIcon(tx.type, tx.amount_cents)}</td>
                    <td className="p-3 font-medium text-foreground">{tx.description}</td>
                    <td className="p-3 text-muted-foreground">{tx.businesses?.name || 'Main Wallet'}</td>
                    <td className="p-3 text-right font-mono text-foreground">{formatCurrency(tx.amount_cents / 100)}</td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted capitalize">
                        <span className={`h-2 w-2 rounded-full ${getStatusDotColor(tx.status)}`}></span>
                        {tx.status}
                      </span>
                    </td>
                    <td className="p-3 text-center text-muted-foreground">{format(new Date(tx.created_at), "MMM d, yyyy")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {renderPagination()}
      </>
    )
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="topup">Deposits</TabsTrigger>
              <TabsTrigger value="withdrawal">Withdrawals</TabsTrigger>
              <TabsTrigger value="transfer">Transfers</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-64">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search descriptions..." className="pl-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <SlidersHorizontal className="h-4 w-4" /> Filters
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Business</label>
                    <Select value={businessFilter} onValueChange={setBusinessFilter} disabled={areBusinessesLoading}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Businesses</SelectItem>
                        <SelectItem value="unallocated">Main Wallet</SelectItem>
                        {businessesData?.businesses?.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-sm font-medium">Date</label>
                     <Popover>
                       <PopoverTrigger asChild>
                         <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                           <CalendarIcon className="mr-2 h-4 w-4" />
                           {date ? format(date, "PPP") : <span>Pick a date</span>}
                         </Button>
                       </PopoverTrigger>
                       <PopoverContent className="w-auto p-0">
                         <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                       </PopoverContent>
                     </Popover>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <Card className="mt-4">
            <CardHeader>
              {/* Summary Metrics Here if needed */}
            </CardHeader>
            {renderTransactionsTable()}
          </Card>
        </Tabs>
      </div>
    </ErrorBoundary>
  )
} 