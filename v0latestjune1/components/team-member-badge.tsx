import { Badge } from "@/components/ui/badge"

interface TeamMemberBadgeProps {
  role: "admin" | "member" | "viewer"
}

export function TeamMemberBadge({ role }: TeamMemberBadgeProps) {
  const labels = {
    admin: "Admin",
    member: "Member",
    viewer: "Viewer",
  }

  return (
    <Badge variant={role} className="px-3 py-1">
      {labels[role]}
    </Badge>
  )
}
