import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, User, Mail, Building, Calendar, CreditCard, Edit, Wallet, Clock, UserCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { AdminClientAccountsTable } from "@/components/admin/admin-client-accounts-table"
import { AdminClientTransactions } from "@/components/admin/admin-client-transactions"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

export default function ClientDetailsPage({ params }: { params: { id: string } }) {
  // In a real app, you would fetch the client details based on the ID
  const clientId = params.id

  // Mock data for demonstration
  const client = {
    id: clientId,
    name: "Acme Industries",
    email: "accounts@acme.com",
    accountType: "premium",
    status: "active",
    totalSpend: "$12,540.00",
    accountsCount: 5,
    joinDate: "Jan 15, 2025",
    address: "123 Business Ave, San Francisco, CA 94107",
    phone: "+1 (555) 123-4567",
    paymentMethod: "Credit Card (ending in 4242)",
    notes: "Enterprise client with multiple business units. Looking to expand ad spend in Q3 2025.",
  }

  return (
    <AppLayout title={`Client: ${client.name}`} isAdmin={true}>
      <div className="space-y-8">
        {/* Back button and header */}
        <div className="flex flex-col space-y-4">
          <Link href="/admin" className="flex items-center text-muted-foreground hover:text-foreground w-fit">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin Dashboard
          </Link>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-[#1A1A1A] text-base">
                  {client.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>

              <div>
                <h1 className="text-2xl font-bold flex items-center">{client.name}</h1>
                <div className="flex items-center mt-1">
                  <span className="text-muted-foreground">Client ID: {clientId}</span>
                  <span className="mx-2">•</span>
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                    {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                  </Badge>
                  <span className="mx-2">•</span>
                  <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                    {client.accountType.charAt(0).toUpperCase() + client.accountType.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>

            <Button className="bg-[#b19cd9] hover:bg-[#9f84ca] text-white">
              <Edit className="mr-2 h-4 w-4" /> Edit Client
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content - left side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <Tabs defaultValue="accounts" className="w-full">
              <TabsList className="bg-background border border-border">
                <TabsTrigger value="accounts">Ad Accounts</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                <TabsTrigger value="activity">Activity Log</TabsTrigger>
              </TabsList>

              <TabsContent value="accounts" className="pt-4">
                <AdminClientAccountsTable clientId={clientId} />
              </TabsContent>

              <TabsContent value="transactions" className="pt-4">
                <AdminClientTransactions clientId={clientId} />
              </TabsContent>

              <TabsContent value="activity" className="pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Activity Log</CardTitle>
                    <CardDescription>Recent client activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="border-l-2 border-[#b19cd9] pl-4 space-y-1">
                        <div className="text-sm font-medium">Top-up Request Submitted</div>
                        <div className="text-xs text-muted-foreground">Apr 28, 2025 at 10:12 AM</div>
                        <div className="text-sm mt-1">Requested $5,000 top-up for Summer Campaign account</div>
                      </div>

                      <div className="border-l-2 border-[#b19cd9] pl-4 space-y-1">
                        <div className="text-sm font-medium">New Ad Account Created</div>
                        <div className="text-xs text-muted-foreground">Apr 25, 2025 at 3:45 PM</div>
                        <div className="text-sm mt-1">Created "Product Launch Q3" ad account</div>
                      </div>

                      <div className="border-l-2 border-[#b19cd9] pl-4 space-y-1">
                        <div className="text-sm font-medium">Account Setting Updated</div>
                        <div className="text-xs text-muted-foreground">Apr 22, 2025 at 11:30 AM</div>
                        <div className="text-sm mt-1">Updated billing information</div>
                      </div>

                      <div className="border-l-2 border-[#b19cd9] pl-4 space-y-1">
                        <div className="text-sm font-medium">Login Activity</div>
                        <div className="text-xs text-muted-foreground">Apr 20, 2025 at 9:15 AM</div>
                        <div className="text-sm mt-1">Logged in from new device (Mac, Chrome)</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - right side */}
          <div className="space-y-6">
            {/* Client Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>Client Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Email</div>
                      <div className="text-sm">{client.email}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Building className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Address</div>
                      <div className="text-sm">{client.address}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Phone</div>
                      <div className="text-sm">{client.phone}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Client Since</div>
                      <div className="text-sm">{client.joinDate}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <CreditCard className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Payment Method</div>
                      <div className="text-sm">{client.paymentMethod}</div>
                    </div>
                  </div>
                </div>
                <Separator />

                <div>
                  <div className="text-sm font-medium mb-2">Client Notes</div>
                  <div className="text-sm text-muted-foreground">{client.notes}</div>
                </div>
              </CardContent>
            </Card>

            {/* Client Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Account Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Total Spend</span>
                  </div>
                  <span className="font-medium">{client.totalSpend}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Active Ad Accounts</span>
                  </div>
                  <span className="font-medium">{client.accountsCount}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Avg. Response Time</span>
                  </div>
                  <span className="font-medium">4.2 hours</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Approval Rate</span>
                  </div>
                  <span className="font-medium">92%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
