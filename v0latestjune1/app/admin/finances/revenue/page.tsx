import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { colors } from "@/lib/design-tokens"
import { ArrowUpRight, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AdminRevenueDetailPage() {
  return (
    <AdminLayout title="Revenue Details">
      <div className="flex flex-col space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Revenue Breakdown</h2>
          <Button variant="outline" className="bg-[#1A1A1A] border-[#333333] text-white hover:bg-[#252525]">
            <Download className="mr-2 h-4 w-4" /> Export Report
          </Button>
        </div>

        <Card className={`${colors.cardGradient} ${colors.cardBorder} border`}>
          <CardHeader>
            <CardTitle className="text-white">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] flex items-center justify-center bg-[#111111] rounded-md border border-[#1A1A1A]">
              <p className="text-muted-foreground">Monthly revenue chart will be displayed here</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className={`${colors.cardGradient} ${colors.cardBorder} border`}>
            <CardHeader>
              <CardTitle className="text-white">Revenue by Client Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center bg-[#111111] rounded-md border border-[#1A1A1A]">
                <p className="text-muted-foreground">Client type pie chart will be displayed here</p>
              </div>
            </CardContent>
          </Card>

          <Card className={`${colors.cardGradient} ${colors.cardBorder} border`}>
            <CardHeader>
              <CardTitle className="text-white">Revenue by Service</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center bg-[#111111] rounded-md border border-[#1A1A1A]">
                <p className="text-muted-foreground">Service breakdown chart will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className={`${colors.cardGradient} ${colors.cardBorder} border`}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Top Revenue Sources</CardTitle>
            <a href="#" className="flex items-center text-sm text-[#b4a0ff] hover:underline">
              View in Airtable <ArrowUpRight className="ml-1 h-3 w-3" />
            </a>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-4 bg-[#111111] rounded-md border border-[#1A1A1A]"
                >
                  <div>
                    <p className="font-medium">Client #{2000 + i}</p>
                    <p className="text-xs text-muted-foreground">Enterprise • {i} active accounts</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${(Math.random() * 10000).toFixed(2)}</p>
                    <p className="text-xs text-[#b4a0ff]">+{(Math.random() * 10).toFixed(1)}% from last month</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
