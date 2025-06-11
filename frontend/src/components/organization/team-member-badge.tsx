import { Badge } from "../ui/badge"

interface TeamMemberBadgeProps {
  role: "admin" | "member" | "viewer"
}

export function TeamMemberBadge({ role }: TeamMemberBadgeProps) {
  const labels = {
    admin: "Admin",
    member: "Member",
    viewer: "Viewer",
  }

  const variants = {
    admin: "default" as const,
    member: "secondary" as const,
    viewer: "outline" as const,
  }

  return (
    <Badge variant={variants[role]} className="px-3 py-1">
      {labels[role]}
    </Badge>
  )
}
