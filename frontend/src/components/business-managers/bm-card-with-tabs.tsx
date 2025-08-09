'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { BmDomainsTab } from './bm-domains-tab'
import { 
  Building2, 
  Globe, 
  CreditCard, 
  ArrowRight, 
  Copy, 
  MoreHorizontal,
  Power,
  PowerOff
} from 'lucide-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { BusinessManager } from '@/types/business'

interface BmCardWithTabsProps {
  manager: BusinessManager
  onDeactivationClick?: (manager: BusinessManager, e: React.MouseEvent) => void
  getActionButtons?: (manager: BusinessManager) => React.ReactNode
}

export function BmCardWithTabs({ 
  manager, 
  onDeactivationClick, 
  getActionButtons 
}: BmCardWithTabsProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const router = useRouter()

  const getManagerInitial = (name: string) => {
    return name.charAt(0).toUpperCase()
  }

  const handleManagerClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement
    if (
      target.closest("button") ||
      target.closest('[role="dialog"]') ||
      target.closest("a") ||
      target.closest(".dropdown-trigger") ||
      target.closest('[role="tab"]') ||
      target.closest('[role="tablist"]')
    ) {
      return
    }

    // Only navigate if active and has ID
    if (manager.status === "active" && manager.id) {
      router.push(`/dashboard/accounts?bm_id=${encodeURIComponent(manager.id)}`)
    }
  }

  const copyBmId = (bmId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (bmId) {
      navigator.clipboard.writeText(bmId)
      toast.success('Business Manager ID copied to clipboard')
    }
  }

  const defaultActionButtons = (manager: BusinessManager) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 dropdown-trigger">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {manager.dolphin_business_manager_id && (
          <DropdownMenuItem onClick={(e) => copyBmId(manager.dolphin_business_manager_id!, e)}>
            <Copy className="h-4 w-4 mr-2" />
            Copy BM ID
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={(e) => onDeactivationClick?.(manager, e)}
          className="text-muted-foreground hover:text-muted-foreground"
        >
          {manager.is_active === false ? (
            <>
              <Power className="h-4 w-4 mr-2" />
              Activate
            </>
          ) : (
            <>
              <PowerOff className="h-4 w-4 mr-2" />
              Deactivate
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <Card
      onClick={handleManagerClick}
      className={cn(
        "transition-all duration-200 group",
        "hover:shadow-md hover:border-border/60 hover:bg-card/80",
        manager.status === "active" 
          ? "cursor-pointer hover:border-[#c4b5fd]/30" 
          : "cursor-default",
        manager.is_active === false && "opacity-50 grayscale"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#c4b5fd] to-[#ffc4b5] flex items-center justify-center">
              <span className="text-black font-semibold">{getManagerInitial(manager.name)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground truncate">{manager.name}</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                {manager.is_application ? 'Application' : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {manager.is_active === false ? (
                <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded">
                  Deactivated
                </span>
              ) : (
                <StatusBadge status={manager.status as any} size="sm" />
              )}
            </div>
          </div>
        </div>

        {/* BM ID */}
        <div className="flex items-center min-h-[24px]">
          {manager.dolphin_business_manager_id ? (
            <div className="flex items-center gap-1 bg-muted/40 px-2 py-1 rounded text-xs text-muted-foreground">
              <code className="text-xs">BM:{manager.dolphin_business_manager_id}</code>
            </div>
          ) : (
            <div></div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="text-xs">
              <Building2 className="h-3 w-3 mr-1" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="domains" className="text-xs">
              <Globe className="h-3 w-3 mr-1" />
              Domains
            </TabsTrigger>
            <TabsTrigger value="accounts" className="text-xs">
              <CreditCard className="h-3 w-3 mr-1" />
              Accounts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-3">
            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col items-center justify-center p-2 bg-muted/30 rounded-md">
                <div className="text-xs text-muted-foreground mb-1">Ad Accounts</div>
                <div className="font-semibold text-foreground text-lg">{manager.ad_account_count || 0}</div>
              </div>
              <div className="flex flex-col items-center justify-center p-2 bg-muted/30 rounded-md">
                <div className="text-xs text-muted-foreground mb-1">Status</div>
                <div className="font-semibold text-foreground text-sm capitalize">{manager.status}</div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-between items-center">
              <div className="flex-1">
                {getActionButtons ? getActionButtons(manager) : defaultActionButtons(manager)}
              </div>
              {manager.status === "active" && (
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </TabsContent>

          <TabsContent value="domains" className="mt-4">
            <BmDomainsTab 
              bmId={manager.id} 
              bmName={manager.name} 
            />
          </TabsContent>

          <TabsContent value="accounts" className="mt-4">
            <div className="text-center py-4 text-muted-foreground">
              <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Ad accounts management</p>
              <p className="text-xs">Click card to view accounts</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 