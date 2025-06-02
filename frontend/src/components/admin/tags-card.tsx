import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function TagsCard({ tags }: { tags: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tags</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {tags && tags.length ? (
          tags.map((tag, i) => (
            <Badge key={i} variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">{tag}</Badge>
          ))
        ) : (
          <span className="text-xs text-muted-foreground">No tags</span>
        )}
        {/* TODO: Add tag management actions (add/remove/edit) */}
      </CardContent>
    </Card>
  )
} 