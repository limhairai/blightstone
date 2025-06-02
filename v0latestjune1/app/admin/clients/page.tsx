import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { colors } from "@/lib/design-tokens"
import { Button } from "@/components/ui/button"
import { Users, Filter, Download, UserPlus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { AdminClientsList } from "@/components/admin/admin-clients-list"

export default function AdminClientsPage() {
  return (
    <AdminLayout title="Client Management">
      <div className="flex flex-col space-y-8">
        {/* Header with stats */}
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-bold flex items-center">
            <Users className="mr-2 h-6 w-6 text-[#b4a0ff]" /> Client Management
          </h1>
          <p className={`${colors.textMuted}`}>View and manage all client accounts</p>
        </div>

        {/* Filters and actions */}
        <Card className={`${colors.cardGradient} ${colors.cardBorder} border`}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
              <div className="flex-1 space-y-2">
                <label htmlFor="search" className="text-sm font-medium">
                  Search Clients
                </label>
                <div className="relative">
                  <Input
                    id="search"
                    placeholder="Search by client name, email, or ID..."
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

              <div className="flex gap-2">
                <Button variant="outline" className="border-[#222222] bg-[#1A1A1A] hover:bg-[#222222]">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" className="border-[#222222] bg-[#1A1A1A] hover:bg-[#222222]">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button className="bg-[#b4a0ff] hover:bg-[#9f84ca] text-black">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clients List */}
        <Card className={`${colors.cardGradient} ${colors.cardBorder} border`}>
          <CardHeader>
            <CardTitle className="text-white">All Clients</CardTitle>
            <CardDescription>Manage your client accounts and their ad accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminClientsList />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
