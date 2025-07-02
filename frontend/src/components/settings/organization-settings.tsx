"use client"

import { useState, useEffect } from "react"
import useSWR, { useSWRConfig } from 'swr'
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

import { useOrganizationStore } from "@/lib/stores/organization-store"
import { gradientTokens } from "../../lib/design-tokens"
import { useAuth } from "@/contexts/AuthContext"
import { useCurrentOrganization, useBusinessManagers, useAdAccounts, authenticatedFetcher } from "../../lib/swr-config"
import { useSubscription } from "@/hooks/useSubscription"
import { PlanUpgradeDialog } from "../pricing/plan-upgrade-dialog"

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function OrganizationSettings() {
  const { currentOrganizationId, setCurrentOrganizationId } = useOrganizationStore();
  const { mutate } = useSWRConfig();
  const { session } = useAuth();
  const { currentPlan: subscriptionPlan, usage, subscriptionData } = useSubscription();

  // Authenticated fetcher for business-managers API
  const authFetcher = (url: string) => 
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${session?.access_token}`
      }
    }).then(res => res.json());

  const { data: orgData, isLoading: isOrgLoading, error: orgError } = useCurrentOrganization(currentOrganizationId);
  const { data: bizData, isLoading: isBizLoading } = useBusinessManagers(currentOrganizationId);
  const { data: accData, isLoading: isAccLoading } = useAdAccounts(currentOrganizationId);
  const { data: teamData, isLoading: isTeamLoading } = useSWR(
    session && currentOrganizationId ? ['/api/teams/members', session.access_token] : null, 
    ([url, token]) => authenticatedFetcher(url, token)
  );
  
  const organization = orgData?.organizations?.[0];
  
  // Debug logging (can be removed in production)
  // console.log('🔍 OrganizationSettings Debug:', {
  //   currentOrganizationId,
  //   orgData,
  //   organization,
  //   isOrgLoading,
  //   orgError: orgError?.message,
  //   hasSession: !!session,
  //   hasAccessToken: !!session?.access_token
  // });
  const businesses = bizData || [];
  const accounts = accData?.accounts || [];
  const teamMembers = teamData?.members || [];
  
  const [editOrgOpen, setEditOrgOpen] = useState(false)
  const [deleteOrgOpen, setDeleteOrgOpen] = useState(false)
  const [billingHistoryOpen, setBillingHistoryOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [paymentMethodOpen, setPaymentMethodOpen] = useState(false)
  const [confirmDeleteText, setConfirmDeleteText] = useState("")
  const [loading, setLoading] = useState(false)

  // Use real usage data from subscription hook, fallback to counting from API data
  const totalBusinesses = usage?.businessManagers ?? businesses.length
  const totalAccounts = usage?.adAccounts ?? accounts.length
  const totalTeamMembers = usage?.teamMembers ?? teamMembers.length
  
  // Use real subscription plan data instead of hardcoded defaultPlans
  const currentPlan = subscriptionPlan || {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    adSpendFee: 0,
    maxTeamMembers: 1,
    maxBusinesses: 0,
    maxAdAccounts: 0
  }

  const [formData, setFormData] = useState({
    name: organization?.name || "",
  })

  // Update formData when organization changes
  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name,
      })
    }
  }, [organization])

  const handleSaveOrgDetails = async () => {
    if (!formData.name.trim()) {
      toast.error("Organization name cannot be empty.")
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/organizations?id=${currentOrganizationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name.trim() })
      });

      if (!response.ok) {
        throw new Error("Failed to update organization");
      }
      
      mutate(`/api/organizations?id=${currentOrganizationId}`);
      toast.success("Organization details updated successfully.")
      setEditOrgOpen(false)
    } catch (error) {
      toast.error("Failed to update organization. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteOrg = async () => {
    if (confirmDeleteText !== organization?.name) {
      toast.error("Please type the organization name correctly to confirm deletion.")
      return
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/organizations?id=${currentOrganizationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error("Failed to delete organization");
      }

      toast.success("Organization deleted successfully.");
      // You might want to switch to another organization or a default state
      setCurrentOrganizationId('');
      setDeleteOrgOpen(false);
      setConfirmDeleteText("");
    } catch (error) {
      toast.error("Failed to delete organization. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Use organization-specific billing history
  const billingHistory = organization?.billing?.billingHistory || []

  const globalLoading = isOrgLoading || isBizLoading || isAccLoading || isTeamLoading;

  if (globalLoading) {
    return <div>Loading organization settings...</div>;
  }
  
  // Safety check - show loading if no organization ID or if still loading
  if (!currentOrganizationId) {
    return <div>Loading organization...</div>
  }
  
  // If we have an organization ID but no organization data (and not loading), 
  // this means the organization doesn't exist or user doesn't have access
  if (!organization && !globalLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground mb-4">No organization found.</div>
        <div className="text-sm text-muted-foreground mb-4">
          Organization ID: {currentOrganizationId}
        </div>
        <Button 
          onClick={() => {
            // Clear the invalid organization ID and reload
            setCurrentOrganizationId('');
            localStorage.removeItem('organization-storage');
            window.location.reload();
          }}
          variant="outline"
        >
          Reset Organization
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Organization Details */}
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
              {/* Business Managers Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-foreground">Business Managers</Label>
                  <span className="text-sm text-muted-foreground">
                    {totalBusinesses} / {currentPlan.maxBusinesses === -1 ? '∞' : currentPlan.maxBusinesses}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ 
                      width: `${currentPlan.maxBusinesses === -1 ? 0 : Math.min(100, (totalBusinesses / currentPlan.maxBusinesses) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* Ad Accounts Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-foreground">Ad Accounts</Label>
                  <span className="text-sm text-muted-foreground">
                    {totalAccounts} / {currentPlan.maxAdAccounts === -1 ? '∞' : currentPlan.maxAdAccounts}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ 
                      width: `${currentPlan.maxAdAccounts === -1 ? 0 : Math.min(100, (totalAccounts / currentPlan.maxAdAccounts) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* Team Members Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-foreground">Team Members</Label>
                  <span className="text-sm text-muted-foreground">
                    {totalTeamMembers} / {currentPlan.maxTeamMembers === -1 ? '∞' : currentPlan.maxTeamMembers}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ 
                      width: `${currentPlan.maxTeamMembers === -1 ? 0 : Math.min(100, (totalTeamMembers / currentPlan.maxTeamMembers) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* Current Plan Summary */}
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Current Plan</span>
                  <span className="text-foreground font-medium">{currentPlan.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Ad Spend Fee</span>
                  <span className="text-foreground font-medium">{currentPlan.adSpendFee}%</span>
                </div>
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
                  <span className="text-2xl font-bold text-foreground">
                    {currentPlan.id === 'free' ? 'Free' : `$${currentPlan.monthlyPrice}`}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {currentPlan.id === 'free' ? 'Forever' : '/ month'}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Next payment</span>
                    <span className="text-foreground font-medium">
                      {currentPlan.id === 'free' ? 'N/A' : (organization?.billing?.nextPayment || "N/A")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Billing cycle</span>
                    <span className="text-foreground font-medium">
                      {currentPlan.id === 'free' ? 'N/A' : (organization?.billing?.billingCycle || "monthly")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Plan features</span>
                    <span className="text-foreground font-medium">See upgrade dialog</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Payment method</span>
                    <span className="text-foreground font-medium">
                      {currentPlan.id === 'free' ? 'Not required' : (organization?.billing?.paymentMethod?.type ? 
                        `**** ${organization.billing.paymentMethod.last4}` : 'Not set')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={() => setUpgradeOpen(true)}
                  className={`w-full ${gradientTokens.primary}`}
                >
                  {currentPlan.id === 'free' ? 'Choose Plan' : 'Upgrade Plan'}
                </Button>

                {currentPlan.id !== 'free' && (
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
                )}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle />
              Delete Organization
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{organization.name}</strong>? 
              This will permanently erase all associated businesses, ad accounts, and team members. 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Label htmlFor="confirmDelete" className="text-sm text-muted-foreground">
              To confirm, please type <strong className="text-foreground">{organization.name}</strong> below:
            </Label>
            <Input
              id="confirmDelete"
              value={confirmDeleteText}
              onChange={(e) => setConfirmDeleteText(e.target.value)}
              className="border-border focus:border-red-500"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOrgOpen(false)} disabled={loading}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteOrg} 
              disabled={loading || confirmDeleteText !== organization.name}
            >
              {loading ? "Deleting..." : "Delete Organization"}
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
                  {billingHistory.map((invoice: any) => (
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
      <PlanUpgradeDialog
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
      />

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
