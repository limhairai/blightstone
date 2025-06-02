import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

interface ChartCardProps {
  title: string
  value: string
  change?: {
    value: string
    percentage: string
    positive: boolean
  }
  children: React.ReactNode
}

export function ChartCard({ title, value, change, children }: ChartCardProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
            <div className="text-2xl font-bold mt-1">{value}</div>
            {change && (
              <div className="flex items-center mt-1">
                {change.positive ? (
                  <ArrowUpRight className="h-3 w-3 text-green-400 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-400 mr-1" />
                )}
                <span
                  className={`text-xs ${change.positive ? "text-green-400" : "text-red-400"}`}
                >{`${change.value} (${change.percentage})`}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
