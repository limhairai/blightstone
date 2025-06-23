import { useState } from "react"
import { Button } from "../ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Textarea } from "../ui/textarea"
import { Edit, Archive, UserPlus } from "lucide-react"

interface Organization {
  id: string
  name: string
  status: string
  description?: string
}

export function QuickActions({ org }: { org: Organization }) {
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  // Edit form state
  const [editName, setEditName] = useState(org?.name || "")
  const [editDescription, setEditDescription] = useState(org?.description || "")
  
  // Invite form state
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("member")

  const handleEdit = async () => {
    if (!editName.trim()) return
    try {
      setLoading(true)
      setError("")
      const response = await fetch(`/api/v1/organizations/${org.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: editName, 
          description: editDescription 
        }),
      })
      
      if (!response.ok) throw new Error("Failed to update organization")
      
      setEditDialogOpen(false)
      // Refresh the page or emit an event to update the parent component
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update organization")
    } finally {
      setLoading(false)
    }
  }

  const handleArchive = async () => {
    if (!confirm(`Are you sure you want to archive "${org.name}"? This action can be undone later.`)) return
    try {
      setLoading(true)
      setError("")
      const response = await fetch(`/api/v1/organizations/${org.id}/archive`, {
        method: "POST",
      })
      
      if (!response.ok) throw new Error("Failed to archive organization")
      
      // Refresh the page or emit an event to update the parent component
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive organization")
    } finally {
      setLoading(false)
    }
  }

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) return
    try {
      setLoading(true)
      setError("")
      const response = await fetch(`/api/v1/organizations/${org.id}/members/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: inviteEmail, 
          role: inviteRole 
        }),
      })
      
      if (!response.ok) throw new Error("Failed to invite user")
      
      setInviteEmail("")
      setInviteRole("member")
      setInviteDialogOpen(false)
      alert(`Invitation sent to ${inviteEmail}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite user")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      {/* Edit Organization Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="bg-[#b19cd9] text-black hover:bg-[#9f84ca]">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            <div>
              <Label htmlFor="edit-org-name">Organization Name</Label>
              <Input
                id="edit-org-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Organization name"
              />
            </div>
            <div>
              <Label htmlFor="edit-org-description">Description</Label>
              <Textarea
                id="edit-org-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Organization description (optional)"
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={!editName.trim() || loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Archive Button */}
      <Button 
        variant="outline" 
        className="bg-red-100 text-red-700 border-red-200 hover:bg-red-200"
        onClick={handleArchive}
        disabled={loading}
      >
        <Archive className="h-4 w-4 mr-2" />
        Archive
      </Button>

      {/* Invite User Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="bg-green-100 text-green-700 border-green-200 hover:bg-green-200">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite User to {org.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            <div>
              <Label htmlFor="invite-user-email">Email Address</Label>
              <Input
                id="invite-user-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label htmlFor="invite-user-role">Role</Label>
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
              <Button onClick={handleInviteUser} disabled={!inviteEmail.trim() || loading}>
                {loading ? "Sending..." : "Send Invite"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 