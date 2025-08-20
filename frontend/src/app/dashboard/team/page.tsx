"use client"

import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Shield, Calendar, Clock, Check, X } from "lucide-react"
import { toast } from "sonner"
import { teamApi } from "@/lib/api"

interface TeamMember {
  id: string
  name: string
  email: string
  isAdmin: boolean
  joinedAt: string
  lastActive?: string
}

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  // Fetch team members
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setLoading(true)
        setError(null)
        const members = await teamApi.getAll()
        setTeamMembers(members)
      } catch (err) {
        console.error('Error fetching team members:', err)
        setError('Failed to load team members')
      } finally {
        setLoading(false)
      }
    }

    fetchTeamMembers()
  }, [])

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatLastActive = (dateString: string) => {
    if (!dateString) return 'Never'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    // For older than a week, show the date
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: diffInDays > 365 ? 'numeric' : undefined
    })
  }

  const getInitials = (name: string) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleStartEdit = (member: TeamMember) => {
    setEditingMemberId(member.id)
    setEditingName(member.name)
  }

  const handleSaveName = async (memberId: string) => {
    if (!editingName.trim()) {
      toast.error('Name cannot be empty')
      return
    }

    setIsUpdating(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName.trim() })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update name')
      }

      // Update local state
      setTeamMembers(prev => prev.map(member => 
        member.id === memberId 
          ? { ...member, name: editingName.trim() }
          : member
      ))

      setEditingMemberId(null)
      setEditingName("")
      toast.success('Name updated successfully')
    } catch (error) {
      console.error('Error updating name:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update name')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingMemberId(null)
    setEditingName("")
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center text-muted-foreground">
          Loading team members...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center text-red-600">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">


      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No team members found.
                </TableCell>
              </TableRow>
            ) : (
              teamMembers.map((member) => (
                <TableRow key={member.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      {editingMemberId === member.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="h-8 text-sm font-medium"
                            placeholder="Enter name"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveName(member.id)
                              } else if (e.key === 'Escape') {
                                handleCancelEdit()
                              }
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSaveName(member.id)}
                            disabled={isUpdating}
                            className="h-8 w-8 p-0"
                            title="Save"
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEdit}
                            disabled={isUpdating}
                            className="h-8 w-8 p-0"
                            title="Cancel"
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <span 
                          className="font-medium cursor-pointer hover:bg-muted/50 px-2 py-1 rounded"
                          onClick={() => handleStartEdit(member)}
                          title="Click to edit name"
                        >
                          {member.name || 'Unknown User'}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.email}
                  </TableCell>
                  <TableCell>
                    {member.isAdmin ? (
                      <Badge variant="secondary" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Member
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(member.joinedAt)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.lastActive ? (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatLastActive(member.lastActive)}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground/50">Never</span>
                    )}
                  </TableCell>

                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>


    </div>
  )
}