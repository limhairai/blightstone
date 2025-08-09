"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Separator } from "../ui/separator"
import { StatusBadge } from "./status-badge"
import { formatCurrency } from "../../utils/format"
import { ExternalLink, Copy, Calendar, DollarSign, TrendingUp } from "lucide-react"
import { AppAccount } from "../../types/account"

interface ViewDetailsDialogProps {
  account: AppAccount | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewDetailsDialog({ account, open, onOpenChange }: ViewDetailsDialogProps) {
  if (!account) return null

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  // Map AppAccount status to StatusBadge status
  function mapAccountStatusToBadgeStatus(status: string): "error" | "pending" | "active" | "suspended" {
    switch (status) {
      case "active":
        return "active";
      case "pending":
        return "pending";
      case "suspended":
        return "suspended";
      case "inactive":
        return "suspended"; // Map inactive to suspended since StatusBadge doesn't support inactive
      default:
        return "error";
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-3">
            <span>{account.name}</span>
            <StatusBadge status={mapAccountStatusToBadgeStatus(account.status)} size="sm" />
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
                    {account.id}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(account.id.toString())}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wide">Platform</label>
                <Badge variant="outline" className="w-fit">
                  Facebook
                </Badge>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wide">Business</label>
                <p className="text-sm text-foreground">{account.business || 'Unknown'}</p>
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
                <div className="text-sm text-foreground">${formatCurrency(10000)}</div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wide">Spent This Month</label>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-foreground">${formatCurrency(account.spent || 0)}</div>
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Quota Usage</span>
                <span>{Math.round(((account.spent || 0) / 10000) * 100)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.min(((account.spent || 0) / 10000) * 100, 100)}%` }}
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
                  `https://business.facebook.com/adsmanager/manage/accounts?act=${account.id}`,
                  "_blank",
                )
              }
              className="border-border text-foreground hover:bg-[#F5F5F5]"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in Facebook
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-border text-foreground hover:bg-[#F5F5F5]"
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
