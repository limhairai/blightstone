"use client"

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { useState, useMemo, useEffect } from "react"
import { useAuth } from "../../../../contexts/AuthContext"
import { toast } from "sonner"
import { Button } from "../../../../components/ui/button"
import { Input } from "../../../../components/ui/input"
import { Badge } from "../../../../components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { Search, ArrowLeft } from "lucide-react"

interface ApplicationHistory {
  id: string
  organizationName: string
  businessName: string
  applicationType: "new_business" | "additional_business"
  accountsRequested: number
  status: "fulfilled" | "rejected"
  teamName: string
  processedAt: string
  completedAt?: string
}

export default function ApplicationHistoryPage() {
  const { session } = useAuth()
  const [applications, setApplications] = useState<ApplicationHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Fetch applications history
  useEffect(() => {
    const fetchApplicationsHistory = async () => {
      if (!session?.access_token) return

      try {
        const response = await fetch('/api/admin/applications?status=fulfilled,rejected', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
        
        if (!response.ok) {
          throw new Error('Failed to fetch applications history')
        }
        
        const data = await response.json()
// console.log('Applications API response:', data)
        // Ensure data is an array before mapping
        const applications = Array.isArray(data) ? data : (data.applications || [])
// console.log('Applications array:', applications)
        
        // Check if applications is actually an array
        if (!Array.isArray(applications)) {
          console.error('Applications is not an array:', applications)
          setApplications([])
          return
        }
        
        // Transform the data to match the history format
        const historyData = applications.map((app: any) => ({
          id: app.applicationId || app.application_id,
          organizationName: app.organizationName || app.organization_name,
          businessName: app.businessName || app.organizationName || app.organization_name,
          applicationType: (app.requestType === "new_business_manager" ? "new_business" : "additional_business") as "new_business" | "additional_business",
          accountsRequested: 1, // Default for now
          status: app.status as "fulfilled" | "rejected",
          teamName: "Team Alpha", // Default for now
          processedAt: app.createdAt || app.created_at,
          completedAt: app.fulfilledAt || app.rejectedAt || app.approved_at || app.rejected_at || app.fulfilled_at
        }))
        setApplications(historyData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load applications history')
        toast.error('Failed to load applications history')
      } finally {
        setLoading(false)
      }
    }

    fetchApplicationsHistory()
  }, [session])

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch = searchTerm === "" || 
        app.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.teamName.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesSearch
    })
  }, [applications, searchTerm])
  
  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading applications history...</div>
  }
  
  if (error) {
    return <div className="flex items-center justify-center p-8 text-red-500">Error: {error}</div>
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "fulfilled":
        return "bg-[#34D197]/10 text-[#34D197] border-[#34D197]/20"
      case "rejected":
        return "bg-[#F56565]/10 text-[#F56565] border-[#F56565]/20"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Applications
        </Button>
        <div className="text-lg font-semibold">Applications History</div>
      </div>
      
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search application history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-[300px]"
            />
          </div>
          
          <div className="text-sm text-muted-foreground">
            {filteredApplications.length} of {applications.length} applications shown
          </div>
        </div>
        
        <Button variant="outline" size="sm">
          Export Report
        </Button>
      </div>
      
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium text-muted-foreground">Organization</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
              <th className="text-center p-4 font-medium text-muted-foreground">Accounts</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Team</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Processed</th>
            </tr>
          </thead>
          <tbody>
            {filteredApplications.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground">
                  No applications found.
                </td>
              </tr>
            ) : (
              filteredApplications.map((app) => (
                <tr key={app.id} className="border-t border-border hover:bg-muted/30">
                  <td className="p-4">
                    <div>
                      <div className="font-medium">{app.organizationName}</div>
                      <div className="text-sm text-muted-foreground">{app.businessName}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge
                      variant={app.applicationType === "new_business" ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {app.applicationType === "new_business" ? "New" : "Additional"}
                    </Badge>
                  </td>
                  <td className="p-4 text-center">{app.accountsRequested}</td>
                  <td className="p-4">
                    <Badge className={`capitalize ${getStatusColor(app.status)}`}>
                      {app.status}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Badge variant="outline">
                      {app.teamName}
                    </Badge>
                  </td>
                  <td className="p-4">
                    {formatDistanceToNow(new Date(app.processedAt), { addSuffix: true })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
} 