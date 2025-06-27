"use client";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { useState, useMemo, useEffect } from "react"
import { useAuth } from "../../../contexts/AuthContext"
import { Badge } from "../../../components/ui/badge"
import { Input } from "../../../components/ui/input"
import { Users, CheckCircle, AlertTriangle, Clock, Search, Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { cn } from "../../../lib/utils"
import { DataTable } from "../../../components/ui/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "../../../components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog"
import { Label } from "../../../components/ui/label"
import { toast } from "sonner";

interface Team {
  id: string
  name: string
  description: string
  organizationsCount: number
  activeBusinesses: number
  utilizationRate: number
  capacity: number
  status: "active" | "at_capacity" | "needs_backup" | "suspended"
}

export default function TeamsPage() {
  const { session } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false)
  const [newTeamName, setNewTeamName] = useState("")

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/teams', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch teams');
      const data = await response.json();
      setTeams(data.teams || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teams');
      toast.error(err instanceof Error ? err.message : 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch real teams data
  useEffect(() => {
    if(session) fetchTeams()
  }, [session])

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      toast.error("Team name cannot be empty.");
      return;
    }

    try {
      const response = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ name: newTeamName })
      })

      if (!response.ok) {
        throw new Error('Failed to create team');
      }
      
      toast.success("Team created successfully!");
      fetchTeams(); // Refresh the list
      
      setCreateDialogOpen(false);
      setNewTeamName("");

    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'An unexpected error occurred');
    }
  }

  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
      const statusFilter = selectedStatus === "all" || team.status === selectedStatus
      const searchFilter = searchTerm === "" || 
        team.name.toLowerCase().includes(searchTerm.toLowerCase())
      return statusFilter && searchFilter
    })
  }, [teams, selectedStatus, searchTerm])
  
  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading teams...</div>
  }
  
  if (error) {
    return <div className="flex items-center justify-center p-8 text-red-500">Error: {error}</div>
  }

  const getStatusConfig = (status: Team["status"]) => {
    const configs = {
      active: { label: "Active", className: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle, color: "text-green-600" },
      at_capacity: { label: "At Capacity", className: "bg-red-100 text-red-800 border-red-200", icon: AlertTriangle, color: "text-red-600" },
      needs_backup: { label: "Needs Backup", className: "bg-purple-100 text-purple-800 border-purple-200", icon: Clock, color: "text-purple-600" },
      suspended: { label: "Suspended", className: "bg-gray-100 text-gray-800 border-gray-200", icon: AlertTriangle, color: "text-gray-600" },
    }
    return configs[status] || configs.active
  }

  const getStatusBadge = (status: Team["status"]) => {
    const statusConfig = getStatusConfig(status)
    const StatusIcon = statusConfig.icon
    return (
      <Badge className={cn("border", statusConfig.className)}>
        <StatusIcon className={cn("h-3 w-3 mr-1", statusConfig.color)} />
        {statusConfig.label}
      </Badge>
    )
  }

  const columns: ColumnDef<Team>[] = [
    {
      accessorKey: "name",
      header: "Team",
      size: 250,
      cell: ({ row }) => {
        const team = row.original
        return (
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-[#b4a0ff]/20 to-[#ffb4a0]/20 flex items-center justify-center flex-shrink-0">
              <Users className="h-4 w-4 text-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{team.name}</div>
              <div className="text-sm text-muted-foreground truncate">{team.description || 'No description'}</div>
            </div>
          </div>
        )
      },
    },
    { accessorKey: "organizationsCount", header: "Organizations", size: 120, cell: ({ row }) => <div><div className="font-medium">{row.original.organizationsCount} orgs</div></div> },
    { accessorKey: "utilizationRate", header: "Utilization", size: 100, cell: ({ row }) => <div className="text-center"><div className={`font-medium ${row.original.utilizationRate >= 95 ? "text-red-600" : "text-foreground"}`}>{row.original.utilizationRate}%</div><div className="text-xs text-muted-foreground">{row.original.organizationsCount}/{row.original.capacity}</div></div> },
    { accessorKey: "status", header: "Status", size: 120, cell: ({ row }) => getStatusBadge(row.original.status) },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="at_capacity">At Capacity</SelectItem>
              <SelectItem value="needs_backup">Needs Backup</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search teams..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-[250px]" />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">{filteredTeams.length} teams total</div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
                <DialogDescription>
                  Enter a name for the new team. Additional settings can be configured later.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Team Name
                  </Label>
                  <Input
                    id="name"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="col-span-3"
                    placeholder="e.g., Alpha Team"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                <Button type="submit" onClick={handleCreateTeam}>Create Team</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <DataTable columns={columns} data={filteredTeams} />
    </div>
  )
}