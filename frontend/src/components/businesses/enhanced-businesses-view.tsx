"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs"
import { Card, CardContent } from "../ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Checkbox } from "../ui/checkbox"
import { StatusBadge } from "../ui/status-badge"
import { StatusDot } from "../ui/status-dot"
import { Badge } from "../ui/badge"
import { 
  Search, 
  PlusCircle, 
  Building2, 
  ExternalLink, 
  MoreHorizontal,
  Eye,
  Settings,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { CreateBusinessDialog } from "./create-business-dialog"
import { useRouter } from "next/navigation"
import { gradients } from "../../lib/design-system"
import { businessStore, type Business } from "../../lib/business-store"
import { useToast } from "../../hooks/use-toast"

interface AdAccountSummary {
  total: number
  active: number
  pending: number
  totalSpend: number
  monthlySpend: number
}

interface BusinessWithSummary {
  id: string
  name: string
  businessId: string
  status: "active" | "pending" | "suspended" | "inactive"
  landingPage?: string
  dateCreated: string
  verification: "verified" | "not_verified" | "pending"
  adAccounts: AdAccountSummary
}

export function EnhancedBusinessesView() {
  const router = useRouter()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBusinesses, setSelectedBusinesses] = useState<string[]>([])
  const [currentTab, setCurrentTab] = useState("all")
  const [businesses, setBusinesses] = useState<BusinessWithSummary[]>([])
  const [loading, setLoading] = useState(true)

  // Load businesses from unified store
  const loadBusinesses = useCallback(async () => {
    try {
      setLoading(true)
      const businessData = await businessStore.getBusinesses()
      
      // Transform businesses to match our interface
      const transformedBusinesses: BusinessWithSummary[] = businessData.map((business: Business) => ({
        id: business.id,
        name: business.name,
        businessId: business.businessId,
        status: business.status,
        landingPage: business.landingPage,
        dateCreated: business.dateCreated,
        verification: business.verification,
        adAccounts: {
          total: business.adAccounts.length,
          active: business.adAccounts.filter(acc => acc.status === 'active').length,
          pending: business.adAccounts.filter(acc => acc.status === 'pending').length,
          totalSpend: business.adAccounts.reduce((sum, acc) => sum + acc.spent, 0),
          monthlySpend: business.adAccounts.reduce((sum, acc) => sum + (acc.spent * 0.3), 0) // Mock monthly calculation
        }
      }))
      
      setBusinesses(transformedBusinesses)
    } catch (error) {
      console.error("Failed to load businesses:", error)
      toast({
        title: "Error",
        description: "Failed to load businesses. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Load businesses on component mount
  useEffect(() => {
    loadBusinesses()
  }, [loadBusinesses])

  // Listen for business approval events
  useEffect(() => {
    const handleBusinessApproved = () => {
      loadBusinesses() // Refresh the list when a business is approved
    }

    const handleAdAccountActivated = () => {
      loadBusinesses() // Refresh the list when an ad account is activated
    }

    window.addEventListener('businessApproved', handleBusinessApproved)
    window.addEventListener('adAccountActivated', handleAdAccountActivated)

    return () => {
      window.removeEventListener('businessApproved', handleBusinessApproved)
      window.removeEventListener('adAccountActivated', handleAdAccountActivated)
    }
  }, [loadBusinesses])

  // Filter businesses based on search
  const filteredBusinesses = businesses.filter((business) =>
    business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    business.businessId.includes(searchQuery) ||
    business.landingPage?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculate summary metrics
  const totalBusinesses = filteredBusinesses.length
  const activeBusinesses = filteredBusinesses.filter(b => b.status === 'active').length
  const pendingBusinesses = filteredBusinesses.filter(b => b.status === 'pending').length
  const totalAdAccounts = filteredBusinesses.reduce((sum, b) => sum + b.adAccounts.total, 0)
  const totalSpend = filteredBusinesses.reduce((sum, b) => sum + b.adAccounts.totalSpend, 0)
  const monthlySpend = filteredBusinesses.reduce((sum, b) => sum + b.adAccounts.monthlySpend, 0)

  const handleSelectBusiness = (businessId: string, checked: boolean) => {
    if (checked) {
      setSelectedBusinesses([...selectedBusinesses, businessId])
    } else {
      setSelectedBusinesses(selectedBusinesses.filter((id) => id !== businessId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBusinesses(filteredBusinesses.map((business) => business.id))
    } else {
      setSelectedBusinesses([])
    }
  }

  const handleViewAccounts = (businessId: string) => {
    router.push(`/dashboard/businesses/${businessId}`)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "suspended":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex flex-col space-y-1">
          <h1 className="text-2xl font-medium">Businesses</h1>
          <p className="text-xs text-[#888888]">Loading businesses...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b4a0ff]"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header - following accounts management pattern */}
      <div className="flex flex-col space-y-1">
        <h1 className="text-2xl font-medium">Businesses</h1>
        <p className="text-xs text-[#888888]">Manage your Facebook Business Managers and associated ad accounts</p>
      </div>

      {/* Tabs and Create Button - following accounts management pattern */}
      <Tabs defaultValue="all" className="w-full" onValueChange={setCurrentTab}>
        <div className="flex justify-between items-center border-b border-[#222222]">
          <TabsList className="bg-transparent">
            <TabsTrigger
              value="all"
              className="data-[state=active]:border-b-2 data-[state=active]:border-[#b4a0ff] data-[state=active]:text-white rounded-none px-3 py-1 text-xs"
            >
              Summary
            </TabsTrigger>
            <TabsTrigger
              value="accounts"
              className="data-[state=active]:border-b-2 data-[state=active]:border-[#b4a0ff] data-[state=active]:text-white rounded-none px-3 py-1 text-xs"
            >
              Ad Accounts
            </TabsTrigger>
          </TabsList>

          <CreateBusinessDialog
            trigger={
              <Button className={`${gradients.primary} text-primary-foreground hover:opacity-90 h-8 text-xs`}>
                <PlusCircle className="h-3 w-3 mr-1" />
                Create Business
              </Button>
            }
            onBusinessCreated={loadBusinesses}
          />
        </div>

        {/* Metrics Cards - following accounts management pattern */}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className={`${gradients.cardGradient} border border-border`}>
            <CardContent className="p-3">
              <div className="flex flex-col">
                <span className="text-xs text-[#888888]">Businesses</span>
                <span className="text-sm font-medium">{totalBusinesses}</span>
                <span className="text-xs text-[#888888] mt-1">Total ad accounts</span>
                <span className="text-sm font-medium">{totalAdAccounts}</span>
              </div>
            </CardContent>
          </Card>

          <Card className={`${gradients.cardGradient} border border-border`}>
            <CardContent className="p-3">
              <div className="flex flex-col">
                <span className="text-xs text-[#888888]">Active businesses</span>
                <span className="text-sm font-medium">{activeBusinesses}</span>
                <span className="text-xs text-[#888888] mt-1">Monthly spend</span>
                <span className="text-sm font-medium">${monthlySpend.toLocaleString()} USD</span>
              </div>
            </CardContent>
          </Card>

          <Card className={`${gradients.cardGradient} border border-border`}>
            <CardContent className="p-3">
              <div className="flex flex-col">
                <span className="text-xs text-[#888888]">Pending approval</span>
                <span className="text-sm font-medium">{pendingBusinesses}</span>
                <span className="text-xs text-[#888888] mt-1">Total spend</span>
                <span className="text-sm font-medium">${totalSpend.toLocaleString()} USD</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mt-3 relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search businesses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-8 text-xs"
          />
        </div>

        {/* Empty State */}
        {filteredBusinesses.length === 0 && searchQuery === "" ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3 mb-4">
              <Building2 className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No businesses yet</h3>
            <p className="text-muted-foreground mt-2 mb-6">
              Create your first Business Manager to start managing ad accounts.
            </p>
            <CreateBusinessDialog
              trigger={
                <Button className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-white border-0">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Business
                </Button>
              }
              onBusinessCreated={loadBusinesses}
            />
          </div>
        ) : (
          /* Businesses Table - following accounts management pattern */
          <div className="w-full overflow-auto bg-white dark:bg-transparent rounded-md border border-[#eaecf0] dark:border-[#222222] shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#eaecf0] dark:border-[#222222] bg-[#f9fafb] dark:bg-transparent">
                  <th className="px-4 py-3 text-left">
                    <Checkbox
                      checked={filteredBusinesses.length > 0 && selectedBusinesses.length === filteredBusinesses.length}
                      onCheckedChange={handleSelectAll}
                      className="rounded-sm data-[state=checked]:bg-[#6941c6] data-[state=checked]:border-[#6941c6] dark:data-[state=checked]:bg-[#b4a0ff] dark:data-[state=checked]:border-[#b4a0ff]"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#667085] dark:text-[#888888]">Business Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#667085] dark:text-[#888888]">Business ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#667085] dark:text-[#888888]">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#667085] dark:text-[#888888]">Ad Accounts</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#667085] dark:text-[#888888]">Monthly Spend</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#667085] dark:text-[#888888]">Landing Page</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#667085] dark:text-[#888888]">Created</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#667085] dark:text-[#888888]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBusinesses.map((business) => (
                  <tr key={business.id} className="border-b border-[#eaecf0] dark:border-[#222222] hover:bg-[#f9fafb] dark:hover:bg-[#1a1a1a] transition-colors">
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selectedBusinesses.includes(business.id)}
                        onCheckedChange={(checked) => handleSelectBusiness(business.id, !!checked)}
                        className="rounded-sm data-[state=checked]:bg-[#6941c6] data-[state=checked]:border-[#6941c6] dark:data-[state=checked]:bg-[#b4a0ff] dark:data-[state=checked]:border-[#b4a0ff]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-gradient-to-r from-[#b4a0ff]/10 to-[#ffb4a0]/10">
                          <Building2 className="h-3.5 w-3.5 text-[#b4a0ff]" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{business.name}</div>
                          <div className="flex items-center gap-1 mt-0.5">
                            {getStatusIcon(business.status)}
                            <Badge 
                              variant={business.verification === "verified" ? "default" : "secondary"}
                              className="text-xs h-4 px-1.5"
                            >
                              {business.verification === "verified" ? "Verified" : 
                               business.verification === "pending" ? "Verifying" : "Unverified"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-[#667085] dark:text-[#888888]">
                        {business.businessId}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StatusDot status={business.status} />
                        <StatusBadge status={business.status} size="sm" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{business.adAccounts.total}</span>
                        {business.adAccounts.total > 0 && (
                          <div className="text-xs text-[#667085] dark:text-[#888888]">
                            ({business.adAccounts.active} active, {business.adAccounts.pending} pending)
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">
                          ${business.adAccounts.monthlySpend.toLocaleString()}
                        </span>
                        {business.adAccounts.monthlySpend > 0 && (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {business.landingPage ? (
                        <div className="flex items-center gap-1 max-w-[200px]">
                          <span className="truncate text-xs text-[#667085] dark:text-[#888888]">
                            {business.landingPage}
                          </span>
                          <a 
                            href={business.landingPage} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[#667085] hover:text-foreground"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-xs text-[#667085] dark:text-[#888888]">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-[#667085] dark:text-[#888888]">
                        {business.dateCreated}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleViewAccounts(business.id)}
                          disabled={business.adAccounts.total === 0}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewAccounts(business.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Ad Accounts
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Settings className="h-4 w-4 mr-2" />
                              Manage Business
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Pages
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              Suspend Business
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Results Summary */}
        {filteredBusinesses.length > 0 && (
          <div className="text-xs text-[#888888]">
            Showing {filteredBusinesses.length} of {businesses.length} businesses
          </div>
        )}
      </Tabs>
    </div>
  )
} 