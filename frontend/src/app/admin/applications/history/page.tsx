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
import { Search, ArrowLeft, Building2, Plus, Globe } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table"

interface ApplicationHistory {
  id: string
  organizationName: string
  businessName: string
  applicationType: "new_business_manager" | "additional_accounts" | "pixel_connection"
  requestType: string
  accountsRequested: number
  status: "fulfilled" | "rejected"
  teamName: string
  processedAt: string
  completedAt?: string
  websiteUrl?: string
  domains?: string[]
  pixelId?: string
  pixelName?: string
  targetBmDolphinId?: string
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
          applicationType: app.requestType as "new_business_manager" | "additional_accounts" | "pixel_connection",
          requestType: app.requestType,
          accountsRequested: 1, // Default for now
          status: app.status as "fulfilled" | "rejected",
          teamName: "Team Alpha", // Default for now
          processedAt: app.createdAt || app.created_at,
          completedAt: app.fulfilledAt || app.rejectedAt || app.approved_at || app.rejected_at || app.fulfilled_at,
          websiteUrl: app.websiteUrl,
          domains: app.domains,
          pixelId: app.pixelId,
          pixelName: app.pixelName,
          targetBmDolphinId: app.targetBmDolphinId
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
    return <div className="flex items-center justify-center p-8 text-muted-foreground">Error: {error}</div>
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

  const getRequestTypeInfo = (app: ApplicationHistory) => {
    switch (app.applicationType) {
      case 'new_business_manager':
        return { icon: <Building2 className="h-4 w-4" />, label: "New Business Manager", variant: "outline" as const };
      case 'additional_accounts':
        if (app.targetBmDolphinId) {
          return { icon: <Plus className="h-4 w-4" />, label: "Additional Accounts (Specific BM)", variant: "outline" as const };
        } else {
          return { icon: <Plus className="h-4 w-4" />, label: "Additional Accounts (Choose BM)", variant: "outline" as const };
        }
      case 'pixel_connection':
        return { icon: <Globe className="h-4 w-4" />, label: "Pixel Connection", variant: "outline" as const };
      default:
        return { icon: <Building2 className="h-4 w-4" />, label: "Unknown Request", variant: "outline" as const };
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
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-muted/50">
              <TableHead className="text-muted-foreground">Organization</TableHead>
              <TableHead className="text-muted-foreground">Request Type</TableHead>
              <TableHead className="text-muted-foreground">Details</TableHead>
              <TableHead className="text-muted-foreground">Applied</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Processed By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApplications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No applications found.
                </TableCell>
              </TableRow>
            ) : (
              filteredApplications.map((app) => {
                const requestTypeInfo = getRequestTypeInfo(app);
                return (
                  <TableRow key={app.id} className="border-border hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          {requestTypeInfo.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{app.organizationName}</div>
                          <div className="text-sm text-muted-foreground truncate">{app.businessName}</div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant={requestTypeInfo.variant} className="flex items-center gap-1">
                        {requestTypeInfo.icon}
                        {requestTypeInfo.label}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1 max-w-xs">
                        {app.requestType === 'pixel_connection' ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs text-foreground">
                              <Globe className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span className="font-medium truncate">
                                {app.pixelName || `Pixel ${app.pixelId}`}
                              </span>
                            </div>
                            {app.targetBmDolphinId && (
                              <div className="text-xs text-muted-foreground">
                                → BM: {app.targetBmDolphinId}
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                            {app.domains && app.domains.length > 0 ? (
                              <>
                                {app.domains.map((domain, index) => (
                                  <div key={index} className="flex items-center gap-1 text-xs text-foreground">
                                    <Globe className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                    <span className="truncate">{domain}</span>
                                  </div>
                                ))}
                              </>
                            ) : (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Globe className="h-3 w-3" />
                                <span className="truncate">{app.websiteUrl || 'No website specified'}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">{formatDistanceToNow(new Date(app.processedAt), { addSuffix: true })}</div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={`capitalize ${getStatusColor(app.status)}`}>
                        {app.status}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="outline">
                        {app.teamName}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 