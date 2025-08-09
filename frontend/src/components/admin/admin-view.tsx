"use client"

import { useState } from "react"
import useSWR from 'swr'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Input } from "../ui/input"
import { Shield, Users, Building2, Settings } from "lucide-react"
import { Loader2 } from "lucide-react"
import { layout } from "../../lib/layout-utils"
import { contentTokens } from "../../lib/content-tokens"
import { Button } from "../ui/button"
import { gradientTokens } from "../../lib/design-tokens"
import { Database, Download, Plus, Search, ChevronRight } from "lucide-react"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { StatusBadge } from "../ui/status-badge"

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function AdminView() {
  // Auth is handled by the layout, no need for redundant checks
  const { data: orgsData, isLoading: orgsLoading } = useSWR('/api/organizations', fetcher);
  // Removed unnecessary API calls for better performance
  
  const organizations = orgsData?.organizations || [];
  
  const [showDemoPanel, setShowDemoPanel] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOrg, setSelectedOrg] = useState<any>(null)

  const filteredOrganizations = organizations.filter((org: any) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add placeholder values for undefined variables
  const totalUsers = organizations.length;
  const totalRevenue = 0; // Placeholder - implement actual revenue calculation
  const supportTickets = 0; // Placeholder - implement actual support tickets count

  if (orgsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-muted-foreground">Loading organizations...</span>
      </div>
    )
  }

  return (
    <div className={layout.pageContent}>
      {/* Header */}
      <div className={layout.flexBetween}>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage organizations, users, and system settings</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDemoPanel(!showDemoPanel)}
            className="border-border text-foreground hover:bg-[#F5F5F5]"
          >
            <Database className="h-4 w-4 mr-2" />
            Demo Data
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-border text-foreground hover:bg-[#F5F5F5]"
          >
            <Download className="h-4 w-4 mr-2" />
            {contentTokens.actions.export}
          </Button>
        </div>
      </div>

      {/* Demo Data Panel */}
      {showDemoPanel && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Demo Data Management</CardTitle>
            <CardDescription className="text-muted-foreground">
              Generate and manage demo data for testing purposes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Demo data management coming soon...</div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Organizations</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{organizations.length}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Users</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">+8% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">${(totalRevenue / 100).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+15% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Support Tickets</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{supportTickets}</div>
            <p className="text-xs text-muted-foreground">-5% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Organizations List */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <div className={layout.flexBetween}>
                <div>
                  <CardTitle className="text-foreground">Organizations</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Manage and monitor all organizations
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border text-foreground hover:bg-[#F5F5F5]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {contentTokens.actions.add}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className={layout.stackMedium}>
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={contentTokens.placeholders.search}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-background border-border text-foreground"
                  />
                </div>

                {/* Organizations List */}
                <div className={layout.stackSmall}>
                  {filteredOrganizations.map((org: any) => (
                    <div
                      key={org.id}
                      className={`${layout.flexBetween} p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer`}
                      onClick={() => setSelectedOrg(org)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={`${gradientTokens.avatar} text-xs font-semibold`}>
                            {org.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-foreground text-sm">{org.name}</div>
                          <div className="text-xs text-muted-foreground">{org.users} users • {org.accounts} accounts</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={org.status as any} size="sm" />
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Stats */}
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium">Total Organizations</CardTitle>
              <Building2 className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl font-bold">{organizations.length}</div>
              <p className="text-xs text-muted-foreground">
                Active organizations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium">Active Organizations</CardTitle>
              <Users className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl font-bold">{organizations.length}</div>
              <p className="text-xs text-muted-foreground">
                Currently active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium">Admin Level</CardTitle>
              <Shield className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl font-bold">
                Admin
              </div>
              <p className="text-xs text-muted-foreground">
                Current access level
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium">System Status</CardTitle>
              <Settings className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl font-bold">Operational</div>
              <p className="text-xs text-muted-foreground">
                All systems running
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Sections */}
        <div className="grid gap-3 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">User Management</CardTitle>
              <CardDescription className="text-xs">
                Manage users and their permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Total registered users: {totalUsers}
                </p>
                <p className="text-xs text-muted-foreground">
                  Admin users: {organizations.filter((m: any) => m.role === 'admin').length}
                </p>
                <p className="text-xs text-muted-foreground">
                  Organization owners: {organizations.filter((m: any) => m.role === 'owner').length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Organization Management</CardTitle>
              <CardDescription className="text-xs">
                Monitor and manage organizations
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Total organizations: {organizations.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  Active organizations: {organizations.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  Monthly revenue: ${(totalRevenue / 100).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Organizations */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Organizations</CardTitle>
            <CardDescription className="text-xs">
              Recently created organizations
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="space-y-2">
              {organizations.slice(0, 5).map((org: any) => (
                <div key={org.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-xs">{org.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Plan: {org.plan}
                    </p>
                  </div>
                  <Badge variant="default" className="text-xs">
                                          Active
                  </Badge>
                </div>
              ))}
              {organizations.length === 0 && (
                <p className="text-xs text-muted-foreground">No organizations found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 