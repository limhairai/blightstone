"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { 
  CheckCircle, 
  XCircle, 
  Building2, 
  Globe, 
  DollarSign, 
  Loader2, 
  AlertCircle,
  ExternalLink,
  Zap,
  Clock
} from "lucide-react"
import { toast } from "sonner"

interface Application {
  id: string
  business_id: string
  organization_name: string
  business_name: string
  account_name: string
  spend_limit: number
  status: string
  submitted_at: string
  user_email?: string
  user_name?: string
  admin_notes?: string
  rejection_reason?: string
}

interface DolphinAccount {
  id: string
  name: string
  platform: string
  status: string
  profile_id: string
}

interface EnhancedApplicationApprovalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  application: Application | null
  onApprove: (applicationId: string) => Promise<void>
  onReject: (applicationId: string, reason: string) => Promise<void>
}

export function EnhancedApplicationApprovalDialog({
  open,
  onOpenChange,
  application,
  onApprove,
  onReject,
}: EnhancedApplicationApprovalDialogProps) {
  const [activeTab, setActiveTab] = useState("review")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [adminNotes, setAdminNotes] = useState("")
  const [dolphinAccounts, setDolphinAccounts] = useState<DolphinAccount[]>([])
  const [selectedDolphinAccount, setSelectedDolphinAccount] = useState("")
  const [customSpendLimit, setCustomSpendLimit] = useState("")
  const [loadingDolphin, setLoadingDolphin] = useState(false)

  // Fetch available Dolphin accounts when dialog opens
  useEffect(() => {
    if (open && application) {
      fetchDolphinAccounts()
    }
  }, [open, application])

  const fetchDolphinAccounts = async () => {
    setLoadingDolphin(true)
    try {
      const response = await fetch('/api/admin/dolphin')
      if (response.ok) {
        const data = await response.json()
        setDolphinAccounts(data.accounts || [])
      }
    } catch (error) {
      console.error('Error fetching Dolphin accounts:', error)
      toast.error('Failed to load available accounts')
    } finally {
      setLoadingDolphin(false)
    }
  }

  const handleApprove = async () => {
    if (!application) return
    
    setIsSubmitting(true)
    try {
      // First approve the application
      const response = await fetch('/api/admin/applications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: application.id,
          action: 'approved',
          admin_notes: adminNotes || 'Application approved'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to approve application')
      }

      // If Dolphin account is selected, bind it
      if (selectedDolphinAccount) {
        const bindResponse = await fetch('/api/admin/dolphin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            application_id: application.id,
            dolphin_account_id: selectedDolphinAccount,
            spend_limit: customSpendLimit ? parseInt(customSpendLimit) : application.spend_limit
          }),
        })

        if (!bindResponse.ok) {
          throw new Error('Application approved but failed to bind Dolphin account')
        }

        toast.success('Application approved and account bound successfully!')
      } else {
        toast.success('Application approved successfully!')
      }

      await onApprove(application.id)
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error('Error approving application:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to approve application')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!application || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/admin/applications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: application.id,
          action: 'rejected',
          admin_notes: adminNotes || 'Application rejected',
          rejection_reason: rejectionReason
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to reject application')
      }

      toast.success('Application rejected')
      await onReject(application.id, rejectionReason)
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error('Error rejecting application:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to reject application')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSyncDolphin = async () => {
    setLoadingDolphin(true)
    try {
      const response = await fetch('/api/admin/dolphin', {
        method: 'PUT',
      })

      if (!response.ok) {
        throw new Error('Failed to sync with Dolphin')
      }

      await fetchDolphinAccounts()
      toast.success('Successfully synced with Dolphin')
    } catch (error) {
      console.error('Error syncing with Dolphin:', error)
      toast.error('Failed to sync with Dolphin')
    } finally {
      setLoadingDolphin(false)
    }
  }

  const resetForm = () => {
    setActiveTab("review")
    setRejectionReason("")
    setAdminNotes("")
    setSelectedDolphinAccount("")
    setCustomSpendLimit("")
  }

  if (!application) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Review Application: {application.business_name}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="review">Review Details</TabsTrigger>
            <TabsTrigger value="approve">Approve & Bind</TabsTrigger>
            <TabsTrigger value="reject">Reject</TabsTrigger>
          </TabsList>

          <TabsContent value="review" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Business Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Organization</Label>
                    <p className="font-medium">{application.organization_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Business Name</Label>
                    <p className="font-medium">{application.business_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Account Name</Label>
                    <p className="font-medium">{application.account_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Contact</Label>
                    <p className="text-sm">{application.user_email}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Campaign Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Spend Limit</Label>
                    <Badge variant="secondary" className="text-lg">
                      ${application.spend_limit.toLocaleString()}/month
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <Badge className={
                      application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      application.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {application.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Submitted</Label>
                    <p className="text-sm">{new Date(application.submitted_at).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Review Checklist</h4>
                    <ul className="text-sm text-blue-700 mt-2 space-y-1">
                      <li>• Verify business information is accurate</li>
                      <li>• Check spend limit is appropriate</li>
                      <li>• Ensure contact information is valid</li>
                      <li>• Review for compliance requirements</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approve" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-green-600" />
                  Dolphin Account Binding
                </CardTitle>
                <CardDescription>
                  Select an available Dolphin account to bind to this application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSyncDolphin}
                    disabled={loadingDolphin}
                  >
                    {loadingDolphin ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4 mr-2" />
                    )}
                    Sync with Dolphin
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {dolphinAccounts.length} accounts available
                  </span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dolphinAccount">Available Accounts</Label>
                  <Select value={selectedDolphinAccount} onValueChange={setSelectedDolphinAccount}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a Dolphin account (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {dolphinAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            {account.name} ({account.platform})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customSpendLimit">Custom Spend Limit (optional)</Label>
                  <Input
                    id="customSpendLimit"
                    type="number"
                    value={customSpendLimit}
                    onChange={(e) => setCustomSpendLimit(e.target.value)}
                    placeholder={`Default: $${application.spend_limit.toLocaleString()}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminNotes">Admin Notes (optional)</Label>
                  <Textarea
                    id="adminNotes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add any notes for the approval..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reject" className="space-y-4">
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <XCircle className="h-4 w-4" />
                  Reject Application
                </CardTitle>
                <CardDescription className="text-red-600">
                  Provide a clear reason for rejection. The client will receive this message.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                  <Textarea
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a clear reason for rejection..."
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminNotesReject">Internal Notes (optional)</Label>
                  <Textarea
                    id="adminNotesReject"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Internal notes for admin team..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          
          {activeTab === "approve" && (
            <Button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Application
                </>
              )}
            </Button>
          )}
          
          {activeTab === "reject" && (
            <Button
              onClick={handleReject}
              disabled={isSubmitting || !rejectionReason.trim()}
              variant="destructive"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Application
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
