"use client"

import { useState } from "react"
import { MoreHorizontal, Search, Plus } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback } from "../ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog"
import { toast } from "sonner"
import { useDemoState, type TeamMember } from "../../contexts/DemoStateContext"
import { gradientTokens } from "../../lib/design-tokens"

export function TeamSettings() {
  const { state, inviteTeamMember, removeTeamMember, changeMemberRole, resendInvitation } = useDemoState()
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<TeamMember['role']>("member")
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null)

  // Use real-time team members from demo state
  const teamMembers = state.teamMembers

  const filteredMembers = searchQuery
    ? teamMembers.filter(
        (member) =>
          member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.email.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : teamMembers

  const handleInvite = async () => {
    if (!inviteEmail) {
      toast.error("Please enter an email address.")
      return
    }

    // Check if email already exists
    const existingMember = teamMembers.find(member => member.email === inviteEmail)
    if (existingMember) {
      toast.error("A team member with this email already exists.")
      return
    }

    try {
      await inviteTeamMember(inviteEmail, inviteRole, state.userProfile.firstName + " " + state.userProfile.lastName)
      setInviteDialogOpen(false)
      setInviteEmail("")
      setInviteRole("member")
    } catch (error) {
      console.error('Failed to invite team member:', error)
    }
  }

  const handleRemoveMember = (member: TeamMember) => {
    setMemberToRemove(member)
    setConfirmRemoveOpen(true)
  }

  const confirmRemoveMember = () => {
    if (!memberToRemove) return

    removeTeamMember(memberToRemove.id)
    setConfirmRemoveOpen(false)
    setMemberToRemove(null)
  }

  const handleRoleChange = (memberId: string, newRole: TeamMember['role']) => {
    changeMemberRole(memberId, newRole)
  }

  const handleResendInvite = (email: string) => {
    resendInvitation(email)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Email copied to clipboard.")
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner":
        return <Badge className="bg-emerald-950/50 text-emerald-400 border-emerald-700">Owner</Badge>
      case "admin":
        return <Badge className="bg-blue-950/50 text-blue-400 border-blue-700">Admin</Badge>
      case "member":
        return <span>Member</span>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return null // No badge for active users
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-950/50 text-yellow-400 border-yellow-700">
            Pending
          </Badge>
        )
      case "suspended":
        return (
          <Badge variant="outline" className="bg-red-950/50 text-red-400 border-red-700">
            Suspended
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getInitials = (name: string) => {
    if (!name) return "?"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const canManageUser = (member: TeamMember) => {
    // Owner can manage everyone except themselves
    // Admin can manage members but not owners or other admins
    // Members can't manage anyone
    const currentUser = teamMembers.find(m => m.id === state.userProfile.id)
    if (!currentUser) return false

    if (currentUser.id === member.id) return false // Can't manage yourself
    if (currentUser.role === "owner") return true
    if (currentUser.role === "admin" && member.role === "member") return true
    return false
  }

  return (
    <div className="space-y-6">
      {/* Search and Add User */}
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, role, or user ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9 w-full bg-background border-border text-foreground"
          />
        </div>

        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className={gradientTokens.primary}
              disabled={state.loading.team}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add user
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Invite Team Member</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Send an invitation to join your organization.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium text-foreground">
                  Role
                </label>
                <Select value={inviteRole} onValueChange={(value: TeamMember['role']) => setInviteRole(value)}>
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="member" className="text-popover-foreground hover:bg-accent">
                      Member
                    </SelectItem>
                    <SelectItem value="admin" className="text-popover-foreground hover:bg-accent">
                      Admin
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Members can view and manage accounts. Admins can also manage team members and businesses.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setInviteDialogOpen(false)}
                className="border-border text-foreground hover:bg-accent"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleInvite}
                disabled={state.loading.team}
                className={gradientTokens.primary}
              >
                {state.loading.team ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Team Members Table */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">User</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Role</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Joined</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Last Login</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Sign-ins</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Authentication</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={gradientTokens.avatar}>
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-foreground text-sm">{member.name}</div>
                        <div className="text-xs text-muted-foreground">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {getRoleBadge(member.role)}
                      {getStatusBadge(member.status)}
                      {member.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResendInvite(member.email)}
                          className="text-xs h-6 px-2 text-muted-foreground hover:text-foreground"
                        >
                          Resend
                        </Button>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-foreground">{member.joined || "—"}</td>
                  <td className="py-3 px-4 text-sm text-foreground">{member.lastLogin || "—"}</td>
                  <td className="py-3 px-4 text-sm text-foreground">{member.signInCount || 0}</td>
                  <td className="py-3 px-4 text-sm text-foreground">{member.authentication || "—"}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      {canManageUser(member) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-border">
                            <DropdownMenuItem
                              onClick={() => copyToClipboard(member.email)}
                              className="text-foreground hover:bg-accent"
                            >
                              Copy Email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem
                              onClick={() => handleRoleChange(member.id, member.role === "admin" ? "member" : "admin")}
                              className="text-foreground hover:bg-accent"
                            >
                              {member.role === "admin" ? "Make Member" : "Make Admin"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem
                              onClick={() => handleRemoveMember(member)}
                              className="text-red-400 hover:bg-red-950/20"
                            >
                              Remove User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Remove Dialog */}
      <Dialog open={confirmRemoveOpen} onOpenChange={setConfirmRemoveOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Remove Team Member</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to remove {memberToRemove?.name} from your organization? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmRemoveOpen(false)}
              className="border-border text-foreground hover:bg-accent"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmRemoveMember}
              className={gradientTokens.primary}
            >
              Remove Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
