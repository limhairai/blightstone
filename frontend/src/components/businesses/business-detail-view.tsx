"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Card, CardContent, CardHeader } from "../ui/card"
import { Badge } from "../ui/badge"
import { StatusBadge } from "../ui/status-badge"
import { StatusDot } from "../ui/status-dot"
import { 
  ArrowLeft,
  Search, 
  PlusCircle, 
  Building2, 
  ExternalLink, 
  MoreHorizontal,
  Settings,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Globe,
  Calendar,
  DollarSign
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { gradients } from "../../lib/design-system"
import { CreateAdAccountDialog } from "../accounts/create-ad-account-dialog"
import { businessStore, type Business, type AdAccount } from "../../lib/business-store"
import { useToast } from "../../hooks/use-toast"

interface BusinessDetailViewProps {
  businessId: string
}

export function BusinessDetailView({ businessId }: BusinessDetailViewProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Load business data from unified store
  const loadBusiness = useCallback(async () => {
    try {
      setLoading(true)
      const businessData = await businessStore.getBusiness(businessId)
      
      if (!businessData) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setBusiness(businessData)
    } catch (error) {
      console.error("Failed to load business:", error)
      toast({
        title: "Error",
        description: "Failed to load business data. Please try again.",
        variant: "destructive",
      })
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [businessId, toast])

  // Load business on component mount
  useEffect(() => {
    loadBusiness()
  }, [businessId, loadBusiness])

  // Listen for ad account activation events
  useEffect(() => {
    const handleAdAccountActivated = (event: CustomEvent) => {
      if (event.detail.businessId === businessId) {
        loadBusiness() // Refresh the business data when an ad account is activated
      }
    }

    window.addEventListener('adAccountActivated', handleAdAccountActivated as EventListener)

    return () => {
      window.removeEventListener('adAccountActivated', handleAdAccountActivated as EventListener)
    }
  }, [businessId, loadBusiness])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/businesses')}
            className="h-8 px-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Businesses
          </Button>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b4a0ff]"></div>
        </div>
      </div>
    )
  }

  if (notFound || !business) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/businesses')}
            className="h-8 px-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Businesses
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <Building2 className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Business not found</h3>
          <p className="text-muted-foreground mt-2">
            The business you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
        </div>
      </div>
    )
  }

  // Filter ad accounts based on search
  const filteredAccounts = business.adAccounts.filter((account) =>
    account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.accountId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.platform.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculate metrics
  const totalBalance = business.adAccounts.reduce((sum, acc) => sum + acc.balance, 0)
  const totalSpent = business.adAccounts.reduce((sum, acc) => sum + acc.spent, 0)
  const activeAccounts = business.adAccounts.filter(acc => acc.status === 'active').length
  const pendingAccounts = business.adAccounts.filter(acc => acc.status === 'pending').length

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "paused":
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const canCreateAdAccounts = business.status === "active" && business.verification === "verified"

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/businesses')}
          className="h-8 px-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Businesses
        </Button>
      </div>

      {/* Business Header Card */}
      <Card className={`${gradients.cardGradient} border border-border`}>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-gradient-to-r from-[#b4a0ff]/10 to-[#ffb4a0]/10">
                <Building2 className="h-8 w-8 text-[#b4a0ff]" />
              </div>
              <div>
                <h1 className="text-2xl font-medium">{business.name}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-muted-foreground font-mono">
                    Business ID: {business.businessId}
                  </span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(business.status)}
                    <StatusBadge status={business.status} size="sm" />
                  </div>
                  <Badge 
                    variant={business.verification === "verified" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {business.verification === "verified" ? "✓ Verified" : 
                     business.verification === "pending" ? "⏳ Verifying" : "Unverified"}
                  </Badge>
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Business Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Globe className="h-4 w-4 mr-2" />
                  View Pages
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  Suspend Business
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Business Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe className="h-4 w-4" />
                Website
              </div>
              {business.website ? (
                <div className="flex items-center gap-1">
                  <span className="text-sm">{business.website}</span>
                  <a 
                    href={business.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Not provided</span>
              )}
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Created
              </div>
              <span className="text-sm">{business.dateCreated}</span>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                Industry
              </div>
              <span className="text-sm">{business.businessType || "Not specified"}</span>
            </div>
          </div>
          
          {business.description && (
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Description</div>
              <p className="text-sm">{business.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ad Accounts Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-medium">Ad Accounts</h2>
            <p className="text-xs text-[#888888]">Manage advertising accounts for this business</p>
          </div>
          {canCreateAdAccounts && (
            <CreateAdAccountDialog
              businessId={business.id}
              trigger={
                <Button className={`${gradients.primary} text-primary-foreground hover:opacity-90 h-8 text-xs`}>
                  <PlusCircle className="h-3 w-3 mr-1" />
                  Create Ad Account
                </Button>
              }
              onAccountCreated={loadBusiness}
            />
          )}
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card className={`${gradients.cardGradient} border border-border`}>
            <CardContent className="p-3">
              <div className="flex flex-col">
                <span className="text-xs text-[#888888]">Total accounts</span>
                <span className="text-sm font-medium">{business.adAccounts.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card className={`${gradients.cardGradient} border border-border`}>
            <CardContent className="p-3">
              <div className="flex flex-col">
                <span className="text-xs text-[#888888]">Active accounts</span>
                <span className="text-sm font-medium text-green-600">{activeAccounts}</span>
              </div>
            </CardContent>
          </Card>

          <Card className={`${gradients.cardGradient} border border-border`}>
            <CardContent className="p-3">
              <div className="flex flex-col">
                <span className="text-xs text-[#888888]">Total balance</span>
                <span className="text-sm font-medium">${totalBalance.toLocaleString()} USD</span>
              </div>
            </CardContent>
          </Card>

          <Card className={`${gradients.cardGradient} border border-border`}>
            <CardContent className="p-3">
              <div className="flex flex-col">
                <span className="text-xs text-[#888888]">Total spent</span>
                <span className="text-sm font-medium">${totalSpent.toLocaleString()} USD</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search ad accounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-8 text-xs"
          />
        </div>

        {/* Ad Accounts Table */}
        {filteredAccounts.length === 0 && business.adAccounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-lg">
            <div className="rounded-full bg-muted p-3 mb-4">
              <DollarSign className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No ad accounts yet</h3>
            <p className="text-muted-foreground mt-2 mb-6">
              {canCreateAdAccounts 
                ? "Create your first ad account to start advertising." 
                : "Business must be approved before creating ad accounts."
              }
            </p>
            {canCreateAdAccounts && (
              <CreateAdAccountDialog
                businessId={business.id}
                trigger={
                  <Button className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-white border-0">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Ad Account
                  </Button>
                }
                onAccountCreated={loadBusiness}
              />
            )}
          </div>
        ) : (
          <div className="w-full overflow-auto bg-white dark:bg-transparent rounded-md border border-[#eaecf0] dark:border-[#222222] shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#eaecf0] dark:border-[#222222] bg-[#f9fafb] dark:bg-transparent">
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#667085] dark:text-[#888888]">Account Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#667085] dark:text-[#888888]">Account ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#667085] dark:text-[#888888]">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#667085] dark:text-[#888888]">Balance</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#667085] dark:text-[#888888]">Spent</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#667085] dark:text-[#888888]">Limit</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#667085] dark:text-[#888888]">Last Activity</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#667085] dark:text-[#888888]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((account) => (
                  <tr key={account.id} className="border-b border-[#eaecf0] dark:border-[#222222] hover:bg-[#f9fafb] dark:hover:bg-[#1a1a1a] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-gradient-to-r from-[#b4a0ff]/10 to-[#ffb4a0]/10">
                          <DollarSign className="h-3.5 w-3.5 text-[#b4a0ff]" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{account.name}</div>
                          <div className="text-xs text-[#667085] dark:text-[#888888]">
                            Created {account.dateCreated} • Meta
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-[#667085] dark:text-[#888888]">
                        {account.accountId}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StatusDot status={account.status} />
                        <StatusBadge status={account.status} size="sm" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium">
                        ${account.balance.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">
                          ${account.spent.toLocaleString()}
                        </span>
                        {account.spent > 0 && (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm">
                        ${account.spendLimit.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-[#667085] dark:text-[#888888]">
                        {account.lastActivity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Settings className="h-4 w-4 mr-2" />
                            Manage Account
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <DollarSign className="h-4 w-4 mr-2" />
                            Top Up Balance
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <TrendingUp className="h-4 w-4 mr-2" />
                            View Analytics
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            Pause Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Results Summary */}
        {filteredAccounts.length > 0 && (
          <div className="text-xs text-[#888888]">
            Showing {filteredAccounts.length} of {business.adAccounts.length} ad accounts
          </div>
        )}
      </div>
    </div>
  )
} 