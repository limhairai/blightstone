"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { CreditCard, Calendar, Zap, AlertTriangle, Trash2, Plus, CheckCircle2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export function OrganizationSettings() {
  const { toast } = useToast()
  const [editOrgOpen, setEditOrgOpen] = useState(false)
  const [deleteOrgOpen, setDeleteOrgOpen] = useState(false)
  const [billingHistoryOpen, setBillingHistoryOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [paymentMethodOpen, setPaymentMethodOpen] = useState(false)
  const [confirmDeleteText, setConfirmDeleteText] = useState("")
  const [activeTab, setActiveTab] = useState("general")

  const [orgData, setOrgData] = useState({
    name: "Startup Project",
    id: "org_VrfbN6vMc2MCvaZELhfJ",
    memberSince: "January 2025",
    plan: "Business Plan",
    price: 49,
    nextPayment: "Mar 4, 2025",
    billingCycle: "Monthly",
    businessesLimit: 5,
    businessCount: 3,
    adAccountsLimit: 50,
    teamMembersLimit: 10,
    teamMembers: 5,
  })

  const [formData, setFormData] = useState({
    name: orgData.name,
  })

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          toast({
            title: "Copied!",
            description: "Copied to clipboard.",
          })
        })
        .catch((err) => console.error("Failed to copy:", err))
    }
  }

  const handleSaveOrgDetails = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Invalid name",
        description: "Organization name cannot be empty.",
        variant: "destructive",
      })
      return
    }

    setOrgData({
      ...orgData,
      name: formData.name,
    })

    toast({
      title: "Organization updated",
      description: "Organization details have been updated successfully.",
    })

    setEditOrgOpen(false)
  }

  const handleDeleteOrg = () => {
    if (confirmDeleteText !== orgData.name) {
      toast({
        title: "Confirmation failed",
        description: "Please type the organization name correctly to confirm deletion.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Organization deleted",
      description: "Your organization has been permanently deleted.",
      variant: "destructive",
    })

    setDeleteOrgOpen(false)
    setConfirmDeleteText("")
  }

  const billingHistory = [
    { id: "inv_001", date: "Feb 4, 2025", amount: 49, status: "paid" },
    { id: "inv_002", date: "Jan 4, 2025", amount: 49, status: "paid" },
    { id: "inv_003", date: "Dec 4, 2024", amount: 49, status: "paid" },
  ]

  const availablePlans = [
    {
      id: "starter",
      name: "Starter",
      price: 29,
      businessesLimit: 2,
      adAccountsLimit: 20,
      teamMembersLimit: 3,
      features: ["2 businesses", "20 ad accounts", "3 team members"],
    },
    {
      id: "business",
      name: "Business",
      price: 49,
      businessesLimit: 5,
      adAccountsLimit: 50,
      teamMembersLimit: 10,
      current: true,
      features: ["5 businesses", "50 ad accounts", "10 team members", "Priority support"],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 99,
      businessesLimit: 20,
      adAccountsLimit: 200,
      teamMembersLimit: 50,
      features: ["20 businesses", "200 ad accounts", "50 team members", "Dedicated support", "Custom integrations"],
    },
  ]

  return (
    <div className="space-y-6">
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Organization Details & Usage */}
        <div className="lg:col-span-2 space-y-6">
          {/* Usage & Limits */}
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">Usage & Limits</CardTitle>
              <CardDescription className="text-muted-foreground">
                Your current usage across different resources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Businesses Usage */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-foreground">Businesses</Label>
                  <span className="text-sm text-muted-foreground">
                    {orgData.businessCount} / {orgData.businessesLimit}
                  </span>
                </div>
                <Progress value={(orgData.businessCount / orgData.businessesLimit) * 100} className="h-2" />
              </div>

              {/* Ad Accounts Usage */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-foreground">Ad Accounts</Label>
                  <span className="text-sm text-muted-foreground">
                    {orgData.businessCount} / {orgData.adAccountsLimit}
                  </span>
                </div>
                <Progress value={(orgData.businessCount / orgData.adAccountsLimit) * 100} className="h-2" />
              </div>

              {/* Team Members Usage */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-foreground">Team Members</Label>
                  <span className="text-sm text-muted-foreground">
                    {orgData.teamMembers} / {orgData.teamMembersLimit}
                  </span>
                </div>
                <Progress value={(orgData.teamMembers / orgData.teamMembersLimit) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="bg-card border border-red-800/30">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-1">
                These actions are permanent and cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 px-4 bg-red-950/10 rounded-lg border border-red-800/20">
                <div>
                  <div className="font-medium text-foreground">Delete Organization</div>
                  <div className="text-sm text-muted-foreground">
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
        <div className="space-y-6">
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">Subscription Plan</CardTitle>
              <CardDescription className="text-muted-foreground">
                Your current plan and billing information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Plan Details */}
              <div className="p-4 bg-gradient-to-r from-[#c4b5fd]/10 to-[#ffc4b5]/10 rounded-lg border border-[#c4b5fd]/20">
                <Badge className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] text-black border-0 mb-3">
                  {orgData.plan}
                </Badge>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-bold text-foreground">${orgData.price}</span>
                  <span className="text-muted-foreground">/ month</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Next payment</span>
                    <span className="text-foreground font-medium">{orgData.nextPayment}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Billing cycle</span>
                    <span className="text-foreground font-medium">{orgData.billingCycle}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Businesses limit</span>
                    <span className="text-foreground font-medium">{orgData.businessesLimit} businesses</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Ad accounts limit</span>
                    <span className="text-foreground font-medium">{orgData.adAccountsLimit} accounts</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  className="w-full bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0"
                  onClick={() => setUpgradeOpen(true)}
                >
                  <Zap className="h-4 w-4 mr-2" />
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

      {/* Keep all existing dialogs unchanged */}
      {/* ... all dialog components remain the same ... */}

      {/* Edit Organization Dialog */}
      <Dialog open={editOrgOpen} onOpenChange={setEditOrgOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Organization</DialogTitle>
            <DialogDescription className="text-muted-foreground">Update your organization details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
              className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0"
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
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Delete Organization
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              This action is permanent and cannot be undone. All data associated with this organization will be
              permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-red-950/20 border border-red-800/30 rounded-md">
              <p className="text-sm text-red-400">
                Please type <strong>{orgData.name}</strong> to confirm deletion.
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
            <Button variant="destructive" onClick={handleDeleteOrg} disabled={confirmDeleteText !== orgData.name}>
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
            <DialogTitle className="text-foreground">Billing History</DialogTitle>
            <DialogDescription className="text-muted-foreground">
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
                        <Badge className="bg-emerald-950/50 text-emerald-400 border-emerald-700">
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
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Upgrade Plan</DialogTitle>
            <DialogDescription className="text-muted-foreground">Choose a plan that fits your needs.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {availablePlans.map((plan) => (
              <div
                key={plan.id}
                className={`p-4 border rounded-lg ${
                  plan.current ? "border-[#c4b5fd] bg-[#c4b5fd]/10" : "border-border hover:border-border/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground">{plan.name}</h4>
                      {plan.current && (
                        <Badge className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] text-black border-0">
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Up to {plan.businessesLimit} businesses, {plan.adAccountsLimit} ad accounts
                    </p>
                    <div className="mt-3 space-y-1">
                      {plan.features?.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-3 w-3 text-[#c4b5fd]" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-foreground">${plan.price}</div>
                    <div className="text-xs text-muted-foreground">per month</div>
                    {!plan.current && (
                      <Button
                        size="sm"
                        className="mt-3 bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0"
                        onClick={() => {
                          toast({
                            title: "Plan upgrade initiated",
                            description: `Upgrading to ${plan.name} plan...`,
                          })
                          setUpgradeOpen(false)
                        }}
                      >
                        Select
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
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
            <DialogTitle className="text-foreground">Update Payment Method</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update your payment information for subscription billing.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-5 bg-blue-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">VISA</span>
                    </div>
                    <div>
                      <div className="font-medium text-foreground">•••• •••• •••• 4242</div>
                      <div className="text-xs text-muted-foreground">Expires 12/26</div>
                    </div>
                  </div>
                  <Badge className="bg-emerald-950/50 text-emerald-400 border-emerald-700">Default</Badge>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full border-border text-foreground hover:bg-accent"
                onClick={() => {
                  toast({
                    title: "Add payment method",
                    description: "Redirecting to secure payment form...",
                  })
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
    </div>
  )
}
