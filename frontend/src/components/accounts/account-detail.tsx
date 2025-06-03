"use client"
import { ArrowLeft, ExternalLink, Edit, Archive, Trash2, BarChart3, CreditCard, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { TransactionTable } from "@/components/wallet/transaction-table"

interface AccountDetailProps {
  account: {
    id: string
    name: string
    accountId: string
    status: string
    users: number
    billings: number
    type: string
    partner: string
    currency: string
    ads: number
    estimated: string
    holds: string
    balance: string
    totalSpend: string
    spendToday: string
    hasIssues: boolean
    dateCreated?: string
    lastActive?: string
  }
  onBack: () => void
}

export function AccountDetail({ account, onBack }: AccountDetailProps) {
  // Mock data for transactions
  const transactions = [
    {
      id: "1",
      date: "Apr 28, 2025",
      description: "Ad Spend",
      amount: "$45.20",
      status: "completed" as const,
      type: "withdrawal" as const,
    },
    {
      id: "2",
      date: "Apr 25, 2025",
      description: "Ad Spend",
      amount: "$32.75",
      status: "completed" as const,
      type: "withdrawal" as const,
    },
    {
      id: "3",
      date: "Apr 22, 2025",
      description: "Top up - Bank Transfer",
      amount: "$100.00",
      status: "completed" as const,
      type: "deposit" as const,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{account.name}</h1>
        <Badge
          variant="outline"
          className={`
            ${account.status === "active" ? "bg-green-950/30 text-green-400 border-green-900/50" : ""}
            ${account.status === "idle" ? "bg-yellow-950/30 text-yellow-400 border-yellow-900/50" : ""}
            ${account.status === "disabled" ? "bg-red-950/30 text-red-400 border-red-900/50" : ""}
            ${account.status === "archived" ? "bg-gray-950/30 text-gray-400 border-gray-900/50" : ""}
          `}
        >
          {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-4">
        <Button variant="outline" className="border-border bg-secondary/50">
          <ExternalLink className="h-4 w-4 mr-2" />
          Open in Meta
        </Button>
        <Button variant="outline" className="border-border bg-secondary/50">
          <Edit className="h-4 w-4 mr-2" />
          Edit Account
        </Button>
        <Button variant="outline" className="border-border bg-secondary/50">
          <Archive className="h-4 w-4 mr-2" />
          Archive Account
        </Button>
        <Button variant="destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Account
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-secondary/20 border-border">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-secondary/50 p-3 rounded-full">
              <CreditCard className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Balance</div>
              <div className="text-2xl font-bold">{account.balance}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-secondary/20 border-border">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-secondary/50 p-3 rounded-full">
              <BarChart3 className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Spend</div>
              <div className="text-2xl font-bold">{account.totalSpend}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-secondary/20 border-border">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-secondary/50 p-3 rounded-full">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Users</div>
              <div className="text-2xl font-bold">{account.users}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Account ID</div>
                <div className="font-mono">{account.accountId}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Type</div>
                <div>{account.type}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Currency</div>
                <div>{account.currency}</div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Partner</div>
                <div className="font-mono">{account.partner}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Date Created</div>
                <div>{account.dateCreated || "Jan 15, 2025"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Last Active</div>
                <div>{account.lastActive || "Apr 28, 2025"}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="transactions">
        <TabsList className="bg-secondary/20 p-1 h-auto">
          <TabsTrigger value="transactions" className="data-[state=active]:bg-secondary/50 px-3 py-1.5 h-auto">
            Transactions
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-secondary/50 px-3 py-1.5 h-auto">
            Performance
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-secondary/50 px-3 py-1.5 h-auto">
            Settings
          </TabsTrigger>
        </TabsList>
        <TabsContent value="transactions" className="mt-4">
          <TransactionTable transactions={transactions} />
        </TabsContent>
        <TabsContent value="performance" className="mt-4">
          <Card className="bg-card border-border">
            <CardContent className="p-6 flex items-center justify-center h-64">
              <div className="text-muted-foreground">Performance data visualization would appear here</div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settings" className="mt-4">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Daily Spend Limit</div>
                    <div className="text-sm text-muted-foreground">Maximum amount that can be spent daily</div>
                  </div>
                  <Button variant="outline" className="border-border bg-secondary/50">
                    Edit
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Account Access</div>
                    <div className="text-sm text-muted-foreground">Manage who can access this account</div>
                  </div>
                  <Button variant="outline" className="border-border bg-secondary/50">
                    Manage
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Billing Settings</div>
                    <div className="text-sm text-muted-foreground">Update payment methods and billing info</div>
                  </div>
                  <Button variant="outline" className="border-border bg-secondary/50">
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
