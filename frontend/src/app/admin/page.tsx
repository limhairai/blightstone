import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadge } from "@/components/core/status-badge"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle, XCircle, Users, CreditCard, Settings, ExternalLink } from "lucide-react"
import AdminPageContent from "@/components/admin/AdminPageContent"
import { ShieldCheck } from "lucide-react"

export default function AdminDashboardPage() {
  // Mock data - would come from your API
  const pendingRequests = [
    {
      id: "req_123",
      type: "new_account",
      clientName: "Acme Corp",
      clientEmail: "john@acmecorp.com",
      submittedAt: "2025-04-28T14:30:00Z",
      status: "pending",
    },
    {
      id: "req_124",
      type: "top_up",
      clientName: "TechStart LLC",
      clientEmail: "sarah@techstart.io",
      submittedAt: "2025-04-28T10:15:00Z",
      status: "in_review",
    },
    {
      id: "req_125",
      type: "new_account",
      clientName: "Global Media",
      clientEmail: "alex@globalmedia.com",
      submittedAt: "2025-04-27T16:45:00Z",
      status: "pending",
    },
  ]

  const recentApprovals = [
    {
      id: "req_120",
      type: "new_account",
      clientName: "Innovate Design",
      clientEmail: "mike@innovatedesign.co",
      completedAt: "2025-04-26T11:20:00Z",
      accountId: "act_78912345",
      status: "approved",
    },
    {
      id: "req_119",
      type: "top_up",
      clientName: "WebSolutions",
      clientEmail: "lisa@websolutions.net",
      completedAt: "2025-04-25T09:30:00Z",
      amount: "$2,500.00",
      status: "approved",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Admin Settings
          </Button>
          <Button>
            <Users className="h-4 w-4 mr-2" />
            Client Management
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="pending">
            <Clock className="h-4 w-4 mr-2" />
            Pending
            <span className="ml-2 bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">
              {pendingRequests.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="approved">
            <CheckCircle className="h-4 w-4 mr-2" />
            Approved
          </TabsTrigger>
          <TabsTrigger value="rejected">
            <XCircle className="h-4 w-4 mr-2" />
            Rejected
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg bg-card"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{request.clientName}</h3>
                        <StatusBadge status={request.status === "pending" ? "pending" : "active"} size="sm" />
                      </div>
                      <p className="text-sm text-muted-foreground">{request.clientEmail}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {request.type === "new_account" ? "New Account Request" : "Top Up Request"} •
                        {new Date(request.submittedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                        View
                      </Button>
                      <Button size="sm">Review</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recently Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentApprovals.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg bg-card"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{request.clientName}</h3>
                        <StatusBadge status="approved" size="sm" />
                      </div>
                      <p className="text-sm text-muted-foreground">{request.clientEmail}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {request.type === "new_account"
                          ? `Account ID: ${request.accountId}`
                          : `Amount: ${request.amount}`}{" "}
                        •{new Date(request.completedAt).toLocaleString()}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-3.5 w-3.5 mr-1" />
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recently Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <XCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-1">No rejected requests</h3>
                <p className="text-sm text-muted-foreground">
                  All recent requests have been approved or are pending review.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Platform Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <h3 className="font-medium">Fee Structure</h3>
                  <p className="text-sm text-muted-foreground">Manage platform fees and pricing</p>
                </div>
                <Button variant="outline">Configure</Button>
              </div>

              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <h3 className="font-medium">Subscription Plans</h3>
                  <p className="text-sm text-muted-foreground">Edit available subscription plans</p>
                </div>
                <Button variant="outline">Manage Plans</Button>
              </div>

              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <h3 className="font-medium">Account Limits</h3>
                  <p className="text-sm text-muted-foreground">Set default account limits</p>
                </div>
                <Button variant="outline">Configure</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>External Integrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/20 p-2 rounded-md">
                    <CreditCard className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-medium">Payment Processor</h3>
                    <p className="text-sm text-muted-foreground">Connected to Stripe</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500/20 p-2 rounded-md">
                    <Users className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-medium">CRM Integration</h3>
                    <p className="text-sm text-muted-foreground">Not connected</p>
                  </div>
                </div>
                <Button size="sm">Connect</Button>
              </div>

              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500/20 p-2 rounded-md">
                    <Settings className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-medium">API Settings</h3>
                    <p className="text-sm text-muted-foreground">Manage API keys and webhooks</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Manage
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 