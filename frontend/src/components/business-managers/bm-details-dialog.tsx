"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { Building2, Globe, Calendar, Hash, Copy, ExternalLink } from "lucide-react"
import { BusinessManager } from "@/types/business"
import { toast } from "sonner"
import { format } from "date-fns"

interface BmDetailsDialogProps {
  businessManager: BusinessManager | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BmDetailsDialog({ businessManager, open, onOpenChange }: BmDetailsDialogProps) {
  if (!businessManager) return null

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy • HH:mm')
    } catch {
      return dateString
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            Business Manager Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Basic Info */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-foreground">{businessManager.name}</h3>
              <p className="text-sm text-muted-foreground">
                Created {formatDate(businessManager.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {businessManager.is_active === false ? (
                <Badge variant="secondary" className="bg-muted text-muted-foreground">
                  Deactivated
                </Badge>
              ) : (
                <StatusBadge status={businessManager.status as any} size="sm" />
              )}
            </div>
          </div>

          {/* BM ID */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Business Manager ID</label>
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded border">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <code className="text-sm flex-1 font-mono">
                {businessManager.dolphin_business_manager_id || 'Not assigned'}
              </code>
              {businessManager.dolphin_business_manager_id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(businessManager.dolphin_business_manager_id!, 'BM ID')}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Domains */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Domains ({businessManager.domain_count || businessManager.domains?.length || 0})
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {businessManager.domains && businessManager.domains.length > 0 ? (
                businessManager.domains.map((domain: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded border">
                    <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm flex-1 font-mono">{domain}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(domain, 'Domain')}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`https://${domain}`, '_blank')}
                      className="h-6 w-6 p-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground italic p-2">
                  No domains configured
                </div>
              )}
            </div>
          </div>

          {/* Ad Accounts */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Ad Accounts</label>
            <div className="p-2 bg-muted/30 rounded border">
              <span className="text-sm font-medium">
                {businessManager.ad_account_count || 0}
              </span>
              <span className="text-sm text-muted-foreground ml-1">
                ad account{(businessManager.ad_account_count || 0) !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Additional Info */}
          {(businessManager as any).updated_at && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Last updated {formatDate((businessManager as any).updated_at)}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 