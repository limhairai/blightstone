import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface BalanceCardProps {
  title: string
  amount: string
  change?: {
    value: string
    percentage: string
    positive: boolean
  }
  className?: string
}

export function BalanceCard({ title, amount, change, className }: BalanceCardProps) {
  return (
    <Card className={`airwallex-card ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{amount}</div>
        {change && (
          <div className="flex items-center mt-1">
            <span
              className={`text-xs font-medium flex items-center ${
                change.positive ? "text-green-500" : "text-red-500"
              }`}
            >
              {change.positive ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1" />
              )}
              {change.value} ({change.percentage})
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 