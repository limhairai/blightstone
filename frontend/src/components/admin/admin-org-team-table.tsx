import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Label } from "../ui/label"
import { UserPlus, Pencil, Trash2, Mail } from "lucide-react"

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
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  
  // Invite form state
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("member")
  
  // Edit form state
  const [editName, setEditName] = useState("")
  const [editRole, setEditRole] = useState("")

  useEffect(() => {
    fetchTeamMembers()
  }, [orgId])

  const fetchTeamMembers = () => {
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
  }

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) return
    try {
      setLoading(true)
      const response = await fetch(`/api/v1/organizations/${orgId}/members/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      
      if (!response.ok) throw new Error("Failed to invite user")
      
      setInviteEmail("")
      setInviteRole("member")
      setInviteDialogOpen(false)
      fetchTeamMembers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite user")
    } finally {
      setLoading(false)
    }
  }

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member)
    setEditName(member.name)
    setEditRole(member.role)
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingMember || !editName.trim()) return
    try {
      setLoading(true)
      const response = await fetch(`/api/v1/organizations/${orgId}/members/${editingMember.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, role: editRole }),
      })
      
      if (!response.ok) throw new Error("Failed to update member")
      
      setEditDialogOpen(false)
      setEditingMember(null)
      fetchTeamMembers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update member")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the team?`)) return
    try {
      setLoading(true)
      const response = await fetch(`/api/v1/organizations/${orgId}/members/${memberId}`, {
        method: "DELETE",
      })
      
      if (!response.ok) throw new Error("Failed to remove member")
      
      fetchTeamMembers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member")
    } finally {
      setLoading(false)
    }
  }

  const handleResendInvite = async (memberId: string, memberEmail: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/v1/organizations/${orgId}/members/${memberId}/resend-invite`, {
        method: "POST",
      })
      
      if (!response.ok) throw new Error("Failed to resend invite")
      
      // Show success message (you might want to add a toast notification here)
      alert(`Invite resent to ${memberEmail}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend invite")
    } finally {
      setLoading(false)
    }
  }

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
                  <Button size="sm" variant="outline" onClick={() => handleEditMember(member)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleRemoveMember(member.id, member.name)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  {member.status === "invited" && (
                    <Button size="sm" variant="outline" onClick={() => handleResendInvite(member.id, member.email)}>
                      <Mail className="h-3 w-3" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4">
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-green-100 text-green-700 border-green-200 hover:bg-green-200">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="invite-email">Email Address</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="invite-role">Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleInviteUser} disabled={!inviteEmail.trim()}>
                    Send Invite
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Member Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Member name"
                />
              </div>
              <div>
                <Label htmlFor="edit-role">Role</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={!editName.trim()}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
} 