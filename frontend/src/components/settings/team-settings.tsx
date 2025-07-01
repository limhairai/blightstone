"use client"

import { useState } from "react"
import useSWR, { useSWRConfig } from 'swr'
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
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { gradientTokens } from "../../lib/design-tokens"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/contexts/AuthContext"
import { authenticatedFetcher } from "@/lib/swr-config"

type TeamMember = {
  id: string
  name: string
  email: string
  role: "owner" | "admin" | "member"
  status: "active" | "pending" | "suspended"
  joined_at: string
  avatar_url?: string
}

export function TeamSettings() {
  const { session } = useAuth()
  const { currentOrganizationId } = useOrganizationStore()
  const { mutate } = useSWRConfig()
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<TeamMember['role']>("member")
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null)
  const [loading, setLoading] = useState(false)

  const teamSWRKey = session && currentOrganizationId ? ['/api/teams/members', session.access_token] : null
  const { data: teamData, isLoading: isTeamLoading, error: teamError } = useSWR(
    teamSWRKey, 
    ([url, token]) => authenticatedFetcher(url, token)
  );
  const teamMembers = teamData?.members || [];
  
  const filteredMembers = searchQuery
    ? teamMembers.filter(
        (member: TeamMember) =>
          member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.email.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : teamMembers

  const handleInvite = async () => {
    if (!inviteEmail) {
      toast.error("Please enter an email address.")
      return
    }

    const existingMember = teamMembers.find((member: TeamMember) => member.email === inviteEmail)
    if (existingMember) {
      toast.error("A team member with this email already exists.")
      return
    }

    setLoading(true)
    try {
      // TODO: Replace with API call to /api/teams/members/invite

      toast.success(`Invitation sent to ${inviteEmail}`)
      setInviteDialogOpen(false)
      setInviteEmail("")
      setInviteRole("member")
    } catch (error) {
      toast.error('Failed to invite team member. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = (member: TeamMember) => {
    setMemberToRemove(member)
    setConfirmRemoveOpen(true)
  }

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return

    setLoading(true)
    try {
      // TODO: Replace with API call to /api/teams/members/:id

      toast.success(`${memberToRemove.name} has been removed from the team`)
      setConfirmRemoveOpen(false)
      setMemberToRemove(null)
    } catch (error) {
      toast.error('Failed to remove team member. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (memberId: string, newRole: TeamMember['role']) => {
    setLoading(true)
    try {
      // TODO: Replace with API call to /api/teams/members/:id

      const member = teamMembers.find((m: TeamMember) => m.id === memberId)
      toast.success(`${member?.name}'s role has been updated to ${newRole}`)
    } catch (error) {
      toast.error('Failed to update member role. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendInvite = async (email: string) => {
    setLoading(true)
    try {
      // In a real app, this would resend the invitation email
      toast.success(`Invitation resent to ${email}`)
    } catch (error) {
      toast.error('Failed to resend invitation. Please try again.')
    } finally {
      setLoading(false)
    }
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
    // This logic needs to be re-implemented with the new data structure from usePermissions
    return true;
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
            <Button className={gradientTokens.primary} disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite a new team member</DialogTitle>
              <DialogDescription>
                Enter the email address and select a role for the new member.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                type="email"
                placeholder="email@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as TeamMember['role'])}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleInvite} disabled={loading} className={gradientTokens.primary}>
                {loading ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Team Members Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="border-b border-border">
              <th className="py-2 px-4 text-left text-muted-foreground font-normal">Name</th>
              <th className="py-2 px-4 text-left text-muted-foreground font-normal">Role & Status</th>
              <th className="py-2 px-4 text-left text-muted-foreground font-normal">Joined</th>
              <th className="py-2 px-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isTeamLoading && Array.from({ length: 3 }).map((_, i) => (
              <tr key={i}><td colSpan={4}><Skeleton className="h-12 w-full" /></td></tr>
            ))}
            {teamError && <tr><td colSpan={4} className="text-center text-red-500 p-4">Failed to load team members.</td></tr>}
            {!isTeamLoading && !teamError && filteredMembers.map((member: TeamMember) => (
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
                <td className="py-3 px-4 text-sm text-foreground">{new Date(member.joined_at).toLocaleDateString() || "—"}</td>
                <td className="py-3 px-4">
                  {canManageUser(member) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => handleRoleChange(member.id, 'admin')}>Change role to Admin</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleRoleChange(member.id, 'member')}>Change role to Member</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => handleRemoveMember(member)} className="text-red-500">
                          Remove from team
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredMembers.length === 0 && !isTeamLoading && (
          <div className="text-center p-8 text-muted-foreground">
            No team members found.
          </div>
        )}
      </div>

      {/* Confirm Remove Dialog */}
      <AlertDialog open={confirmRemoveOpen} onOpenChange={setConfirmRemoveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {memberToRemove?.name} from the team. They will lose access to the organization.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveMember} disabled={loading} className="bg-red-500 hover:bg-red-600">
              {loading ? "Removing..." : "Remove Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
