"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Label } from "../ui/label"
import { Badge } from "../ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { toast } from "sonner"
import { Shield, User, Mail, UserPlus, Crown, Trash2, RefreshCw, Users, Search, MoreHorizontal } from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "../ui/dropdown-menu"
import { DialogDescription, DialogFooter } from "../ui/dialog"

interface AdminUser {
  id: string
  email: string
  name?: string
  is_superuser: boolean
  created_at: string
}

export function AdminTeamManagement() {
  const { session, user } = useAuth()
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [promoting, setPromoting] = useState(false)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchAdminUsers = async () => {
    try {
      setLoading(true)
      // Note: This would need a dedicated API endpoint to list admin users
      // For now, we'll show a simplified version
      const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAdminUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching admin users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchAdminUsers()
    }
  }, [session])

  const promoteToAdmin = async () => {
    if (!email.trim()) {
      toast.error("Please enter an email address")
      return
    }

    setPromoting(true)
    try {
      const response = await fetch("/api/auth/promote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { "Authorization": `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Successfully promoted ${email} to admin`)
        setEmail("")
        setDialogOpen(false)
        fetchAdminUsers() // Refresh the list
      } else {
        toast.error(data.error || `Failed to promote user (Status: ${response.status})`)
      }
    } catch (error) {
      toast.error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setPromoting(false)
    }
  }

  const revokeAdmin = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to revoke admin access from ${userEmail}?`)) {
      return
    }

    setRevoking(userId)
    try {
      const response = await fetch("/api/auth/revoke-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Revoked admin access from ${userEmail}`)
        fetchAdminUsers() // Refresh the list
      } else {
        toast.error(data.error || "Failed to revoke admin access")
      }
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setRevoking(null)
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

  return (
    <div className="space-y-6">
      {/* Search and Add Admin */}
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or user ID"
            className="pl-10 h-9 w-full bg-background border-border text-foreground"
          />
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground border-0" disabled={loading}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a new admin</DialogTitle>
              <DialogDescription>
                Enter the email address of a registered user to promote them to admin.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                type="email"
                placeholder="admin@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={promoteToAdmin} disabled={promoting || !email.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground border-0">
                {promoting ? "Promoting..." : "Promote to Admin"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Admin Team Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="border-b border-border">
              <th className="py-2 px-4 text-left text-muted-foreground font-normal">Name</th>
              <th className="py-2 px-4 text-left text-muted-foreground font-normal">Role & Status</th>
              <th className="py-2 px-4 text-left text-muted-foreground font-normal">Added</th>
              <th className="py-2 px-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && Array.from({ length: 3 }).map((_, i) => (
              <tr key={i}><td colSpan={4} className="p-4"><div className="h-12 bg-muted animate-pulse rounded" /></td></tr>
            ))}
            {!loading && adminUsers.length === 0 && (
              <tr><td colSpan={4} className="text-center p-8 text-muted-foreground">No admin users found.</td></tr>
            )}
            {!loading && adminUsers.map((admin) => (
              <tr key={admin.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-[#b4a0ff]/30 to-[#ffb4a0]/30 flex items-center justify-center">
                      <span className="text-xs font-medium text-foreground">
                        {getInitials(admin.name || admin.email)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-foreground text-sm">{admin.name || admin.email}</div>
                      <div className="text-xs text-muted-foreground">{admin.email}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-950/50 text-emerald-400 border-emerald-700">
                      {admin.email === user?.email ? "Owner" : "Admin"}
                    </Badge>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-foreground">
                  {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : "—"}
                </td>
                <td className="py-3 px-4">
                  {admin.email !== user?.email && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onSelect={() => revokeAdmin(admin.id, admin.email)} 
                          className="text-red-500"
                          disabled={revoking === admin.id}
                        >
                          {revoking === admin.id ? "Removing..." : "Remove admin access"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 