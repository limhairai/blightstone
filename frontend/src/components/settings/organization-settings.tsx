"use client"

import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { toast } from "sonner"
import { CreditCard, Calendar, Zap, AlertTriangle, Trash2, Plus, CheckCircle2, Settings } from 'lucide-react'
import { Progress } from "../ui/progress"
import { pricingPlans } from "../../lib/mock-data"
import { useDemoState } from "../../contexts/DemoStateContext"
import { gradientTokens } from "../../lib/design-tokens"

export function OrganizationSettings() {
  const { state, updateOrganization } = useDemoState()
  const [editOrgOpen, setEditOrgOpen] = useState(false)
  const [deleteOrgOpen, setDeleteOrgOpen] = useState(false)
  const [billingHistoryOpen, setBillingHistoryOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [paymentMethodOpen, setPaymentMethodOpen] = useState(false)
  const [confirmDeleteText, setConfirmDeleteText] = useState("")

  // Get actual counts from demo state
  const totalBusinesses = state.businesses.length
  const totalAccounts = state.accounts.length
  const totalTeamMembers = state.teamMembers.length
  const currentPlan = pricingPlans.find(plan => plan.id.toLowerCase() === state.currentOrganization.plan.toLowerCase()) || pricingPlans[1] // Use current org's plan

  const [formData, setFormData] = useState({
    name: state.currentOrganization.name,
  })

  // Update formData when organization changes
  useEffect(() => {
    setFormData({
      name: state.currentOrganization.name,
    })
  }, [state.currentOrganization.name])

  const handleSaveOrgDetails = () => {
    if (!formData.name.trim()) {
      toast.error("Organization name cannot be empty.")
      return
    }

    updateOrganization({ name: formData.name })
    setEditOrgOpen(false)
  }

  const handleDeleteOrg = () => {
    if (confirmDeleteText !== state.currentOrganization.name) {
      toast.error("Please type the organization name correctly to confirm deletion.")
      return
    }

    toast.error("Organization deletion is not available in demo mode.")
    setDeleteOrgOpen(false)
    setConfirmDeleteText("")
  }

  // Use organization-specific billing history
  const billingHistory = state.currentOrganization.billing.billingHistory

  // Use centralized pricing plans
  const availablePlans = pricingPlans.map(plan => ({
    id: plan.id,
    name: plan.title,
    price: plan.price,
    businessesLimit: plan.id === "bronze" ? 2 : plan.id === "silver" ? 5 : plan.id === "gold" ? 10 : 20,
    adAccountsLimit: plan.id === "bronze" ? 20 : plan.id === "silver" ? 50 : plan.id === "gold" ? 100 : 200,
    teamMembersLimit: plan.id === "bronze" ? 3 : plan.id === "silver" ? 10 : plan.id === "gold" ? 25 : 50,
    features: plan.features,
    current: plan.id.toLowerCase() === state.currentOrganization.plan.toLowerCase(), // Use current org's plan
  }))

  // Calculate plan limits based on current organization's plan
  const planLimits = {
    businessesLimit: state.currentOrganization.limits.businesses,
    adAccountsLimit: (state.currentOrganization as any).limits?.adAccounts || 100,
    teamMembersLimit: state.currentOrganization.limits.teamMembers,
  }

  return (
    <>
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Usage & Limits */}
        <div className="lg:col-span-2 space-y-4">
          {/* Usage & Limits */}
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">Usage & Limits</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Your current usage across different resources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Businesses Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-foreground">Businesses</Label>
                  <span className="text-sm text-muted-foreground">
                    {totalBusinesses} / {planLimits.businessesLimit}
                  </span>
                </div>
                <Progress value={(totalBusinesses / planLimits.businessesLimit) * 100} className="h-2" />
              </div>

              {/* Ad Accounts Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-foreground">Ad Accounts</Label>
                  <span className="text-sm text-muted-foreground">
                    {totalAccounts} / {planLimits.adAccountsLimit}
                  </span>
                </div>
                <Progress value={(totalAccounts / planLimits.adAccountsLimit) * 100} className="h-2" />
              </div>

              {/* Team Members Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-foreground">Team Members</Label>
                  <span className="text-sm text-muted-foreground">
                    {totalTeamMembers} / {planLimits.teamMembersLimit}
                  </span>
                </div>
                <Progress value={(totalTeamMembers / planLimits.teamMembersLimit) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="bg-card border border-red-800/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Danger Zone
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                These actions are permanent and cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-3 px-4 bg-red-950/10 rounded-lg border border-red-800/20">
                <div>
                  <div className="text-sm font-medium text-foreground">Delete Organization</div>
                  <div className="text-xs text-muted-foreground">
                    Permanently delete this organization and all associated data
                  </div>
                </div>
                <Button variant="destructive" size="sm" onClick={() => setDeleteOrgOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Subscription Plan */}
        <div className="space-y-4">
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">Subscription Plan</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Your current plan and billing information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Plan Details */}
              <div className={`p-4 ${gradientTokens.light} rounded-lg border ${gradientTokens.border}`}>
                <Badge className={gradientTokens.primary}>
                  Current Plan
                </Badge>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-2xl font-bold text-foreground">${currentPlan.price}</span>
                  <span className="text-sm text-muted-foreground">/ month</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Next payment</span>
                    <span className="text-foreground font-medium">{state.currentOrganization.billing.nextPayment}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Billing cycle</span>
                    <span className="text-foreground font-medium">{state.currentOrganization.billing.billingCycle}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Businesses limit</span>
                    <span className="text-foreground font-medium">{planLimits.businessesLimit} businesses</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Ad accounts limit</span>
                    <span className="text-foreground font-medium">{planLimits.adAccountsLimit} accounts</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={() => setUpgradeOpen(true)}
                  className={`w-full ${gradientTokens.primary}`}
                >
                  Upgrade Plan
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border text-foreground hover:bg-accent"
                    onClick={() => setPaymentMethodOpen(true)}
                  >
                    <CreditCard className="h-4 w-4 mr-1" />
                    Payment
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border text-foreground hover:bg-accent"
                    onClick={() => setBillingHistoryOpen(true)}
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    History
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Organization Dialog */}
      <Dialog open={editOrgOpen} onOpenChange={setEditOrgOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">Edit Organization</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Update your organization details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="space-y-2">
              <Label htmlFor="org-name" className="text-sm font-medium text-foreground">
                Organization Name
              </Label>
              <Input
                id="org-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOrgOpen(false)}
              className="border-border text-foreground hover:bg-accent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveOrgDetails}
              className={gradientTokens.primary}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Organization Dialog */}
      <Dialog open={deleteOrgOpen} onOpenChange={setDeleteOrgOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Delete Organization
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              This action is permanent and cannot be undone. All data associated with this organization will be
              permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="p-3 bg-red-950/20 border border-red-800/30 rounded-md">
              <p className="text-sm text-red-400">
                Please type <strong>{state.currentOrganization.name}</strong> to confirm deletion.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-delete" className="text-sm font-medium text-foreground">
                Confirmation
              </Label>
              <Input
                id="confirm-delete"
                value={confirmDeleteText}
                onChange={(e) => setConfirmDeleteText(e.target.value)}
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOrgOpen(false)}
              className="border-border text-foreground hover:bg-accent"
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrg} disabled={confirmDeleteText !== state.currentOrganization.name}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Organization
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Billing History Dialog */}
      <Dialog open={billingHistoryOpen} onOpenChange={setBillingHistoryOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">Billing History</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              View your past invoices and payment history.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="border border-border rounded-md overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">Invoice</th>
                    <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {billingHistory.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2 px-4">
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">{invoice.id}</code>
                      </td>
                      <td className="py-2 px-4 text-sm text-foreground">{invoice.date}</td>
                      <td className="py-2 px-4 text-sm text-foreground">${invoice.amount}</td>
                      <td className="py-2 px-4">
                        <Badge className={gradientTokens.primary}>
                          {invoice.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBillingHistoryOpen(false)}
              className="border-border text-foreground hover:bg-accent"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Plan Dialog */}
      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="bg-card border-border max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">Upgrade Plan</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Choose a plan that fits your needs.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {availablePlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative p-4 border rounded-lg transition-all ${
                    plan.current 
                      ? "border-[#c4b5fd] bg-[#c4b5fd]/10 ring-2 ring-[#c4b5fd]/20" 
                      : "border-border hover:border-[#c4b5fd]/50 hover:shadow-md"
                  }`}
                >
                  {plan.current && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <Badge className={gradientTokens.primary}>
                        Current Plan
                      </Badge>
                    </div>
                  )}
                  
                  <div className="text-center space-y-3">
                    <div>
                      <h4 className="text-lg font-semibold text-foreground">{plan.name}</h4>
                      <div className="mt-2">
                        <span className="text-2xl font-bold text-foreground">${plan.price}</span>
                        <span className="text-sm text-muted-foreground">/month</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div>{plan.businessesLimit} businesses</div>
                      <div>{plan.adAccountsLimit} ad accounts</div>
                      <div>{plan.teamMembersLimit} team members</div>
                    </div>
                    
                    {!plan.current ? (
                      <Button
                        className={`w-full ${gradientTokens.primary}`}
                        onClick={() => {
                          toast.success(`Upgrading to ${plan.name} plan...`)
                          setUpgradeOpen(false)
                        }}
                      >
                        Select Plan
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full border-border text-foreground"
                        disabled
                      >
                        Current Plan
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUpgradeOpen(false)}
              className="border-border text-foreground hover:bg-accent"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Method Dialog */}
      <Dialog open={paymentMethodOpen} onOpenChange={setPaymentMethodOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">Update Payment Method</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Update your payment information for subscription billing.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-3">
              <div className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-5 bg-blue-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">VISA</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">•••• •••• •••• 4242</div>
                      <div className="text-xs text-muted-foreground">Expires 12/26</div>
                    </div>
                  </div>
                  <Badge className={gradientTokens.primary}>Default</Badge>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full border-border text-foreground hover:bg-accent"
                onClick={() => {
                  toast.success("Redirecting to secure payment form...")
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Payment Method
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPaymentMethodOpen(false)}
              className="border-border text-foreground hover:bg-accent"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
