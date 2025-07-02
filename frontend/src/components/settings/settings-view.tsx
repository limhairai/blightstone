"use client"

import { useState } from "react"
import {
  Copy,
  Edit,
  Save,
  X,
  CreditCard,
  Building,
} from "lucide-react"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Badge } from "../ui/badge"
// Note: APP_ORGANIZATIONS import removed - using real organization data instead
import { validateForm, validators, showValidationErrors, showSuccessToast } from "../../lib/form-validation"
import { useSubscription } from "../../hooks/useSubscription"
import { PlanUpgradeDialog } from "../pricing/plan-upgrade-dialog"

export function SettingsView() {
  const [isEditing, setIsEditing] = useState(false)
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  const { currentPlan, usage, billingHistory, isLoading } = useSubscription()
  const [formData, setFormData] = useState({
    businessName: "Test Org",
    businessType: "LLC",
    taxId: "12-3456789",
    website: "https://testorg.com",
    address: "123 Main St, Suite 100",
    city: "San Francisco",
    state: "CA",
    zipCode: "94103",
    phoneNumber: "(123) 456-7890",
  })

  const handleSave = () => {
    // Comprehensive form validation
    const validation = validateForm([
      () => validators.required(formData.businessName, 'Business name'),
      () => validators.minLength(formData.businessName, 2, 'Business name'),
      () => validators.maxLength(formData.businessName, 100, 'Business name'),
      () => validators.select(formData.businessType, 'Business type'),
      () => validators.required(formData.taxId, 'Tax ID'),
      () => formData.website ? validators.url(formData.website, 'Website') : null,
      () => validators.required(formData.address, 'Street address'),
      () => validators.required(formData.city, 'City'),
      () => validators.required(formData.state, 'State'),
      () => validators.required(formData.zipCode, 'ZIP code'),
      () => validators.required(formData.phoneNumber, 'Phone number'),
    ])
    
    if (!validation.isValid) {
      showValidationErrors(validation.errors)
      return
    }

    try {
      // Here you would typically save to your backend
      showSuccessToast("Settings Saved!", "Your organization settings have been updated successfully.")
      setIsEditing(false)
    } catch (error) {
      showValidationErrors([{ field: 'general', message: 'Failed to save settings. Please try again.' }])
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).catch(err => console.error('Failed to copy:', err));
    }
  }



  return (
    <div className="space-y-3">
      <Tabs defaultValue="organization" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="organization" className="flex items-center gap-2 text-xs"><Building className="w-3 h-3" />Organization</TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2 text-xs"><CreditCard className="w-3 h-3" />Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="md:col-span-2">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] rounded-lg flex items-center justify-center text-black font-bold text-base">TO</div>
                    <div>
                      <h2 className="text-lg font-semibold">Test Org</h2>
                      <p className="text-xs text-muted-foreground">Created January 15, 2025</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <Button variant="outline" size="sm" onClick={handleCancel}>
                          <X className="w-3 h-3 mr-1" />Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave} className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-black hover:opacity-90">
                          <Save className="w-3 h-3 mr-1" />Save
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit className="w-3 h-3 mr-1" />Edit
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mt-4 p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Organization ID</Label>
                    <p className="font-mono text-xs mt-1">VrfbN6vMc2MCvaZELhfJ</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard("VrfbN6vMc2MCvaZELhfJ")}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Business Information</CardTitle>
                <CardDescription className="text-xs">Manage your organization&apos;s business details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-3 pt-0">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="businessName" className="text-xs">Business Name <span className="text-red-500">*</span></Label>
                    {isEditing ? (
                      <Input id="businessName" value={formData.businessName} onChange={(e) => setFormData({ ...formData, businessName: e.target.value })} className="h-8 text-xs" />
                    ) : (
                      <div className="p-2 bg-muted/50 rounded-md text-xs">{formData.businessName}</div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="businessType" className="text-xs">Business Type <span className="text-red-500">*</span></Label>
                    {isEditing ? (
                      <Select value={formData.businessType} onValueChange={(value) => setFormData({ ...formData, businessType: value })}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LLC">LLC</SelectItem>
                          <SelectItem value="Corporation">Corporation</SelectItem>
                          <SelectItem value="Partnership">Partnership</SelectItem>
                          <SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="p-2 bg-muted/50 rounded-md text-xs">{formData.businessType}</div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="taxId" className="text-xs">Tax ID (EIN) <span className="text-red-500">*</span></Label>
                    {isEditing ? (
                      <Input id="taxId" value={formData.taxId} onChange={(e) => setFormData({ ...formData, taxId: e.target.value })} className="h-8 text-xs" />
                    ) : (
                      <div className="p-2 bg-muted/50 rounded-md text-xs">{formData.taxId}</div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="website" className="text-xs">Website</Label>
                    {isEditing ? (
                      <Input id="website" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} className="h-8 text-xs" />
                    ) : (
                      <div className="p-2 bg-muted/50 rounded-md text-xs">{formData.website}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Contact Information</CardTitle>
                <CardDescription className="text-xs">Update your organization&apos;s contact details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-3 pt-0">
                <div className="space-y-1">
                  <Label htmlFor="address" className="text-xs">Street Address <span className="text-red-500">*</span></Label>
                  {isEditing ? (
                    <Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="h-8 text-xs" />
                  ) : (
                    <div className="p-2 bg-muted/50 rounded-md text-xs">{formData.address}</div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                                          <Label htmlFor="city" className="text-xs">City <span className="text-red-500">*</span></Label>
                    {isEditing ? (
                      <Input id="city" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="h-8 text-xs" />
                    ) : (
                      <div className="p-2 bg-muted/50 rounded-md text-xs">{formData.city}</div>
                    )}
                  </div>
                  <div className="space-y-1">
                                          <Label htmlFor="state" className="text-xs">State <span className="text-red-500">*</span></Label>
                    {isEditing ? (
                      <Input id="state" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className="h-8 text-xs" />
                    ) : (
                      <div className="p-2 bg-muted/50 rounded-md text-xs">{formData.state}</div>
                    )}
                  </div>
                  <div className="space-y-1">
                                          <Label htmlFor="zipCode" className="text-xs">ZIP Code <span className="text-red-500">*</span></Label>
                    {isEditing ? (
                      <Input id="zipCode" value={formData.zipCode} onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })} className="h-8 text-xs" />
                    ) : (
                      <div className="p-2 bg-muted/50 rounded-md text-xs">{formData.zipCode}</div>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phoneNumber" className="text-xs">Phone Number <span className="text-red-500">*</span></Label>
                  {isEditing ? (
                    <Input id="phoneNumber" value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} className="h-8 text-xs" />
                  ) : (
                    <div className="p-2 bg-muted/50 rounded-md text-xs">{formData.phoneNumber}</div>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="md:col-span-2 bg-red-500/5 border-red-200/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-red-500 text-base">Danger Zone</CardTitle>
                <CardDescription className="text-xs">These actions are irreversible and should be used with caution.</CardDescription>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <Button variant="destructive" size="sm">Leave Organization</Button>
                <p className="text-sm text-muted-foreground">
                  This will permanently delete your organization and all associated data. This action can&apos;t be undone.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>



        <TabsContent value="billing" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Subscription</CardTitle>
                  <CardDescription className="text-xs">Manage your subscription and billing details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-3 pt-0">
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                    <div>
                      <p className="font-medium text-xs">Current Plan</p>
                      <p className="text-xs text-muted-foreground">
                        {isLoading ? 'Loading...' : currentPlan ? `${currentPlan.name} Plan` : 'No Plan'}
                      </p>
                    </div>
                    <Badge className={`text-xs ${
                      currentPlan?.id === 'free' 
                        ? 'bg-blue-100 text-blue-800 border-blue-200' 
                        : 'bg-[#f0e6ff] text-[#6941c6] border-[#e9d7fe]'
                    }`}>
                      {currentPlan?.id === 'free' ? 'Free' : 'Active'}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-xs">Payment Method</h4>
                    <div className="flex items-center gap-3 p-3 rounded-lg border">
                      <div className="h-8 w-12 bg-muted rounded-md flex items-center justify-center">
                        <span className="font-medium text-xs">VISA</span>
                      </div>
                      <div>
                        <p className="font-medium text-xs">Visa ending in 4242</p>
                        <p className="text-xs text-muted-foreground">Expires 12/2025</p>
                      </div>
                      <Button variant="outline" size="sm" className="ml-auto h-6 text-xs">Change</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-xs">Billing History</h4>
                      <Button variant="outline" size="sm" className="h-6 text-xs">View All</Button>
                    </div>
                    <div className="rounded-lg border overflow-hidden">
                      <div className="grid grid-cols-4 gap-3 p-3 border-b bg-muted/50 text-xs font-medium">
                        <div>Date</div>
                        <div>Description</div>
                        <div>Amount</div>
                        <div className="text-right">Invoice</div>
                      </div>
                      {billingHistory && billingHistory.length > 0 ? (
                        billingHistory.slice(0, 2).map((invoice, index) => (
                          <div key={index} className="grid grid-cols-4 gap-3 p-3 text-xs border-t">
                            <div>{new Date(invoice.date).toLocaleDateString()}</div>
                            <div>{invoice.description || `${currentPlan?.name} Plan`}</div>
                            <div>${(invoice.amount / 100).toFixed(2)}</div>
                            <div className="text-right">
                              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">Download</Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="grid grid-cols-4 gap-3 p-3 text-xs border-t">
                          <div colSpan={4} className="col-span-4 text-center text-muted-foreground">
                            No billing history yet
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div>
              <Card>
                <CardHeader className="bg-muted/50 pb-2">
                  <CardTitle className="text-base">
                    {isLoading ? 'Loading...' : currentPlan ? `${currentPlan.name} Plan` : 'No Plan'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 p-3">
                  {currentPlan ? (
                    <>
                      <div className="text-center mb-3">
                        <div className="text-3xl font-bold">
                          {currentPlan.id === 'free' ? 'Free' : `$${currentPlan.monthlyPrice}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {currentPlan.id === 'free' ? 'Forever' : 'per month'}
                        </div>
                        {currentPlan.id !== 'free' && (
                          <div className="text-xs text-muted-foreground mt-1">
                            + {currentPlan.adSpendFee}% ad spend fee
                          </div>
                        )}
                      </div>
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center">
                          <Check className="h-3 w-3 mr-2 text-primary" />
                          <span className="text-xs">
                            {currentPlan.maxTeamMembers === -1 ? 'Unlimited' : currentPlan.maxTeamMembers} team members
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Check className="h-3 w-3 mr-2 text-primary" />
                          <span className="text-xs">
                            {currentPlan.maxBusinesses === -1 ? 'Unlimited' : currentPlan.maxBusinesses} business managers
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Check className="h-3 w-3 mr-2 text-primary" />
                          <span className="text-xs">
                            {currentPlan.maxAdAccounts === -1 ? 'Unlimited' : currentPlan.maxAdAccounts} ad accounts
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Check className="h-3 w-3 mr-2 text-primary" />
                          <span className="text-xs">Standard support</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Button 
                          className="w-full bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black" 
                          size="sm"
                          onClick={() => setUpgradeDialogOpen(true)}
                        >
                          {currentPlan?.id === 'free' ? 'Choose Plan' : 'Upgrade Plan'}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-xs text-muted-foreground mb-3">No subscription plan</p>
                      <Button 
                        className="w-full bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black" 
                        size="sm"
                        onClick={() => setUpgradeDialogOpen(true)}
                      >
                        Choose Plan
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <PlanUpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
      />
    </div>
  )
} 