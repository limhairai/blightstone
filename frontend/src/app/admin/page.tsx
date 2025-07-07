"use client"

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { 
  CheckCircle, 
  RefreshCw, 
  Building2, 
  Users, 
  FileText, 
  TrendingUp, 
  ArrowRight, 
  Clock, 
  CreditCard, 
  Database,
  Plus,
  Settings,
  BarChart3,
  Shield
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"

export default function AdminDashboard() {
  const { session } = useAuth()
  const [applications, setApplications] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch real data with optimized parallel requests
  useEffect(() => {
    const fetchData = async () => {
      try {
        const activities: any[] = []

        // Fetch ALL data in parallel for better performance
        const [applicationsResponse, topupResponse] = await Promise.all([
          fetch('/api/admin/applications?status=pending,processing'),
          fetch('/api/topup-requests', {
            headers: {
              'Authorization': `Bearer ${session?.access_token}`
            }
          }).catch(() => null) // Handle auth errors gracefully
        ])

        // Process applications
        if (applicationsResponse.ok) {
          const applicationsData = await applicationsResponse.json()
          const applicationsList = applicationsData.applications || []
          setApplications(applicationsList)

          // Add recent business applications
          applicationsList
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 3)
            .forEach((application: any) => {
              activities.push({
                type: "application",
                message: `New application for ${application.websiteUrl}`,
                time: formatTimeAgo(application.createdAt),
                status: application.status || "pending"
              })
            })
        } else {
          console.error('Failed to fetch applications:', applicationsResponse.statusText)
        }

        // Process topup requests
        if (topupResponse && topupResponse.ok) {
          const topupData = await topupResponse.json()
          const topupRequests = Array.isArray(topupData) ? topupData : []

          // Add recent topup requests
          topupRequests
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 2)
            .forEach((request: any) => {
              activities.push({
                type: "topup",
                message: `Topup request: $${(request.amount_cents / 100).toFixed(2)} for ${request.ad_account_name}`,
                time: formatTimeAgo(request.created_at),
                status: request.status || "pending"
              })
            })
        } else if (topupResponse && (topupResponse.status === 401 || topupResponse.status === 403)) {
          // User doesn't have admin access - silently skip topup requests
        } else if (topupResponse) {
          console.error('Failed to fetch topup requests:', topupResponse.statusText)
        }

        // Sort all activities by time and take the most recent
        setRecentActivity(activities.slice(0, 4))

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchData()
    }
  }, [session])

  // Helper function to format time ago
  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60)
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else {
      const days = Math.floor(diffInMinutes / 1440)
      return `${days} day${days > 1 ? 's' : ''} ago`
    }
  }

  // Calculate stats from real data
  const dashboardStats = {
    totalOrganizations: 1, // For now
    activeTeams: 1,
    pendingApplications: applications.filter(a => a.status === 'pending').length,
    monthlyRevenue: 0 // Placeholder
  }
  
  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading admin data...</div>
  }
  
  if (error) {
    return <div className="flex items-center justify-center p-8 text-red-500">Error: {error}</div>
  }

  const quickActions = [
    {
      title: "Review Applications",
      description: `${dashboardStats.pendingApplications} applications pending review`,
      icon: FileText,
      href: "/admin/applications"
    },
    {
      title: "Top Up Requests",
      description: "Manage funding requests",
      icon: CreditCard,
      href: "/admin/transactions/topups"
    },
    {
      title: "Business Analytics",
      description: "View platform metrics",
      icon: BarChart3,
      href: "/admin/analytics"
    },
    {
      title: "Manage Organizations",
      description: "View and manage organizations",
      icon: Building2,
      href: "/admin/organizations"
    }
  ]



  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <Link key={index} href={action.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {action.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                    <div className="flex items-center justify-end mt-2">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => {
                  // Determine the navigation URL based on activity type
                  const getActivityUrl = (activityType: string) => {
                    switch (activityType) {
                      case "application":
                        return "/admin/applications"
                      case "topup":
                        return "/admin/transactions/topups"
                      case "team":
                        return "/admin/teams"
                      case "asset":
                        return "/admin/assets"
                      default:
                        return "/admin"
                    }
                  }

                  return (
                    <Link key={index} href={getActivityUrl(activity.type)}>
                      <div className="flex items-center justify-between py-2 border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer rounded-sm px-2 -mx-2">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {activity.type === "application" && <FileText className="h-4 w-4 text-blue-500" />}
                            {activity.type === "topup" && <CreditCard className="h-4 w-4 text-green-500" />}
                            {activity.type === "team" && <Users className="h-4 w-4 text-purple-500" />}
                            {activity.type === "asset" && <Database className="h-4 w-4 text-orange-500" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{activity.message}</p>
                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {activity.status === "pending" && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Pending
                            </Badge>
                          )}
                          {activity.status === "completed" && (
                            <Badge variant="default" className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Completed
                            </Badge>
                          )}
                          {activity.status === "active" && (
                            <Badge variant="default" className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Active
                            </Badge>
                          )}
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </Link>
                  )
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}