"use client"

import { useState } from "react"
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

// In a real
