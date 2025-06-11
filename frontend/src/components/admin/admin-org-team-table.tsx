import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"

// Define a type for team member entries
interface TeamMember {
  id: string; // Or number, depending on API response
  name: string;
  email: string;
  role: string; // Consider using a union type e.g., "admin" | "member"
  status: "active" | "invited" | string; // Allow other statuses if any
}

export function AdminOrgTeamTable({ orgId }: { orgId: string }) {
  const [team, setTeam] = useState<TeamMember[]>([]) // Use specific type
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    setLoading(true)
    setError("")
    fetch(`/api/v1/organizations/${orgId}/members`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch team members")
        return res.json()
      })
      .then(data => setTeam(data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [orgId])

  if (loading) return <div className="p-4 text-center">Loading team...</div>
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left">Name</th>
              <th className="py-2 text-left">Email</th>
              <th className="py-2 text-left">Role</th>
              <th className="py-2 text-left">Status</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {team.map((member) => (
              <tr key={member.id} className="border-b hover:bg-muted/50">
                <td className="py-2">{member.name}</td>
                <td className="py-2">{member.email}</td>
                <td className="py-2">{member.role}</td>
                <td className="py-2">
                  <Badge variant="outline" className={
                    member.status === "active"
                      ? "bg-green-100 text-green-800 border-green-200"
                      : "bg-yellow-100 text-yellow-800 border-yellow-200"
                  }>{member.status}</Badge>
                </td>
                <td className="py-2 text-right flex gap-2 justify-end">
                  <Button size="sm" variant="outline">Edit</Button>
                  <Button size="sm" variant="outline">Remove</Button>
                  {member.status === "invited" && <Button size="sm" variant="outline">Resend Invite</Button>}
                  {/* TODO: Implement actions */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4">
          <Button variant="outline" className="bg-green-100 text-green-700 border-green-200 hover:bg-green-200">Invite User</Button>
          {/* TODO: Implement invite user dialog */}
        </div>
      </CardContent>
    </Card>
  )
} 