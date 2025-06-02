import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AdminRequestsTable } from "@/components/admin/admin-requests-table"
import { colors } from "@/lib/design-tokens"
import { Button } from "@/components/ui/button"
import { FileText, Filter, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function PendingRequestsPage() {
  return (
    <AdminLayout title="Pending Requests">
      <div className="flex flex-col space-y-8">
        {/* Header with stats */}
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-bold flex items-center">
            <FileText className="mr-2 h-6 w-6 text-[#b4a0ff]" /> Pending Requests
          </h1>
          <p className={`${colors.textMuted}`}>Review and process new client requests</p>
        </div>

        {/* Filters and actions */}
        <Card className={`${colors.cardGradient} ${colors.cardBorder} border`}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 space-y-2">
                <label htmlFor="search" className="text-sm font-medium">
                  Search Requests
                </label>
                <div className="relative">
                  <Input
                    id="search"
                    placeholder="Search by client name, account, or ID..."
                    className="bg-[#1A1A1A] border-[#222222] focus:border-[#b4a0ff] pl-10"
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              <div className="w-full md:w-48 space-y-2">
                <label htmlFor="type-filter" className="text-sm font-medium">
                  Request Type
                </label>
                <Select defaultValue="all">
                  <SelectTrigger id="type-filter" className="bg-[#1A1A1A] border-[#222222] focus:border-[#b4a0ff]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-[#222222]">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="new_account">New Account</SelectItem>
                    <SelectItem value="top_up">Top Up</SelectItem>
                    <SelectItem value="withdrawal">Withdrawal</SelectItem>
                    <SelectItem value="account_change">Account Change</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="border-[#222222] bg-[#1A1A1A] hover:bg-[#222222]">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                </Button>
                <Button variant="outline" className="border-[#222222] bg-[#1A1A1A] hover:bg-[#222222]">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Requests Table */}
        <Card className={`${colors.cardGradient} ${colors.cardBorder} border`}>
          <CardHeader>
            <CardTitle className="text-white">Pending Requests</CardTitle>
            <CardDescription>Showing all pending requests awaiting review</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminRequestsTable />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
