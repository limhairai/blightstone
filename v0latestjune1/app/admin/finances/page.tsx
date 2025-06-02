import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, TrendingUp, CreditCard, Calendar, ArrowUpRight } from "lucide-react"
import { colors } from "@/lib/design-tokens"

export default function AdminFinancesPage() {
  // In a real app, this would come from your database or Airtable
  const financialStats = {
    totalRevenue: "$45,750.00",
    monthlyRevenue: "$12,350.00",
    averageAccountValue: "$1,850.00",
    pendingPayouts: "$3,250.00",
  }

  // This would be the actual Airtable view URL in production
  const airtableEmbedUrl = "#" // getAirtableViewUrl('Transactions', 'Grid view')

  return (
    <AdminLayout title="Financial Management">
      <div className="flex flex-col space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className={`${colors.cardGradient} ${colors.cardBorder} border`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${colors.textMuted} text-sm`}>Total Revenue</p>
                  <h3 className="text-2xl font-bold mt-1">{financialStats.totalRevenue}</h3>
                  <p className="text-xs mt-1 text-[#b4a0ff]">+8.3% from last month</p>
                </div>
                <div className="h-12 w-12 bg-[#1A1A1A] rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-[#b4a0ff]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${colors.cardGradient} ${colors.cardBorder} border`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${colors.textMuted} text-sm`}>Monthly Revenue</p>
                  <h3 className="text-2xl font-bold mt-1">{financialStats.monthlyRevenue}</h3>
                  <p className="text-xs mt-1 text-[#b4a0ff]">+5.2% from last month</p>
                </div>
                <div className="h-12 w-12 bg-[#1A1A1A] rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-[#b4a0ff]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${colors.cardGradient} ${colors.cardBorder} border`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${colors.textMuted} text-sm`}>Avg. Account Value</p>
                  <h3 className="text-2xl font-bold mt-1">{financialStats.averageAccountValue}</h3>
                  <p className="text-xs mt-1 text-[#b4a0ff]">+3.7% from last month</p>
                </div>
                <div className="h-12 w-12 bg-[#1A1A1A] rounded-full flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-[#b4a0ff]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${colors.cardGradient} ${colors.cardBorder} border`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${colors.textMuted} text-sm`}>Pending Payouts</p>
                  <h3 className="text-2xl font-bold mt-1">{financialStats.pendingPayouts}</h3>
                  <p className="text-xs mt-1 text-[#b4a0ff]">5 transactions</p>
                </div>
                <div className="h-12 w-12 bg-[#1A1A1A] rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-[#b4a0ff]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Finance Content Tabs */}
        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="bg-[#0A0A0A] border border-[#1A1A1A] mb-4">
            <TabsTrigger
              value="transactions"
              className="data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white"
            >
              Transactions
            </TabsTrigger>
            <TabsTrigger value="revenue" className="data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white">
              Revenue
            </TabsTrigger>
            <TabsTrigger value="fees" className="data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white">
              Fee Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions">
            <Card className={`${colors.cardGradient} ${colors.cardBorder} border`}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Transaction History</CardTitle>
                <a
                  href={airtableEmbedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-[#b4a0ff] hover:underline"
                >
                  View in Airtable <ArrowUpRight className="ml-1 h-3 w-3" />
                </a>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-[#1A1A1A] overflow-hidden">
                  <div className="p-4 bg-[#111111] text-center">
                    <p className="text-sm text-muted-foreground">
                      This would display an embedded Airtable view of your transactions in production.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      You can manage all transaction data directly in Airtable or through this interface.
                    </p>
                  </div>
                  <div className="p-6 space-y-4">
                    {/* Sample transaction rows */}
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-[#111111] rounded-md">
                        <div>
                          <p className="font-medium">Transaction #{1000 + i}</p>
                          <p className="text-xs text-muted-foreground">
                            Client #{2000 + i} • {new Date().toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${(Math.random() * 1000).toFixed(2)}</p>
                          <p className="text-xs text-[#b4a0ff]">Completed</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue">
            <Card className={`${colors.cardGradient} ${colors.cardBorder} border`}>
              <CardHeader>
                <CardTitle className="text-white">Revenue Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center bg-[#111111] rounded-md border border-[#1A1A1A]">
                  <p className="text-muted-foreground">Revenue chart will be displayed here</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <Card className={`p-4 ${colors.cardBorder} border bg-[#111111]`}>
                    <h3 className="font-medium mb-1">Platform Fees</h3>
                    <p className="text-2xl font-bold">$12,350.00</p>
                    <p className="text-xs text-[#b4a0ff] mt-1">27% of total revenue</p>
                  </Card>
                  <Card className={`p-4 ${colors.cardBorder} border bg-[#111111]`}>
                    <h3 className="font-medium mb-1">Ad Spend</h3>
                    <p className="text-2xl font-bold">$28,400.00</p>
                    <p className="text-xs text-[#b4a0ff] mt-1">62% of total revenue</p>
                  </Card>
                  <Card className={`p-4 ${colors.cardBorder} border bg-[#111111]`}>
                    <h3 className="font-medium mb-1">Other Revenue</h3>
                    <p className="text-2xl font-bold">$5,000.00</p>
                    <p className="text-xs text-[#b4a0ff] mt-1">11% of total revenue</p>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fees">
            <Card className={`${colors.cardGradient} ${colors.cardBorder} border`}>
              <CardHeader>
                <CardTitle className="text-white">Fee Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-[#111111] p-4 rounded-md border border-[#1A1A1A]">
                    <h3 className="font-medium mb-2">Standard Fee Structure</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-sm">Platform Fee</p>
                        <p className="font-medium">5%</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm">Transaction Fee</p>
                        <p className="font-medium">2.5% + $0.30</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm">Withdrawal Fee</p>
                        <p className="font-medium">$1.00</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#111111] p-4 rounded-md border border-[#1A1A1A]">
                    <h3 className="font-medium mb-2">Volume Discounts</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-sm">$1,000 - $10,000</p>
                        <p className="font-medium">4.5%</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm">$10,001 - $50,000</p>
                        <p className="font-medium">4.0%</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm">$50,001+</p>
                        <p className="font-medium">3.5%</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#111111] p-4 rounded-md border border-[#1A1A1A]">
                    <h3 className="font-medium mb-2">Custom Client Rates</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Special rates for enterprise clients can be managed in Airtable and synced to the platform.
                    </p>
                    <a
                      href={airtableEmbedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-[#b4a0ff] hover:underline"
                    >
                      Manage Custom Rates <ArrowUpRight className="ml-1 h-3 w-3" />
                    </a>
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
