"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusDot } from "@/components/ui/status-dot"
import { 
  Building2, 
  ExternalLink, 
  Settings, 
  Eye, 
  Plus, 
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  Copy,
  Edit,
  ArrowRight
} from "lucide-react"
import { useRouter } from "next/navigation"
import { layout } from "@/lib/layout-utils"
import { contentTokens } from "@/lib/content-tokens"
import { useToast } from "@/hooks/use-toast"

interface AdAccountSummary {
  total: number
  active: number
  pending: number
  totalSpend: number
  monthlySpend: number
}

interface Business {
  id: string
  name: string
  businessId: string
  status: "active" | "pending" | "suspended" | "inactive"
  landingPage?: string
  dateCreated: string
  verification: "verified" | "not_verified" | "pending"
  adAccounts: AdAccountSummary
  bmId?: string
  accountsCount: number
  totalBalance: number
  industry: string
  logo?: string
}

interface EnhancedBusinessCardProps {
  business: Business
  onViewAccounts?: (businessId: string) => void
  onManageBusiness?: (businessId: string) => void
  onEdit?: (business: Business) => void
}

export function EnhancedBusinessCard({ 
  business, 
  onViewAccounts, 
  onManageBusiness,
  onEdit
}: EnhancedBusinessCardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isHovered, setIsHovered] = useState(false)

  const handleViewAccounts = () => {
    if (onViewAccounts) {
      onViewAccounts(business.id)
    } else {
      router.push(`/dashboard/wallet/business/${business.id}`)
    }
  }

  const handleManageBusiness = () => {
    if (onManageBusiness) {
      onManageBusiness(business.id)
    } else {
      // Open business settings modal or navigate to settings
      console.log('Manage business:', business.id)
    }
  }

  const canCreateAdAccounts = business.status === "active" && business.verification === "verified"

  const getStatusIcon = () => {
    switch (business.status) {
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

  const getStatusMessage = () => {
    if (business.status === "pending") {
      return "Waiting for admin approval"
    }
    if (business.verification === "pending") {
      return "Verification in progress"
    }
    if (business.status === "suspended") {
      return "Business suspended - contact support"
    }
    return null
  }

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString()}`
  }

  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-md border-border ${
        isHovered ? 'border-[#b4a0ff]/50' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-3">
        <div className={layout.flexBetween}>
          <div className="flex items-center gap-3">
            {business.logo ? (
              <div className="h-12 w-12 rounded-lg overflow-hidden">
                <img
                  src={business.logo || "/placeholder.svg"}
                  alt={business.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#c4b5fd] to-[#ffc4b5] flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {business.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-foreground">{business.name}</h3>
              <p className="text-sm text-muted-foreground">{business.industry}</p>
            </div>
          </div>
          <StatusDot status={business.status} />
        </div>
      </CardHeader>

      <CardContent className={layout.cardContent}>
        {business.bmId && (
          <div className="flex items-center gap-2 p-2 bg-muted/40 rounded-md">
            <span className="text-xs text-muted-foreground">BM ID:</span>
            <code className="text-xs font-mono text-foreground">{business.bmId}</code>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                navigator.clipboard.writeText(business.bmId!)
                toast({
                  title: contentTokens.success.copied,
                  description: "Business Manager ID copied to clipboard",
                })
              }}
              className="h-6 w-6 p-0 hover:bg-accent"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted/30 rounded-md">
            <div className="text-xs text-muted-foreground mb-1">Ad Accounts</div>
            <div className="text-xl font-bold text-foreground">{business.accountsCount}</div>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-md">
            <div className="text-xs text-muted-foreground mb-1">Total Balance</div>
            <div className="text-xl font-bold text-foreground">${formatCurrency(business.totalBalance)}</div>
          </div>
        </div>

        <div className={layout.flexBetween}>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onEdit?.(business)
            }}
            className="border-border text-foreground hover:bg-accent"
          >
            <Edit className="h-4 w-4 mr-2" />
            {contentTokens.actions.edit}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onViewAccounts?.(business.id)
            }}
            className="border-border text-foreground hover:bg-accent"
          >
            {contentTokens.actions.view} Accounts
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 