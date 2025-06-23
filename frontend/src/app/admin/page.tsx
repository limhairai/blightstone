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
import { useAppData } from "../../contexts/AppDataContext"
import { OnboardingAdminPanel } from "../../components/admin/onboarding-admin-panel"

export default function AdminDashboard() {
  const { state } = useAppData()
  
  // Use real admin data from context
  const dashboardStats = state.adminData.systemStats

  const quickActions = [
    {
      title: "Review Applications",
      description: "8 applications pending review",
      icon: FileText,
      href: "/admin/applications"
    },
    {
      title: "Manage Teams",
      description: "View and configure teams",
      icon: Users,
      href: "/admin/teams"
    },
    {
      title: "System Analytics",
      description: "View platform metrics",
      icon: BarChart3,
      href: "/admin/analytics"
    },
    {
      title: "Access Codes",
      description: "Manage system access",
      icon: Shield,
      href: "/admin/access-codes"
    }
  ]

  const recentActivity = [
    {
      type: "application",
      message: "New application from TechCorp Solutions",
      time: "2 hours ago",
      status: "pending"
    },
    {
      type: "topup",
      message: "Wallet top-up completed for Digital Pro Agency",
      time: "4 hours ago",
      status: "completed"
    },
    {
      type: "team",
      message: "Team Alpha reached capacity",
      time: "6 hours ago",
      status: "active"
    },
    {
      type: "asset",
      message: "New Business Manager connected",
      time: "1 day ago",
      status: "completed"
    }
  ]

  return (
    <div className="space-y-6">
      {/* System Status Bar */}
      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium text-green-800">System Status: Operational</span>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Organizations
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{dashboardStats.totalOrganizations}</div>
            <p className="text-xs text-muted-foreground">+3 this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Teams
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{dashboardStats.activeTeams}</div>
            <p className="text-xs text-muted-foreground">+2 this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Pending Applications
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-orange-600">{dashboardStats.pendingApplications}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">${dashboardStats.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+15% from last month</p>
          </CardContent>
        </Card>
      </div>

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
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
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
                  <div>
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
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Onboarding Admin Panel for testing */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Onboarding Management</h3>
        <OnboardingAdminPanel />
      </div>
    </div>
  )
}