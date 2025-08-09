"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, Loader2, Building2, Plus, X } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { validateBusinessManagerApplicationForm, showValidationErrors } from "@/lib/form-validation"
import { useSubscription } from "@/hooks/useSubscription"
import { normalizeDomain, isValidDomain, hasDuplicateDomains, removeDuplicateDomains, isSubdomain, getBaseDomain, SUBDOMAIN_POLICY } from "@/lib/utils/domain-utils"
// import { refreshAfterBusinessManagerChange } from "@/lib/subscription-utils" // File not found
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { mutate } from 'swr'
import { getPlanPricing, getPageLimit } from '@/lib/config/pricing-config'
import { invalidateAssetCache } from '@/lib/cache-invalidation'
// import { PageSelector } from '@/components/pages/page-selector' // Removed - using new page creation flow

interface ApplyForBmDialogProps {
  children: React.ReactNode
  onSuccess?: () => void
}

export function ApplyForBmDialog({ children, onSuccess }: ApplyForBmDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { session } = useAuth()
  const { subscriptionData, usage, checkLimit, currentPlan } = useSubscription()
  const { currentOrganizationId } = useOrganizationStore()

  // Check if organization is on free plan or cannot request assets
  const isOnFreePlan = subscriptionData?.free || subscriptionData?.subscriptionStatus === 'free'
  const canRequestAssets = subscriptionData?.canRequestAssets !== false
  const subscriptionMessage = subscriptionData?.message
  
  // Check if user has reached business manager limit
  // Use real-time data fetch to ensure accuracy
  const [realTimeBMCount, setRealTimeBMCount] = useState<number | null>(null)
  
  useEffect(() => {
    if (open && currentOrganizationId && session?.access_token) {
      const fetchRealTimeBMCount = async () => {
        try {
          const response = await fetch(`/api/organizations/${currentOrganizationId}/active-bm-count`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            setRealTimeBMCount(data.totalBMs)
          }
        } catch (error) {
          console.error('Failed to fetch real-time BM count:', error)
        }
      }
      
      fetchRealTimeBMCount()
    }
  }, [open, currentOrganizationId, session?.access_token])

  const currentBMCount = realTimeBMCount ?? (usage?.businessManagers || 0)
  const canAddMoreBMs = checkLimit('businessManagers', currentBMCount)
  const hasReachedBMLimit = !canAddMoreBMs && !isOnFreePlan

  // Get domain and page limits from pricing config
  const planId = currentPlan?.id as 'starter' | 'growth' | 'scale' | undefined
  const planLimits = planId ? getPlanPricing(planId) : null
  const maxDomainsPerBm = planLimits?.domainsPerBm || 2
  const maxPagesPerBm = getPageLimit(planId)

  // Domain management functions
  const addDomainField = () => {
    if (formData.domains.length < maxDomainsPerBm) {
      setFormData(prev => ({
        ...prev,
        domains: [...prev.domains, ""]
      }))
    }
  }

  const removeDomainField = (index: number) => {
    if (formData.domains.length > 1) {
      setFormData(prev => ({
        ...prev,
        domains: prev.domains.filter((_, i) => i !== index)
      }))
    }
  }

  const updateDomain = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      domains: prev.domains.map((domain, i) => i === index ? value : domain)
    }))
  }

  // Page management functions
  const addPageField = () => {
    // If maxPagesPerBm is null, it means unlimited pages (Plus plan)
    if (maxPagesPerBm === null || formData.pages.length < maxPagesPerBm) {
      setFormData(prev => ({
        ...prev,
        pages: [...prev.pages, { name: "" }]
      }))
    }
  }

  const removePageField = (index: number) => {
    if (formData.pages.length > 1) {
      setFormData(prev => ({
        ...prev,
        pages: prev.pages.filter((_, i) => i !== index)
      }))
    }
  }

  const updatePageName = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      pages: prev.pages.map((page, i) => i === index ? { name: value } : page)
    }))
  }

  // Domain validation with normalization
  const validateDomainInput = (input: string) => {
    if (!input.trim()) return { isValid: false, error: 'Domain cannot be empty' }
    
    const normalized = normalizeDomain(input)
    if (!isValidDomain(normalized)) {
      return { isValid: false, error: 'Invalid domain format' }
    }
    
    return { isValid: true, normalized }
  }

  const [formData, setFormData] = useState({
    domains: [""] as string[], // Array of domains based on plan limits
    pages: [{ name: "" }] as { name: string }[], // Array of pages to create
  })

  const resetForm = () => {
    setFormData({
      domains: [""],
      pages: [{ name: "" }],
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check subscription status before allowing submission
    if (isOnFreePlan || !canRequestAssets) {
      toast.error("Upgrade Required", {
        description: subscriptionMessage || "Please upgrade your plan to apply for business managers.",
      });
      return;
    }

    // Check business manager limit
    if (hasReachedBMLimit) {
      toast.error("Plan Limit Reached", {
        description: "You have reached the maximum number of business managers for your current plan. Please upgrade to add more business managers.",
      });
      return;
    }

    // No need to validate primary website since we're using domains directly

    // Validate domains - filter out empty domains and check for duplicates
    const validDomains = formData.domains.filter(domain => domain.trim())
    if (validDomains.length === 0) {
      toast.error('At least one domain is required');
      return;
    }

    // Validate pages
    const validPages = formData.pages.filter(page => page.name.trim())
    if (validPages.length === 0) {
      toast.error('At least one Facebook page name is required');
      return;
    }

    // Validate and normalize domains
    const processedDomains: string[] = []
    const warnings: string[] = []
    
    for (const domain of validDomains) {
      const validation = validateDomainInput(domain)
      if (!validation.isValid) {
        toast.error(`Invalid domain "${domain}": ${validation.error}`)
        return
      }
      
      const normalized = validation.normalized!
      
      // Check for subdomains and warn
      const existingBaseDomains = processedDomains.map(getBaseDomain)
      const currentBaseDomain = getBaseDomain(normalized)
      
      if (existingBaseDomains.includes(currentBaseDomain) && !processedDomains.includes(normalized)) {
        warnings.push(`"${domain}" and another domain share the same base domain (${currentBaseDomain})`)
      }
      
      processedDomains.push(normalized)
    }
    
    // Check for duplicates using normalized domains
    if (hasDuplicateDomains(processedDomains)) {
      toast.error('Duplicate domains detected (www, https, and paths are ignored)')
      return
    }
    
    // Show warnings if any
    if (warnings.length > 0) {
      toast.warning(warnings.join('. '))
    }

    setIsSubmitting(true)
    try {
      // Get current organization
      const orgsResponse = await fetch('/api/organizations', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })

      if (!orgsResponse.ok) {
        throw new Error('Failed to fetch organization')
      }

      const orgsData = await orgsResponse.json()
      const organizationId = orgsData.organizations?.[0]?.organization_id

      if (!organizationId) {
        throw new Error('No organization found')
      }

      // Submit application
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          type: 'business_manager',
          website_url: processedDomains[0], // Use first normalized domain as primary website
          domains: processedDomains, // Include the normalized domains
          pages_to_create: validPages.map(page => ({ name: page.name.trim() })), // Pages to create
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit application')
      }

      const result = await response.json()

      // Show success toast
      toast.success("Application submitted successfully!", {
        description: "Your business manager application is now under review."
      })
      
      // Refresh the data
      if (currentOrganizationId) {
        invalidateAssetCache(currentOrganizationId)
      }
      
      if (onSuccess) {
        onSuccess()
      }
      
      setOpen(false)

    } catch (error) {
      console.error('Error submitting application:', error)
      toast.error("Failed to submit application", {
        description: "Please try again or contact support if the issue persists."
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
              <Check className="w-6 h-6 text-foreground" />
            </div>
            <h3 className="text-base font-medium text-foreground mb-1">Application Submitted</h3>
            <p className="text-sm text-muted-foreground">
              Your business manager application has been submitted for review.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            Apply for Business Manager
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Submit your business information for review and approval.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-foreground">
                Domains for this Business Manager ({formData.domains.filter(d => d.trim()).length}/{maxDomainsPerBm})
              </Label>
              {formData.domains.length < maxDomainsPerBm && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDomainField}
                  className="h-8 px-2 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Domain
                </Button>
              )}
            </div>
            
            <div className="space-y-2">
              {formData.domains.map((domain, index) => {
                const validation = domain.trim() ? validateDomainInput(domain) : null
                const normalized = validation?.normalized
                const isSubdomain = normalized ? normalized.split('.').length > 2 : false
                
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          type="text"
                          value={domain}
                          onChange={(e) => updateDomain(index, e.target.value)}
                          placeholder={index === 0 ? "example.com (primary domain)" : "additional-domain.com (optional)"}
                          className={`bg-background border-border text-foreground ${
                            validation && !validation.isValid ? 'border-red-500' : ''
                          }`}
                        />
                        {validation && !validation.isValid && (
                          <p className="text-xs text-red-500 mt-1">{validation.error}</p>
                        )}
                      </div>
                      {formData.domains.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeDomainField(index)}
                          className="h-10 px-2 text-red-500 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            
            <p className="text-xs text-muted-foreground">
              Add all domains you plan to promote with this Business Manager. Your {planId || 'current'} plan allows up to {maxDomainsPerBm} domains per BM.
            </p>
          </div>

          {/* Facebook Pages to Create */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-foreground">
                Pages for this Business Manager ({formData.pages.filter(p => p.name.trim()).length}/{maxPagesPerBm === null ? '∞' : maxPagesPerBm})
              </Label>
              {(maxPagesPerBm === null || formData.pages.length < maxPagesPerBm) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPageField}
                  className="h-8 px-2 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Page
                </Button>
              )}
            </div>
            
            <div className="space-y-2">
              {formData.pages.map((page, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      type="text"
                      value={page.name}
                      onChange={(e) => updatePageName(index, e.target.value)}
                      placeholder={`Facebook Page ${index + 1} name`}
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                      required={index === 0} // First page is required
                    />
                  </div>
                  {formData.pages.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePageField(index)}
                      className="h-10 px-2 text-red-500 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            <p className="text-xs text-muted-foreground">
              We'll create these Facebook pages for you once your Business Manager is approved. Your {planId || 'current'} plan allows up to {maxPagesPerBm} pages per BM.
            </p>
          </div>

          {(isOnFreePlan || !canRequestAssets || hasReachedBMLimit) ? (
            <div className="bg-muted/50 p-4 rounded-lg border border-border">
              <h4 className="text-sm font-medium text-foreground mb-2">
                {hasReachedBMLimit ? "Plan Limit Reached" : "Upgrade Required"}
              </h4>
              <p className="text-xs text-muted-foreground">
                {hasReachedBMLimit 
                  ? "You have reached the maximum number of business managers for your current plan. Please upgrade to add more business managers."
                  : (subscriptionMessage || "Business manager applications are available on paid plans only. Please upgrade your plan to continue.")
                }
              </p>
            </div>
          ) : (
            <div className="bg-muted/30 p-4 rounded-lg border border-border">
              <h4 className="text-sm font-medium text-foreground mb-2">What happens next?</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Your application will be reviewed within 1-3 business days</li>
                <li>• Once approved, we&apos;ll create your Business Manager and Facebook pages</li>
                <li>• You&apos;ll receive your Business Manager ID for manual sharing</li>
                <li>• Your new Facebook pages will be automatically linked to your BM</li>
                <li>• You can then start creating ad accounts and campaigns</li>
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
              className="bg-background border-border text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isOnFreePlan || !canRequestAssets || hasReachedBMLimit}
              className="bg-primary text-black hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 