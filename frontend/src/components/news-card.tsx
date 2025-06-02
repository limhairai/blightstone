import { ArrowUpRight, ExternalLink } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tag } from "@/components/ui/tag"

interface NewsCardProps {
  category?: string
  title: string
  description?: string
  date?: string
  isPositive?: boolean
}

export function NewsCard({ category, title, description, date, isPositive }: NewsCardProps) {
  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between">
        {category && (
          <div className="flex items-center gap-2">
            <Tag variant="outline" className="text-xs">
              {category}
            </Tag>
            {isPositive !== undefined && (
              <span className={isPositive ? "text-green-400" : "text-red-400"}>
                {isPositive ? "bullish" : "bearish"}
                {isPositive ? <ArrowUpRight className="inline ml-1 h-3 w-3" /> : null}
              </span>
            )}
          </div>
        )}
        {date && <span className="text-xs text-muted-foreground">{date}</span>}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <h3 className="text-lg font-medium leading-tight mb-2">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between">
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-white">
          Insight
        </Button>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-white">
          <ExternalLink className="h-3 w-3 mr-1" />
          About
        </Button>
      </CardFooter>
    </Card>
  )
}
