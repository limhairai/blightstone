"use client"

import { useState } from "react"
import { MoreHorizontal, Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface TeamMember {
  id: string
  name: string
  email: string
  role: "owner" | "admin" | "member" | "pending"
  joined?: string
  lastLogin?: string
  avatar?: string
  signInCount?: number
  authentication?: string
}

export function TeamSettings() {
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("member")
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null)
  const { toast } = useToast()

  const teamMembers: TeamMember[] = [
    {
      id: "1",
      name: "Sam Lee",
      email: "sam@example.com",
      role: "member",
      joined: "Apr 17, 2025",
      lastLogin: "Apr 17, 2025, 03:18 PM",
      authentication: "Text Provider",
      signInCount: 1,
    },
    {
      id: "2",
      name: "Alex Johnson",
      email: "alex@example.com",
      role: "admin",
      joined: "Mar 5, 2025",
      lastLogin: "Jun 7, 2025, 11:42 AM",
      authentication: "Google",
      signInCount: 24,
    },
    {
      id: "3",
      name: "Jamie Smith",
      email: "jamie@example.com",
      role: "owner",
      joined: "Jan 12, 2025",
      lastLogin: "Jun 8, 2025, 09:15 AM",
      authentication: "Text Provider",
      signInCount: 57,
    },
    {
      id: "4",
      name: "Taylor Wilson",
      email: "taylor@example.com",
      role: "pending",
      joined: "Jun 5, 2025",
      authentication: "Pending",
      signInCount: 0,
    },
  ]

  const filteredMembers = searchQuery
    ? teamMembers.filter(
        (member) =>
          member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.email.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : teamMembers

  const handleInvite = () => {
    if (!inviteEmail) {
      toast({
        title: "Missing information",
        description: "Please enter an email address.",
        variant: "destructive",
      })
      return
    }

    console.log(`Inviting ${inviteEmail} as ${inviteRole}`)
    setInviteDialogOpen(false)

    toast({
      title: "Invitation Sent",
      description: `Invitation sent to ${inviteEmail} with ${inviteRole} role.`,
    })

    setInviteEmail("")
    setInviteRole("member")
  }

  const handleRemoveMember = (member: TeamMember) => {
    setMemberToRemove(member)
    setConfirmRemoveOpen(true)
  }

  const confirmRemoveMember = () => {
    if (!memberToRemove) return

    // In a real app, this would call an API
    toast({
      title: "Member Removed",
      description: `${memberToRemove.name} has been removed from the team.`,
    })

    setConfirmRemoveOpen(false)
    setMemberToRemove(null)
  }

  const handleRoleChange = (memberId: string, newRole: string) => {
    // In a real app, this would call an API
    toast({
      title: "Role Updated",
      description: `User role has been updated to ${newRole}.`,
    })
  }

  const handleResendInvite = (email: string) => {
    toast({
      title: "Invitation Resent",
      description: `Invitation has been resent to ${email}.`,
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Email copied to clipboard.",
    })
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner":
        return <Badge className="bg-emerald-950/50 text-emerald-400 border-emerald-700">Owner</Badge>
      case "admin":
        return <Badge className="bg-blue-950/50 text-blue-400 border-blue-700">Admin</Badge>
      case "member":
        return <span>Member</span>
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-950/50 text-yellow-400 border-yellow-700">
            Pending
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
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
            <Button className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0">
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
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <Input
                  placeholder="colleague@example.com"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Role</label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="admin" className="text-popover-foreground hover:bg-accent">
                      Admin - Full access to all settings
                    </SelectItem>
                    <SelectItem value="member" className="text-popover-foreground hover:bg-accent">
                      Member - Limited access to settings
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {inviteRole === "admin"
                    ? "Admins can manage team members, billing, and all settings."
                    : "Members can access and manage content but have limited access to settings."}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setInviteDialogOpen(false)}
                size="sm"
                className="border-border text-foreground hover:bg-accent"
              >
                Cancel
              </Button>
              <Button
                className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0"
                onClick={handleInvite}
                size="sm"
              >
                Send Invitation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Team Members Table */}
      {filteredMembers.length > 0 ? (
        <div className="border border-border rounded-md overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">User</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Authentication</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Role</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Membership</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Sign-in count</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Last sign-in</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        {member.avatar ? (
                          <img src={member.avatar || "/placeholder.svg"} alt={member.name} />
                        ) : (
                          <AvatarFallback className="bg-gray-200 text-gray-600">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <div className="font-medium text-foreground">{member.email}</div>
                        <div className="text-xs text-muted-foreground">{member.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-foreground">{member.authentication}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-foreground">{getRoleBadge(member.role)}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                      <span className="text-sm text-foreground">
                        {member.role === "pending" ? "Invited" : "Active"}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-foreground">{member.signInCount}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-foreground">{member.lastLogin || "Never"}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border">
                        {member.role !== "owner" && (
                          <>
                            <DropdownMenuItem
                              className="text-popover-foreground hover:bg-accent"
                              onClick={() => handleRoleChange(member.id, "admin")}
                              disabled={member.role === "admin"}
                            >
                              Make Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-popover-foreground hover:bg-accent"
                              onClick={() => handleRoleChange(member.id, "member")}
                              disabled={member.role === "member" || member.role === "pending"}
                            >
                              Make Member
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border" />
                          </>
                        )}

                        <DropdownMenuItem
                          className="text-popover-foreground hover:bg-accent"
                          onClick={() => copyToClipboard(member.email)}
                        >
                          Copy Email
                        </DropdownMenuItem>

                        {member.role === "pending" && (
                          <DropdownMenuItem
                            className="text-popover-foreground hover:bg-accent"
                            onClick={() => handleResendInvite(member.email)}
                          >
                            Resend Invite
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator className="bg-border" />

                        {member.role !== "owner" && (
                          <DropdownMenuItem
                            className="text-red-500 hover:bg-red-500/10"
                            onClick={() => handleRemoveMember(member)}
                          >
                            Remove User
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 border border-border rounded-md">
          <div className="rounded-full bg-muted p-4 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
                fill="currentColor"
                fillOpacity="0.5"
              />
            </svg>
          </div>
          <p className="text-base font-medium text-foreground">This organization has no users</p>
        </div>
      )}

      {/* Confirm Remove Dialog */}
      <Dialog open={confirmRemoveOpen} onOpenChange={setConfirmRemoveOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Remove Team Member</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to remove this team member? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {memberToRemove && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gray-200 text-gray-600">
                    {getInitials(memberToRemove.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-foreground">{memberToRemove.name}</div>
                  <div className="text-sm text-muted-foreground">{memberToRemove.email}</div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmRemoveOpen(false)}
              className="border-border text-foreground hover:bg-accent"
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRemoveMember}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
