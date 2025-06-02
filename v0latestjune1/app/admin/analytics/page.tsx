import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { colors } from "@/lib/design-tokens"
import { BarChart3, TrendingUp, Users, Activity, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AdminAnalyticsPage() {
  return (
    <AdminLayout title="Analytics Dashboard">
      <div className="flex flex-col space-y-8">
        {/* Date Range Selector */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold">Platform Analytics</h2>
            <p className="text-sm text-muted-foreground">Insights and metrics for your platform</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="bg-[#1A1A1A] border-[#333333] text-white hover:bg-[#252525]">
              <Calendar className="mr-2 h-4 w-4" /> Last 30 Days
            </Button>
          </div>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-[#0A0A0A] border border-[#1A1A1A] mb-4">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="clients" className="data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white">
              Client Analytics
            </TabsTrigger>
            <TabsTrigger value="accounts" className="data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white">
              Account Performance
            </TabsTrigger>
            <TabsTrigger value="revenue" className="data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white">
              Revenue Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className={`${colors.cardGradient} ${colors.cardBorder} border`}>
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5 text-[#b4a0ff]" /> Growth Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center bg-[#111111] rounded-md border border-[#1A1A1A]">
                    <p className="text-muted-foreground">Growth chart will be displayed here</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-[#111111] p-3 rounded-md border border-[#1A1A1A]">
                      <p className="text-sm text-muted-foreground">New Clients</p>
                      <p className="text-xl font-bold">+24</p>
                      <p className="text-xs text-[#b4a0ff]">+12% from last month</p>
                    </div>
                    <div className="bg-[#111111] p-3 rounded-md border border-[#1A1A1A]">
                      <p className="text-sm text-muted-foreground">New Accounts</p>
                      <p className="text-xl font-bold">+68</p>
                      <p className="text-xs text-[#b4a0ff]">+15% from last month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={`${colors.cardGradient} ${colors.cardBorder} border`}>
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Activity className="mr-2 h-5 w-5 text-[#b4a0ff]" /> Platform Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center bg-[#111111] rounded-md border border-[#1A1A1A]">
                    <p className="text-muted-foreground">Activity chart will be displayed here</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-[#111111] p-3 rounded-md border border-[#1A1A1A]">
                      <p className="text-sm text-muted-foreground">Requests</p>
                      <p className="text-xl font-bold">156</p>
                      <p className="text-xs text-[#b4a0ff]">+8% from last month</p>
                    </div>
                    <div className="bg-[#111111] p-3 rounded-md border border-[#1A1A1A]">
                      <p className="text-sm text-muted-foreground">Transactions</p>
                      <p className="text-xl font-bold">342</p>
                      <p className="text-xs text-[#b4a0ff]">+22% from last month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className={`${colors.cardGradient} ${colors.cardBorder} border mt-6`}>
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5 text-[#b4a0ff]" /> Key Performance Indicators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-[#111111] p-4 rounded-md border border-[#1A1A1A]">
                    <p className="text-sm text-muted-foreground">Avg. Request Approval Time</p>
                    <p className="text-xl font-bold">1.2 days</p>
                    <p className="text-xs text-[#b4a0ff]">-0.3 days from last month</p>
                  </div>
                  <div className="bg-[#111111] p-4 rounded-md border border-[#1A1A1A]">
                    <p className="text-sm text-muted-foreground">Client Retention Rate</p>
                    <p className="text-xl font-bold">94.5%</p>
                    <p className="text-xs text-[#b4a0ff]">+2.1% from last month</p>
                  </div>
                  <div className="bg-[#111111] p-4 rounded-md border border-[#1A1A1A]">
                    <p className="text-sm text-muted-foreground">Avg. Account Lifetime</p>
                    <p className="text-xl font-bold">8.3 months</p>
                    <p className="text-xs text-[#b4a0ff]">+0.5 months from last month</p>
                  </div>
                  <div className="bg-[#111111] p-4 rounded-md border border-[#1A1A1A]">
                    <p className="text-sm text-muted-foreground">Support Response Time</p>
                    <p className="text-xl font-bold">3.5 hours</p>
                    <p className="text-xs text-[#b4a0ff]">-0.8 hours from last month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients">
            <Card className={`${colors.cardGradient} ${colors.cardBorder} border`}>
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Users className="mr-2 h-5 w-5 text-[#b4a0ff]" /> Client Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="h-[300px] flex items-center justify-center bg-[#111111] rounded-md border border-[#1A1A1A]">
                    <p className="text-muted-foreground">Client growth chart will be displayed here</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#111111] p-4 rounded-md border border-[#1A1A1A]">
                      <h3 className="font-medium mb-2">Client Distribution</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="text-sm">Enterprise</p>
                          <p className="font-medium">24%</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-sm">Mid-Market</p>
                          <p className="font-medium">38%</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-sm">Small Business</p>
                          <p className="font-medium">28%</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-sm">Individual</p>
                          <p className="font-medium">10%</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#111111] p-4 rounded-md border border-[#1A1A1A]">
                      <h3 className="font-medium mb-2">Client Status</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="text-sm">Active</p>
                          <p className="font-medium">78%</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-sm">Inactive</p>
                          <p className="font-medium">12%</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-sm">Pending</p>
                          <p className="font-medium">6%</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-sm">Suspended</p>
                          <p className="font-medium">4%</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#111111] p-4 rounded-md border border-[#1A1A1A]">
                      <h3 className="font-medium mb-2">Client Acquisition</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="text-sm">Direct</p>
                          <p className="font-medium">42%</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-sm">Referral</p>
                          <p className="font-medium">28%</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-sm">Organic</p>
                          <p className="font-medium">18%</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-sm">Paid</p>
                          <p className="font-medium">12%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accounts">
            <Card className={`${colors.cardGradient} ${colors.cardBorder} border`}>
              <CardHeader>
                <CardTitle className="text-white">Account Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="h-[300px] flex items-center justify-center bg-[#111111] rounded-md border border-[#1A1A1A]">
                    <p className="text-muted-foreground">Account performance chart will be displayed here</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className={`p-4 ${colors.cardBorder} border bg-[#111111]`}>
                      <h3 className="font-medium mb-2">Top Performing Accounts</h3>
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex justify-between items-center p-2 bg-[#0A0A0A] rounded-md">
                            <p className="text-sm">Account #{1000 + i}</p>
                            <p className="font-medium text-[#b4a0ff]">+{(Math.random() * 30 + 20).toFixed(1)}% ROI</p>
                          </div>
                        ))}
                      </div>
                    </Card>

                    <Card className={`p-4 ${colors.cardBorder} border bg-[#111111]`}>
                      <h3 className="font-medium mb-2">Underperforming Accounts</h3>
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex justify-between items-center p-2 bg-[#0A0A0A] rounded-md">
                            <p className="text-sm">Account #{2000 + i}</p>
                            <p className="font-medium text-red-400">-{(Math.random() * 10 + 5).toFixed(1)}% ROI</p>
                          </div>
                        ))}
                      </div>
                    </Card>
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
                <div className="space-y-6">
                  <div className="h-[300px] flex items-center justify-center bg-[#111111] rounded-md border border-[#1A1A1A]">
                    <p className="text-muted-foreground">Revenue analytics chart will be displayed here</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className={`p-4 ${colors.cardBorder} border bg-[#111111]`}>
                      <h3 className="font-medium mb-1">Monthly Revenue</h3>
                      <p className="text-2xl font-bold">$12,350.00</p>
                      <p className="text-xs text-[#b4a0ff] mt-1">+5.2% from last month</p>
                    </Card>

                    <Card className={`p-4 ${colors.cardBorder} border bg-[#111111]`}>
                      <h3 className="font-medium mb-1">Avg. Revenue per Client</h3>
                      <p className="text-2xl font-bold">$1,850.00</p>
                      <p className="text-xs text-[#b4a0ff] mt-1">+3.7% from last month</p>
                    </Card>

                    <Card className={`p-4 ${colors.cardBorder} border bg-[#111111]`}>
                      <h3 className="font-medium mb-1">Projected Annual Revenue</h3>
                      <p className="text-2xl font-bold">$148,200.00</p>
                      <p className="text-xs text-[#b4a0ff] mt-1">Based on current growth</p>
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
