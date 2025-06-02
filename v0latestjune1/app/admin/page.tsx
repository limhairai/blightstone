import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Users, Wallet, DollarSign } from "lucide-react"
import { AdminRequestsTable } from "@/components/admin/admin-requests-table"
import { AdminClientsList } from "@/components/admin/admin-clients-list"
import { colors } from "@/lib/design-tokens"

export default function AdminDashboardPage() {
  // Mock data - in a real app, this would come from your database
  const pendingRequests = 12
  const totalClients = 24
  const activeAdAccounts = 68
  const totalRevenue = "$45,750.00"

  return (
    <AdminLayout title="Admin Dashboard">
      <div className="flex flex-col space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className={`${colors.cardGradient} ${colors.cardBorder} border`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${colors.textMuted} text-sm`}>Pending Requests</p>
                  <h3 className="text-2xl font-bold mt-1">{pendingRequests}</h3>
                  <p className="text-xs mt-1 text-[#b4a0ff]">+5 new today</p>
                </div>
                <div className="h-12 w-12 bg-[#1A1A1A] rounded-full flex items-center justify-center">
                  <FileText className="h-6 w-6 text-[#b4a0ff]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${colors.cardGradient} ${colors.cardBorder} border`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${colors.textMuted} text-sm`}>Total Clients</p>
                  <h3 className="text-2xl font-bold mt-1">{totalClients}</h3>
                  <p className="text-xs mt-1 text-[#b4a0ff]">+3 this month</p>
                </div>
                <div className="h-12 w-12 bg-[#1A1A1A] rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-[#b4a0ff]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${colors.cardGradient} ${colors.cardBorder} border`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${colors.textMuted} text-sm`}>Active Ad Accounts</p>
                  <h3 className="text-2xl font-bold mt-1">{activeAdAccounts}</h3>
                  <p className="text-xs mt-1 text-[#b4a0ff]">+12 this month</p>
                </div>
                <div className="h-12 w-12 bg-[#1A1A1A] rounded-full flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-[#b4a0ff]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${colors.cardGradient} ${colors.cardBorder} border`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${colors.textMuted} text-sm`}>Total Revenue</p>
                  <h3 className="text-2xl font-bold mt-1">{totalRevenue}</h3>
                  <p className="text-xs mt-1 text-[#b4a0ff]">+8.3% from last month</p>
                </div>
                <div className="h-12 w-12 bg-[#1A1A1A] rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-[#b4a0ff]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Admin Content Tabs */}
        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="bg-[#0A0A0A] border border-[#1A1A1A] mb-4">
            <TabsTrigger value="requests" className="data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white">
              Pending Requests
            </TabsTrigger>
            <TabsTrigger value="clients" className="data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white">
              Clients
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white">
              Platform Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <Card className={`${colors.cardGradient} ${colors.cardBorder} border`}>
              <CardHeader>
                <CardTitle className="text-white">Recent Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminRequestsTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients">
            <Card className={`${colors.cardGradient} ${colors.cardBorder} border`}>
              <CardHeader>
                <CardTitle className="text-white">Client Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminClientsList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className={`${colors.cardGradient} ${colors.cardBorder} border`}>
              <CardHeader>
                <CardTitle className="text-white">Platform Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className={`p-4 ${colors.cardBorder} border bg-[#111111]`}>
                      <h3 className="font-medium mb-2 flex items-center">
                        <DollarSign className="h-4 w-4 mr-2 text-[#b4a0ff]" /> Fee Structure
                      </h3>
                      <p className={`text-sm ${colors.textMuted}`}>Configure platform fees and commission rates</p>
                    </Card>

                    <Card className={`p-4 ${colors.cardBorder} border bg-[#111111]`}>
                      <h3 className="font-medium mb-2 flex items-center">
                        <Users className="h-4 w-4 mr-2 text-[#b4a0ff]" /> User Roles
                      </h3>
                      <p className={`text-sm ${colors.textMuted}`}>Manage admin access and permissions</p>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
