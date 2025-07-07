"use client";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { useState, useMemo } from "react"
import { useAuth } from "../../../contexts/AuthContext"
import useSWR from 'swr'
import { Badge } from "../../../components/ui/badge"
import { Input } from "../../../components/ui/input"
import { Users, CheckCircle, AlertTriangle, Clock, Search, Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { cn } from "../../../lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
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
  profilesCount: number
  activeProfiles: number
  adminProfiles: number
  backupProfiles: number
  businessManagersCount: number
  adAccountsCount: number
  bmCapacity: number
  bmUtilization: number
  // Legacy compatibility fields
  organizationsCount: number
  activeBusinesses: number
  utilizationRate: number
  capacity: number
  status: "active" | "at_capacity" | "needs_backup" | "suspended"
  profiles: any[]
  businessManagers: any[]
  adAccounts: any[]
}

const fetcher = async (url: string, token: string) => {
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!response.ok) {
    throw new Error('Failed to fetch teams')
  }
  return response.json()
}

export default function TeamsPage() {
  const { session } = useAuth()
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [showTeamDetails, setShowTeamDetails] = useState(false)

  // Use SWR for better caching and performance
  const { data, error, isLoading, mutate } = useSWR(
    session?.access_token ? ['/api/admin/teams', session.access_token] : null,
    ([url, token]) => fetcher(url, token),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // 30 seconds
      errorRetryCount: 3,
      errorRetryInterval: 2000,
    }
  )

  const teams = data?.teams || []

  const handleTeamClick = (team: Team) => {
    setSelectedTeam(team)
    setShowTeamDetails(true)
  }

  const filteredTeams = useMemo(() => {
    return teams.filter((team: Team) => {
      const statusFilter = selectedStatus === "all" || team.status === selectedStatus
      const searchFilter = searchTerm === "" || 
        team.name.toLowerCase().includes(searchTerm.toLowerCase())
      return statusFilter && searchFilter
    })
  }, [teams, selectedStatus, searchTerm])
  
  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading teams...</div>
  }
  
  if (error) {
    return <div className="flex items-center justify-center p-8 text-red-500">Error: {error.message}</div>
  }

  const getStatusConfig = (status: Team["status"]) => {
    const configs = {
      active: { label: "Active", className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800", icon: CheckCircle, color: "text-[#34D197]" },
      at_capacity: { label: "At BM Capacity", className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800", icon: AlertTriangle, color: "text-[#F56565]" },
      needs_backup: { label: "Needs Admin", className: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800", icon: Clock, color: "text-[#FFC857]" },
      suspended: { label: "No Active Profiles", className: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800", icon: AlertTriangle, color: "text-gray-600" },
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



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="at_capacity">At BM Capacity</SelectItem>
              <SelectItem value="needs_backup">Needs Admin</SelectItem>
              <SelectItem value="suspended">No Active Profiles</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">{filteredTeams.length} teams total</div>
          <div className="text-xs text-muted-foreground">Teams are auto-generated from Dolphin profiles</div>
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-muted/50">
              <TableHead className="text-muted-foreground">Team</TableHead>
              <TableHead className="text-muted-foreground">Business Managers</TableHead>
              <TableHead className="text-muted-foreground">Utilization</TableHead>
              <TableHead className="text-muted-foreground">Ad Accounts</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTeams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No teams found.
                </TableCell>
              </TableRow>
            ) : (
              filteredTeams.map((team) => (
                <TableRow key={team.id} className="border-border hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-0 cursor-pointer" onClick={() => handleTeamClick(team)}>
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-[#b4a0ff]/20 to-[#ffb4a0]/20 flex items-center justify-center flex-shrink-0">
                        <Users className="h-4 w-4 text-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{team.name}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {team.profilesCount} profiles ({team.adminProfiles} admin, {team.backupProfiles} backup)
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{team.businessManagersCount}/{team.bmCapacity}</div>
                      <div className="text-sm text-muted-foreground">BM capacity</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <div className={`font-medium ${team.bmUtilization >= 90 ? "text-[#F56565]" : team.bmUtilization >= 70 ? "text-[#FFC857]" : "text-[#34D197]"}`}>
                        {team.bmUtilization}%
                      </div>
                      <div className="text-xs text-muted-foreground">BM utilization</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{team.adAccountsCount}</div>
                      <div className="text-sm text-muted-foreground">total accounts</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(team.status)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Team Details Dialog */}
      {selectedTeam && (
        <Dialog open={showTeamDetails} onOpenChange={setShowTeamDetails}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle>{selectedTeam.name} Details</DialogTitle>
                  <DialogDescription>
                    Business Manager capacity and team asset management
                  </DialogDescription>
                </div>
                <div>{getStatusBadge(selectedTeam.status)}</div>
              </div>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Team Overview */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-[#b4a0ff]/10 to-[#ffb4a0]/10 border border-[#b4a0ff]/20 p-3 rounded-lg">
                  <div className="text-sm font-medium text-[#b4a0ff]">Profiles</div>
                  <div className="text-2xl font-bold">{selectedTeam.profilesCount}</div>
                  <div className="text-xs text-muted-foreground">{selectedTeam.activeProfiles} active</div>
                </div>
                <div className="bg-green-50 border border-green-200 p-3 rounded-lg dark:bg-green-900/20 dark:border-green-800">
                  <div className="text-sm font-medium text-[#34D197]">Business Managers</div>
                  <div className="text-2xl font-bold">{selectedTeam.businessManagersCount}</div>
                  <div className="text-xs text-muted-foreground">of {selectedTeam.bmCapacity} capacity</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg dark:bg-yellow-900/20 dark:border-yellow-800">
                  <div className="text-sm font-medium text-[#FFC857]">BM Utilization</div>
                  <div className={`text-2xl font-bold ${selectedTeam.bmUtilization >= 90 ? "text-[#F56565]" : selectedTeam.bmUtilization >= 70 ? "text-[#FFC857]" : "text-[#34D197]"}`}>
                    {selectedTeam.bmUtilization}%
                  </div>
                  <div className="text-xs text-muted-foreground">capacity used</div>
                </div>
                <div className="bg-gradient-to-r from-[#ffb4a0]/10 to-[#b4a0ff]/10 border border-[#ffb4a0]/20 p-3 rounded-lg">
                  <div className="text-sm font-medium text-[#ffb4a0]">Ad Accounts</div>
                  <div className="text-2xl font-bold">{selectedTeam.adAccountsCount}</div>
                  <div className="text-xs text-muted-foreground">total managed</div>
                </div>
              </div>
              
              {/* Profiles List */}
              <div>
                <h4 className="font-medium mb-2">Team Profiles</h4>
                <div className="space-y-2">
                  {selectedTeam.profiles.map((profile: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">{profile.name}</div>
                        <div className="text-sm text-gray-500">
                          {profile.teamInfo.role} • Instance {profile.teamInfo.instance}
                        </div>
                      </div>
                      <Badge variant={profile.status === 'active' ? 'default' : 'secondary'}>
                        {profile.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Business Managers */}
              <div>
                <h4 className="font-medium mb-2">Business Managers</h4>
                <div className="space-y-2">
                  {selectedTeam.businessManagers.map((bm: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">{bm.name}</div>
                        <div className="text-sm text-gray-500 font-mono">{bm.dolphin_id}</div>
                      </div>
                      <Badge variant="outline">
                        {bm.adAccounts?.length || 0} ad accounts
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}