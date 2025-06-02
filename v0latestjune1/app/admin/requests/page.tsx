import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminRequestsTable } from "@/components/admin/admin-requests-table"
import { colors } from "@/lib/design-tokens"
import { Button } from "@/components/ui/button"
import { FileText, Filter, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AdminRequestsPage() {
  return (
    <AdminLayout title="Request Management">
      <div className="flex flex-col space-y-8">
        {/* Header with stats */}
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-bold flex items-center">
            <FileText className="mr-2 h-6 w-6 text-[#b4a0ff]" /> Request Management
          </h1>
          <p className={`${colors.textMuted}`}>Review and manage client requests for accounts and operations</p>
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
                <label htmlFor="status-filter" className="text-sm font-medium">
                  Status
                </label>
                <Select defaultValue="all">
                  <SelectTrigger id="status-filter" className="bg-[#1A1A1A] border-[#222222] focus:border-[#b4a0ff]">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-[#222222]">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
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

        {/* Requests Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-[#0A0A0A] border border-[#1A1A1A] mb-4">
            <TabsTrigger value="all" className="data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white">
              All Requests
            </TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white">
              Pending
            </TabsTrigger>
            <TabsTrigger value="in_review" className="data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white">
              In Review
            </TabsTrigger>
            <TabsTrigger value="approved" className="data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white">
              Approved
            </TabsTrigger>
            <TabsTrigger value="rejected" className="data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white">
              Rejected
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card className={`${colors.cardGradient} ${colors.cardBorder} border`}>
              <CardHeader>
                <CardTitle className="text-white">All Requests</CardTitle>
                <CardDescription>Showing all client requests across all statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <AdminRequestsTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending">
            <Card className={`${colors.cardGradient} ${colors.cardBorder} border`}>
              <CardHeader>
                <CardTitle className="text-white">Pending Requests</CardTitle>
                <CardDescription>Requests awaiting initial review</CardDescription>
              </CardHeader>
              <CardContent>
                <AdminRequestsTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="in_review">
            <Card className={`${colors.cardGradient} ${colors.cardBorder} border`}>
              <CardHeader>
                <CardTitle className="text-white">In Review</CardTitle>
                <CardDescription>Requests currently being processed</CardDescription>
              </CardHeader>
              <CardContent>
                <AdminRequestsTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved">
            <Card className={`${colors.cardGradient} ${colors.cardBorder} border`}>
              <CardHeader>
                <CardTitle className="text-white">Approved Requests</CardTitle>
                <CardDescription>Successfully approved and processed requests</CardDescription>
              </CardHeader>
              <CardContent>
                <AdminRequestsTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rejected">
            <Card className={`${colors.cardGradient} ${colors.cardBorder} border`}>
              <CardHeader>
                <CardTitle className="text-white">Rejected Requests</CardTitle>
                <CardDescription>Requests that were denied</CardDescription>
              </CardHeader>
              <CardContent>
                <AdminRequestsTable />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
