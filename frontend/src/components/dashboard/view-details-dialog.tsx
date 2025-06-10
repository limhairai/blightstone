"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { formatCurrency } from "@/utils/format"
import { ExternalLink, Copy, Calendar, DollarSign, TrendingUp } from "lucide-react"
import type { MockAccount } from "@/types/account"

interface ViewDetailsDialogProps {
  account: MockAccount | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewDetailsDialog({ account, open, onOpenChange }: ViewDetailsDialogProps) {
  if (!account) return null

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-3">
            <span>{account.name}</span>
            <StatusBadge status={account.status} size="sm" />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Account Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Account Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wide">Account ID</label>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-muted px-2 py-1 rounded border font-mono text-foreground">
                    {account.adAccount}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(account.adAccount)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wide">Platform</label>
                <Badge variant="outline" className="w-fit">
                  {account.platform}
                </Badge>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wide">Business</label>
                <p className="text-sm text-foreground">{account.business}</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wide">Date Added</label>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  {account.dateAdded}
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Financial Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Financial Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wide">Current Balance</label>
                <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />${formatCurrency(account.balance)}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wide">Monthly Quota</label>
                <div className="text-sm text-foreground">${formatCurrency(account.quota)}</div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wide">Spent This Month</label>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-foreground">${formatCurrency(account.spent)}</div>
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Quota Usage</span>
                <span>{Math.round((account.spent / account.quota) * 100)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] transition-all duration-500"
                  style={{ width: `${Math.min((account.spent / account.quota) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Actions */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() =>
                window.open(
                  `https://business.facebook.com/adsmanager/manage/accounts?act=${account.adAccount}`,
                  "_blank",
                )
              }
              className="border-border text-foreground hover:bg-accent"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in Facebook
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-border text-foreground hover:bg-accent"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
