import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface OrgStats {
  balance?: number;
  spend?: number;
  accountsCount: number;
}

export function QuickStatsCard({ org }: { org: OrgStats }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Balance</span>
          <span className="font-medium">${org.balance?.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total Spend</span>
          <span className="font-medium">${org.spend?.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Active Ad Accounts</span>
          <span className="font-medium">{org.accountsCount}</span>
        </div>
      </CardContent>
    </Card>
  )
} 