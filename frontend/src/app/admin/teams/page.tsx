"use client";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { useState, useMemo } from "react"
import { Badge } from "../../../components/ui/badge"
import { Input } from "../../../components/ui/input"
import { Users, CheckCircle, AlertTriangle, Clock, Search } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { cn } from "../../../lib/utils"
import { DataTable } from "../../../components/ui/data-table"
import type { ColumnDef } from "@tanstack/react-table"

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
  // Mock teams data
  const [teams] = useState<Team[]>([
    {
      id: "team-1",
      name: "Team Alpha",
      description: "Primary operations team",
      organizationsCount: 15,
      activeBusinesses: 45,
      utilizationRate: 75,
      capacity: 20,
      status: "active"
    },
    {
      id: "team-2", 
      name: "Team Beta",
      description: "Enterprise accounts team",
      organizationsCount: 19,
      activeBusinesses: 62,
      utilizationRate: 95,
      capacity: 20,
      status: "at_capacity"
    },
    {
      id: "team-3",
      name: "Team Gamma",
      description: "Small business team",
      organizationsCount: 12,
      activeBusinesses: 28,
      utilizationRate: 60,
      capacity: 20,
      status: "needs_backup"
    }
  ])
  
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
      const statusFilter = selectedStatus === "all" || team.status === selectedStatus
      const searchFilter = searchTerm === "" || 
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.description.toLowerCase().includes(searchTerm.toLowerCase())
      return statusFilter && searchFilter
    })
  }, [teams, selectedStatus, searchTerm])

  const getStatusConfig = (status: Team["status"]) => {
    const configs = {
      active: {
        label: "Active",
        className: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
        color: "text-green-600",
      },
      at_capacity: {
        label: "At Capacity",
        className: "bg-red-100 text-red-800 border-red-200",
        icon: AlertTriangle,
        color: "text-red-600",
      },
      needs_backup: {
        label: "Needs Backup",
        className: "bg-purple-100 text-purple-800 border-purple-200",
        icon: Clock,
        color: "text-purple-600",
      },
      suspended: {
        label: "Suspended",
        className: "bg-gray-100 text-gray-800 border-gray-200",
        icon: AlertTriangle,
        color: "text-gray-600",
      },
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
              <div className="text-sm text-muted-foreground truncate">{team.description}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "organizationsCount",
      header: "Organizations",
      size: 120,
      cell: ({ row }) => {
        const team = row.original
        return (
          <div>
            <div className="font-medium">{team.organizationsCount} organizations</div>
            <div className="text-sm text-muted-foreground">{team.activeBusinesses} businesses</div>
          </div>
        )
      },
    },
    {
      accessorKey: "utilizationRate",
      header: "Utilization",
      size: 100,
      cell: ({ row }) => {
        const team = row.original
        const isHighUtilization = team.utilizationRate >= 95
        return (
          <div className="text-center">
            <div className={`font-medium ${isHighUtilization ? "text-red-600" : "text-foreground"}`}>
              {team.utilizationRate}%
            </div>
            <div className="text-xs text-muted-foreground">
              {team.organizationsCount}/{team.capacity}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 120,
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
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
            <Input
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-[250px]"
            />
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">{filteredTeams.length} teams total</div>
      </div>

      <DataTable columns={columns} data={filteredTeams} />
    </div>
  )
} 