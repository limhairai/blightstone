"use client"

import { useState, useEffect, useCallback } from "react"
import { useSWRConfig } from 'swr'
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
import { useCurrentOrganization, useBusinessManagers, useAdAccounts } from "../../lib/swr-config"
import { useSubscription } from "@/hooks/useSubscription"
import { PlanUpgradeDialog } from "../pricing/plan-upgrade-dialog"
import useSWR from 'swr'
import { API_ENDPOINTS, createAuthHeaders } from '@/lib/api-config'
import { buildApiUrl } from '../../lib/api-utils'
import { getPlanPricing, shouldEnableTopupLimits, shouldEnablePixelLimits } from "@/lib/config/pricing-config"


export function OrganizationSettings() {
  const { currentOrganizationId, setCurrentOrganizationId } = useOrganizationStore();
  const { mutate } = useSWRConfig();
  const { session } = useAuth();
  const { currentPlan: subscriptionPlan, usage, subscriptionData } = useSubscription();

  // Helper function to get plan limits from pricing config
  const getPlanLimits = (plan: any) => {
    if (!plan) return { teamMembers: 0, businessManagers: 0, adAccounts: 0, pixels: 0, monthlyTopupLimit: 0 }
    
    const planId = plan.id as 'starter' | 'growth' | 'scale'
    const planLimits = getPlanPricing(planId)
    
    if (!planLimits) {
      // Free plan or unknown plan - use database fallback
      return {
        teamMembers: plan.maxTeamMembers,
        businessManagers: plan.maxBusinesses,
        adAccounts: plan.maxAdAccounts,
        pixels: 0,
        monthlyTopupLimit: 0
      }
    }
    
    // Use pricing config limits
    return {
      teamMembers: -1, // No team limits in new pricing model
      businessManagers: planLimits.businessManagers,
      adAccounts: planLimits.adAccounts,
      pixels: planLimits.pixels,
      monthlyTopupLimit: planLimits.monthlyTopupLimit
    }
  }

  const planLimits = getPlanLimits(subscriptionPlan)

  // Use optimized hooks - remove individual API calls
  const { data: orgData, isLoading: isOrgLoading, error: orgError } = useCurrentOrganization(currentOrganizationId);
  const { data: bizData, isLoading: isBizLoading } = useBusinessManagers();
  const { data: accData, isLoading: isAccLoading } = useAdAccounts();
  
  // Fetch pixel data for usage display
  const { data: pixelData, isLoading: isPixelLoading } = useSWR(
    session?.access_token && currentOrganizationId 
      ? [`/api/organizations/${currentOrganizationId}/pixels`, currentOrganizationId]
      : null,
    async ([url, orgId]) => {
      const response = await fetch(url, {
        headers: createAuthHeaders(session!.access_token)
      });
      if (!response.ok) throw new Error('Failed to fetch pixels');
      return response.json();
    }
  );

  // Fetch monthly topup usage if feature is enabled
  const { data: topupUsage, isLoading: isTopupLoading } = useSWR(
    session?.access_token && currentOrganizationId && shouldEnableTopupLimits()
      ? [`/api/topup-usage?organization_id=${currentOrganizationId}`, currentOrganizationId]
      : null,
    async ([url, orgId]) => {
      const response = await fetch(url, {
        headers: createAuthHeaders(session!.access_token)
      });
      if (!response.ok) throw new Error('Failed to fetch topup usage');
      return response.json();
    }
  );
  
  // Fetch payment methods from backend API
  const { data: paymentMethods = [], error: paymentMethodsError } = useSWR(
    session?.access_token && currentOrganizationId 
      ? [buildApiUrl('/api/payments/methods'), currentOrganizationId]
      : null,
    async ([url, orgId]) => {
      const response = await fetch(`${url}?organization_id=${orgId}`, {
        headers: createAuthHeaders(session!.access_token)
      });
      if (!response.ok) throw new Error('Failed to fetch payment methods');
      return response.json();
    }
  );

  // Fetch billing history from backend API
  const { data: billingHistoryData, error: billingHistoryError } = useSWR(
    session?.access_token && currentOrganizationId 
      ? [buildApiUrl('/api/payments/billing/history'), currentOrganizationId]
      : null,
    async ([url, orgId]) => {
      const response = await fetch(`${url}?organization_id=${orgId}&limit=10`, {
        headers: createAuthHeaders(session!.access_token)
      });
      if (!response.ok) throw new Error('Failed to fetch billing history');
      return response.json();
    }
  );

  const billingHistory = billingHistoryData?.invoices || [];

  const organization = orgData?.organizations?.[0];
  const businesses = bizData || [];
  const accounts = accData?.accounts || [];
  
  const [editOrgOpen, setEditOrgOpen] = useState(false)
  const [deleteOrgOpen, setDeleteOrgOpen] = useState(false)
  const [billingHistoryOpen, setBillingHistoryOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [paymentMethodOpen, setPaymentMethodOpen] = useState(false)
  const [confirmDeleteText, setConfirmDeleteText] = useState("")
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)


  // Define handleManualRefresh before useEffect
  const handleManualRefresh = useCallback(async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      
      
      // Refresh all organization-related data
      await Promise.all([
        mutate(`/api/organizations?id=${currentOrganizationId}`),
        mutate('/api/business-managers'),
        mutate('/api/ad-accounts'),
        // CRITICAL: Also invalidate subscription cache
        mutate([`/api/subscriptions/current?organizationId=${currentOrganizationId}`, session?.access_token]),
        mutate(`/api/subscriptions/current?organizationId=${currentOrganizationId}`)
      ]);
      
      // Small delay to allow data to refresh
      setTimeout(() => {
        toast.success('Subscription data refreshed!');
      }, 500);
      
      // Silent refresh - no toast needed since this is called automatically
    } catch (error) {
      console.error("Failed to refresh organization data:", error);
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, mutate, currentOrganizationId, session?.access_token, subscriptionPlan?.id])

  // Auto-refresh when returning from payment success
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const subscriptionSuccess = urlParams.get('subscription');
    const paymentSuccess = urlParams.get('payment');
    
    if (subscriptionSuccess === 'success' || paymentSuccess === 'success') {
      // User returned from successful payment - force immediate cache invalidation
      if (currentOrganizationId) {
        // Import and trigger cache invalidation
        import('@/hooks/useCacheInvalidation').then(({ triggerCacheInvalidation, invalidateSubscriptionCaches }) => {
          triggerCacheInvalidation(currentOrganizationId, 'subscription');
          invalidateSubscriptionCaches(currentOrganizationId);
        });
      }
      
      // Also do the manual refresh as backup
      handleManualRefresh();
      
      // Clean up URL params
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // Show success message
      toast.success('Payment successful! Your plan has been updated.');
    }
  }, [handleManualRefresh, currentOrganizationId]);

  // Auto-refresh subscription data when upgrade dialog closes
  const handleUpgradeDialogChange = (open: boolean) => {
    setUpgradeOpen(open)
    
    // If dialog is closing, refresh data to show any changes
    if (!open) {
      setTimeout(() => {
        handleManualRefresh();
      }, 1000); // Small delay to allow Stripe webhooks to process
    }
  }

  // Count only ACTIVE assets (not total)
  const activeBusinesses = businesses.filter((bm: any) => bm.status === 'active' && bm.is_active !== false).length
  const activeAccounts = accounts.filter((acc: any) => acc.status === 'active' && acc.is_active !== false).length
  const activePixels = pixelData?.pixels?.filter((p: any) => p.isActive && p.status === 'active').length || 0
  const monthlyTopupUsage = topupUsage?.currentUsage || 0
  
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
      const response = await fetch(buildApiUrl(`/api/organizations/${currentOrganizationId}`), {
        method: 'DELETE',
        headers: createAuthHeaders(session!.access_token),
      });

      if (!response.ok) {
        throw new Error("Failed to delete organization");
      }

      toast.success("Organization deleted successfully.");
      // You might want to switch to another organization or redirect to onboarding
      setCurrentOrganizationId('');
      setDeleteOrgOpen(false);
      setConfirmDeleteText("");
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast.error("Failed to delete organization. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    if (!currentOrganizationId || !session?.access_token) return;
    
    try {
      const response = await fetch(buildApiUrl('/api/subscriptions/billing-portal'), {
        method: 'POST',
        headers: createAuthHeaders(session.access_token),
        body: JSON.stringify({
          organization_id: currentOrganizationId,
          return_url: window.location.href
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create billing portal session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error opening billing portal:', error);
      toast.error('Failed to open payment method management. Please try again.');
    }
  };

  const globalLoading = isOrgLoading || isBizLoading || isAccLoading || isPixelLoading || isTopupLoading;

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
                                            {activeBusinesses} / {planLimits.businessManagers === -1 ? '∞' : planLimits.businessManagers}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] h-2 rounded-full transition-all duration-300" 
                    style={{ 
                      width: `${planLimits.businessManagers === -1 ? 0 : Math.min(100, (activeBusinesses / planLimits.businessManagers) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* Ad Accounts Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-foreground">Ad Accounts</Label>
                  <span className="text-sm text-muted-foreground">
                                            {activeAccounts} / {planLimits.adAccounts === -1 ? '∞' : planLimits.adAccounts}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] h-2 rounded-full transition-all duration-300" 
                    style={{ 
                      width: `${planLimits.adAccounts === -1 ? 0 : Math.min(100, (activeAccounts / planLimits.adAccounts) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* Pixels Usage */}
              {shouldEnablePixelLimits() && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-foreground">Facebook Pixels</Label>
                    <span className="text-sm text-muted-foreground">
                      {activePixels} / {planLimits.pixels === -1 ? '∞' : planLimits.pixels}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] h-2 rounded-full transition-all duration-300" 
                      style={{ 
                        width: `${planLimits.pixels === -1 ? 0 : Math.min(100, (activePixels / planLimits.pixels) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Monthly Topup Usage */}
              {shouldEnableTopupLimits() && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-foreground">Monthly Topup Limit</Label>
                    <span className="text-sm text-muted-foreground">
                      ${monthlyTopupUsage.toLocaleString()} / ${planLimits.monthlyTopupLimit === -1 ? '∞' : planLimits.monthlyTopupLimit.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] h-2 rounded-full transition-all duration-300" 
                      style={{ 
                        width: `${planLimits.monthlyTopupLimit === -1 ? 0 : Math.min(100, (monthlyTopupUsage / planLimits.monthlyTopupLimit) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              )}

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
                {planLimits.monthlyTopupLimit && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Monthly Topup Limit</span>
                    <span className="text-foreground font-medium">${planLimits.monthlyTopupLimit.toLocaleString()}</span>
                  </div>
                )}
                {currentPlan.id !== 'free' && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Domains per BM</span>
                    <span className="text-foreground font-medium">{planLimits.pixels ? `${getPlanPricing(currentPlan.id as 'starter' | 'growth' | 'scale')?.domainsPerBm || 0}` : '0'}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="bg-card border border-red-800/30">
            <CardHeader className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-red-400 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    These actions are permanent and cannot be undone.
                  </CardDescription>
                </div>
                <Button variant="destructive" size="sm" onClick={() => setDeleteOrgOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Right Column - Subscription Plan */}
        <div className="space-y-4">
          <Card className="bg-card border border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">Subscription Plan</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Your current plan and billing information
                  </CardDescription>
                </div>

              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Plan Details */}
              <div className={`p-4 ${gradientTokens.light} rounded-lg border ${gradientTokens.border}`}>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-2xl font-bold text-foreground">
                    {currentPlan.id === 'free' ? 'Free' : `$${currentPlan.monthlyPrice}`}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {currentPlan.id === 'free' ? 'Forever' : '/ month'}
                  </span>
                </div>
                <div className="space-y-2">
                  {/* Only show next payment if we have actual subscription data */}
                  {subscriptionData?.current_period_end && currentPlan.id !== 'free' && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Next payment</span>
                      <span className="text-foreground font-medium">
                        {new Date(subscriptionData.current_period_end).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Billing cycle</span>
                    <span className="text-foreground font-medium">
                      {currentPlan.id === 'free' ? 'N/A' : 'Monthly'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={() => handleUpgradeDialogChange(true)}
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
            {billingHistory.length > 0 ? (
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
                        <td className="py-2 px-4 text-sm text-foreground">${invoice.amount?.toFixed(2) || '0.00'}</td>
                        <td className="py-2 px-4">
                          <Badge 
                            className={
                              invoice.status === 'paid' 
                                ? 'bg-green-100 text-green-800 border-green-200' 
                                : invoice.status === 'open'
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : gradientTokens.primary
                            }
                          >
                            {invoice.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No billing history found</p>
                <p className="text-xs mt-1">Your invoices will appear here once you have an active subscription</p>
              </div>
            )}
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
        onOpenChange={handleUpgradeDialogChange}
        redirectToPage={false}
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
              {paymentMethods.length > 0 ? (
                paymentMethods.map((method: any) => (
                  <div key={method.id} className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-5 bg-blue-600 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {method.card?.brand?.toUpperCase() || 'CARD'}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            •••• •••• •••• {method.card?.last4 || '****'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Expires {method.card?.exp_month || '**'}/{method.card?.exp_year || '**'}
                          </div>
                        </div>
                      </div>
                      {method.is_default && (
                        <Badge className={gradientTokens.primary}>Default</Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No payment methods found
                </div>
              )}
              <Button
                variant="outline"
                className="w-full border-border text-foreground hover:bg-accent"
                onClick={handleAddPaymentMethod}
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
