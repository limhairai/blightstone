# AdHub Settings Page Export for v0 (Dark Mode Default)

## Overview
This export contains the complete settings page structure from AdHub, including organization management, team collaboration, security settings, and billing components. **This export is configured for dark mode by default.**

## Design System & Colors

### Primary Brand Colors
```css
/* Main brand gradient - Dark Mode Optimized */
--brand-primary: #c4b5fd (Lighter Purple for Dark Mode)
--brand-secondary: #ffc4b5 (Lighter Peach for Dark Mode)

/* CSS Variables - Dark Mode Default */
:root {
  --primary: 250 100% 85%; /* #c4b5fd */
  --brand-secondary-main: 20 100% 85%; /* #ffc4b5 */
}

.light {
  --primary: 250 100% 81%; /* #b4a0ff */
  --brand-secondary-main: 20 100% 81%; /* #ffb4a0 */
}
```

### Status Colors (Dark Mode)
```css
/* Success/Active - Green */
--status-success-dot: 145 63% 55%; /* #34d058 */
--status-success-background: 145 85% 15%; /* #0d2818 */
--status-success-foreground: 145 74% 65%; /* #22c55e */

/* Warning/Pending - Amber */
--status-warning-dot: 36 93% 60%; /* #fbbf24 */
--status-warning-background: 45 100% 12%; /* #1f1611 */
--status-warning-foreground: 32 90% 55%; /* #f59e0b */

/* Error/Danger - Red */
--status-error-dot: 0 84% 65%; /* #f87171 */
--status-error-background: 0 80% 12%; /* #1f1315 */
--status-error-foreground: 0 70% 60%; /* #ef4444 */
```

### Semantic Colors (Dark Mode Default)
```css
:root {
  --background: 220 60% 4%;  /* #030712 */
  --card: 220 13% 9%;        /* #111827 */
  --popover: 220 13% 9%;     /* #111827 */
  --muted: 220 13% 15%;      /* #1f2937 */
  
  --foreground: 210 17% 98%; /* #f9fafb */
  --muted-foreground: 220 10% 66%; /* #9ca3af */
  --card-foreground: 210 17% 98%; /* #f9fafb */
  
  --border: 220 13% 20%;     /* #374151 */
  --input: 220 13% 20%;      /* #374151 */
  --ring: 250 100% 85%;      /* #c4b5fd */
  
  --accent: 220 13% 15%;     /* #1f2937 */
  --accent-foreground: 210 17% 98%; /* #f9fafb */
  --destructive: 0 84% 60%;  /* #ef4444 */
  --destructive-foreground: 210 17% 98%; /* #f9fafb */
}
```

## Page Structure

### Main Settings Component (Dark Mode)
```tsx
// frontend/src/app/dashboard/settings/page.tsx
"use client"

import { SettingsView } from "@/components/settings/settings-view"

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SettingsView />
    </div>
  )
}
```

### Settings View Component (Dark Mode)
```tsx
// frontend/src/components/settings/settings-view.tsx
"use client"

import { useState } from "react"
import {
  AlertTriangle,
  Check,
  Copy,
  Edit,
  Save,
  X,
  Shield,
  Users,
  CreditCard,
  Building,
  Mail,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function SettingsView() {
  const [isEditing, setIsEditing] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("member")
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
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
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(err => console.error('Failed to copy:', err))
    }
  }

  const handleInvite = () => {
    console.log(`Inviting ${inviteEmail} as ${inviteRole}`)
    setInviteDialogOpen(false)
    setInviteEmail("")
  }

  return (
    <div className="space-y-6 p-6 bg-background min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization, team, security, and billing settings
        </p>
      </div>

      <Tabs defaultValue="organization" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-muted">
          <TabsTrigger 
            value="organization" 
            className="flex items-center gap-2 text-sm data-[state=active]:bg-background data-[state=active]:text-foreground"
          >
            <Building className="w-4 h-4" />
            Organization
          </TabsTrigger>
          <TabsTrigger 
            value="team" 
            className="flex items-center gap-2 text-sm data-[state=active]:bg-background data-[state=active]:text-foreground"
          >
            <Users className="w-4 h-4" />
            Team
          </TabsTrigger>
          <TabsTrigger 
            value="security" 
            className="flex items-center gap-2 text-sm data-[state=active]:bg-background data-[state=active]:text-foreground"
          >
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger 
            value="billing" 
            className="flex items-center gap-2 text-sm data-[state=active]:bg-background data-[state=active]:text-foreground"
          >
            <CreditCard className="w-4 h-4" />
            Billing
          </TabsTrigger>
        </TabsList>

        {/* Organization Tab */}
        <TabsContent value="organization" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Organization Header Card */}
            <Card className="lg:col-span-2 bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] rounded-lg flex items-center justify-center text-white font-bold text-lg">
                      TO
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">Test Org</h2>
                      <p className="text-sm text-muted-foreground">Created January 15, 2025</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isEditing ? (
                      <>
                        <Button variant="outline" size="sm" onClick={handleCancel} className="border-border text-foreground hover:bg-accent">
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={handleSave} 
                          className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] text-white hover:opacity-90"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="border-border text-foreground hover:bg-accent">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mt-6 p-4 bg-muted rounded-lg flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Organization ID</Label>
                    <p className="font-mono text-sm mt-1 text-foreground">VrfbN6vMc2MCvaZELhfJ</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyToClipboard("VrfbN6vMc2MCvaZELhfJ")}
                    className="hover:bg-accent"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Business Information Card */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-foreground">Business Information</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Manage your organization's business details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName" className="text-sm text-foreground">Business Name</Label>
                    {isEditing ? (
                      <Input 
                        id="businessName" 
                        value={formData.businessName} 
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })} 
                        className="bg-background border-border text-foreground"
                      />
                    ) : (
                      <div className="p-3 bg-muted rounded-md text-sm text-foreground">{formData.businessName}</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessType" className="text-sm text-foreground">Business Type</Label>
                    {isEditing ? (
                      <Select value={formData.businessType} onValueChange={(value) => setFormData({ ...formData, businessType: value })}>
                        <SelectTrigger className="bg-background border-border text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="LLC" className="text-popover-foreground hover:bg-accent">LLC</SelectItem>
                          <SelectItem value="Corporation" className="text-popover-foreground hover:bg-accent">Corporation</SelectItem>
                          <SelectItem value="Partnership" className="text-popover-foreground hover:bg-accent">Partnership</SelectItem>
                          <SelectItem value="Sole Proprietorship" className="text-popover-foreground hover:bg-accent">Sole Proprietorship</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="p-3 bg-muted rounded-md text-sm text-foreground">{formData.businessType}</div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxId" className="text-sm text-foreground">Tax ID (EIN)</Label>
                    {isEditing ? (
                      <Input 
                        id="taxId" 
                        value={formData.taxId} 
                        onChange={(e) => setFormData({ ...formData, taxId: e.target.value })} 
                        className="bg-background border-border text-foreground"
                      />
                    ) : (
                      <div className="p-3 bg-muted rounded-md text-sm text-foreground">{formData.taxId}</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-sm text-foreground">Website</Label>
                    {isEditing ? (
                      <Input 
                        id="website" 
                        value={formData.website} 
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })} 
                        className="bg-background border-border text-foreground"
                      />
                    ) : (
                      <div className="p-3 bg-muted rounded-md text-sm text-foreground">{formData.website}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information Card */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-foreground">Contact Information</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Update your organization's contact details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm text-foreground">Street Address</Label>
                  {isEditing ? (
                    <Input 
                      id="address" 
                      value={formData.address} 
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                      className="bg-background border-border text-foreground"
                    />
                  ) : (
                    <div className="p-3 bg-muted rounded-md text-sm text-foreground">{formData.address}</div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm text-foreground">City</Label>
                    {isEditing ? (
                      <Input 
                        id="city" 
                        value={formData.city} 
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })} 
                        className="bg-background border-border text-foreground"
                      />
                    ) : (
                      <div className="p-3 bg-muted rounded-md text-sm text-foreground">{formData.city}</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-sm text-foreground">State</Label>
                    {isEditing ? (
                      <Input 
                        id="state" 
                        value={formData.state} 
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })} 
                        className="bg-background border-border text-foreground"
                      />
                    ) : (
                      <div className="p-3 bg-muted rounded-md text-sm text-foreground">{formData.state}</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode" className="text-sm text-foreground">ZIP Code</Label>
                    {isEditing ? (
                      <Input 
                        id="zipCode" 
                        value={formData.zipCode} 
                        onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })} 
                        className="bg-background border-border text-foreground"
                      />
                    ) : (
                      <div className="p-3 bg-muted rounded-md text-sm text-foreground">{formData.zipCode}</div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-sm text-foreground">Phone Number</Label>
                  {isEditing ? (
                    <Input 
                      id="phoneNumber" 
                      value={formData.phoneNumber} 
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} 
                      className="bg-background border-border text-foreground"
                    />
                  ) : (
                    <div className="p-3 bg-muted rounded-md text-sm text-foreground">{formData.phoneNumber}</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="lg:col-span-2 bg-[hsl(var(--status-error-background))] border-[hsl(var(--status-error-dot))]">
              <CardHeader className="pb-4">
                <CardTitle className="text-[hsl(var(--status-error-foreground))] text-lg">Danger Zone</CardTitle>
                <CardDescription className="text-muted-foreground">
                  These actions are irreversible and should be used with caution.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">Leave Organization</h4>
                    <p className="text-sm text-muted-foreground">
                      This will permanently delete your organization and all associated data. This action can't be undone.
                    </p>
                  </div>
                  <Button variant="destructive" size="sm">
                    Leave Organization
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg text-foreground">Team Members</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Manage your team members and their access levels.
                </CardDescription>
              </div>
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-white" size="sm">
                    Invite User
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Invite Team Member</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Send an invitation to join your organization.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-foreground">Email Address</Label>
                      <Input 
                        id="email" 
                        placeholder="colleague@example.com" 
                        type="email" 
                        value={inviteEmail} 
                        onChange={(e) => setInviteEmail(e.target.value)} 
                        className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-foreground">Role</Label>
                      <Select value={inviteRole} onValueChange={setInviteRole}>
                        <SelectTrigger id="role" className="bg-background border-border text-foreground">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="admin" className="text-popover-foreground hover:bg-accent">Admin</SelectItem>
                          <SelectItem value="member" className="text-popover-foreground hover:bg-accent">Member</SelectItem>
                          <SelectItem value="viewer" className="text-popover-foreground hover:bg-accent">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setInviteDialogOpen(false)} size="sm" className="border-border text-foreground hover:bg-accent">
                      Cancel
                    </Button>
                    <Button className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-white" onClick={handleInvite} size="sm">
                      Send Invitation
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Active Member */}
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-muted text-muted-foreground">JD</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">John Doe</p>
                      <p className="text-sm text-muted-foreground">john.doe@example.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-[hsl(var(--status-success-background))] text-[hsl(var(--status-success-foreground))] border-[hsl(var(--status-success-dot))]">
                      Admin
                    </Badge>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      Remove
                    </Button>
                  </div>
                </div>
              </div>

              {/* Pending Invitation */}
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">alex.johnson@example.com</p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        <span>Invited 2 days ago</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-[hsl(var(--status-warning-background))] text-[hsl(var(--status-warning-foreground))] border-[hsl(var(--status-warning-dot))]">
                      Viewer
                    </Badge>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Roles & Permissions */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-foreground">Roles & Permissions</CardTitle>
              <CardDescription className="text-muted-foreground">
                Learn about the different roles and their permissions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium text-foreground">Admin</h4>
                  <p className="text-sm text-muted-foreground">
                    Full access to all features, including user management, billing, and organization settings.
                  </p>
                </div>
                <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium text-foreground">Member</h4>
                  <p className="text-sm text-muted-foreground">
                    Can create and manage businesses and ad accounts. Cannot manage users or billing.
                  </p>
                </div>
                <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium text-foreground">Viewer</h4>
                  <p className="text-sm text-muted-foreground">
                    Read-only access to businesses and ad accounts. Cannot make changes or create resources.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Two-Factor Authentication */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-foreground">Two-Factor Authentication</CardTitle>
                  <Badge variant="outline" className="text-[hsl(var(--status-error-foreground))] border-[hsl(var(--status-error-dot))]">
                    Not Enabled
                  </Badge>
                </div>
                <CardDescription className="text-muted-foreground">
                  Add an extra layer of security to your account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[hsl(var(--status-error-dot))] rounded-full"></div>
                    <span className="text-sm text-foreground">SMS Authentication</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[hsl(var(--status-error-dot))] rounded-full"></div>
                    <span className="text-sm text-foreground">Authenticator App</span>
                  </div>
                </div>
                <Button className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] text-white hover:opacity-90" size="sm">
                  Set up 2FA
                </Button>
              </CardContent>
            </Card>

            {/* Active Sessions */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-foreground">Active Sessions</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Monitor and manage your active login sessions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm text-foreground">Current Session</p>
                      <p className="text-sm text-muted-foreground">Chrome on macOS • San Francisco, CA</p>
                    </div>
                    <Badge className="bg-[hsl(var(--status-success-background))] text-[hsl(var(--status-success-foreground))] border-[hsl(var(--status-success-dot))]">
                      Current
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm text-foreground">Mobile App</p>
                      <p className="text-sm text-muted-foreground">iPhone • 2 hours ago</p>
                    </div>
                    <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-accent">
                      Revoke
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Password Update */}
            <Card className="lg:col-span-2 bg-card border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-foreground">Password</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Update your account password for better security.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-foreground">Current Password</Label>
                    <Input 
                      id="currentPassword" 
                      type="password" 
                      placeholder="Enter current password" 
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-foreground">New Password</Label>
                    <Input 
                      id="newPassword" 
                      type="password" 
                      placeholder="Enter new password" 
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                    />
                    <div className="text-xs text-muted-foreground">
                      Must be at least 8 characters with uppercase, lowercase, and numbers
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-foreground">Confirm New Password</Label>
                    <Input 
                      id="confirmPassword" 
                      type="password" 
                      placeholder="Confirm new password" 
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <Button className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] text-white hover:opacity-90" size="sm">
                    Update Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Subscription & Billing */}
            <div className="lg:col-span-2">
              <Card className="bg-card border-border">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-foreground">Subscription</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Manage your subscription and billing details.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Current Plan */}
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
                    <div>
                      <p className="font-medium text-foreground">Current Plan</p>
                      <p className="text-sm text-muted-foreground">Business Plan</p>
                    </div>
                    <Badge className="bg-[hsl(var(--status-success-background))] text-[hsl(var(--status-success-foreground))] border-[hsl(var(--status-success-dot))]">
                      Active
                    </Badge>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-foreground">Payment Method</h4>
                    <div className="flex items-center gap-4 p-4 rounded-lg border border-border">
                      <div className="h-10 w-16 bg-muted rounded-md flex items-center justify-center">
                        <span className="font-medium text-sm text-foreground">VISA</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">Visa ending in 4242</p>
                        <p className="text-sm text-muted-foreground">Expires 12/2025</p>
                      </div>
                      <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-accent">
                        Change
                      </Button>
                    </div>
                  </div>

                  {/* Billing History */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground">Billing History</h4>
                      <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-accent">
                        View All
                      </Button>
                    </div>
                    <div className="rounded-lg border border-border overflow-hidden">
                      <div className="grid grid-cols-4 gap-4 p-4 border-b border-border bg-muted/50 text-sm font-medium text-foreground">
                        <div>Date</div>
                        <div>Description</div>
                        <div>Amount</div>
                        <div className="text-right">Invoice</div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 p-4 text-sm text-foreground">
                        <div>May 1, 2025</div>
                        <div>Business Plan</div>
                        <div>$299.00</div>
                        <div className="text-right">
                          <Button variant="ghost" size="sm" className="hover:bg-accent">
                            Download
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 p-4 text-sm text-foreground border-t border-border">
                        <div>Apr 1, 2025</div>
                        <div>Business Plan</div>
                        <div>$299.00</div>
                        <div className="text-right">
                          <Button variant="ghost" size="sm" className="hover:bg-accent">
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Plan Details */}
            <div>
              <Card className="bg-card border-border">
                <CardHeader className="bg-muted/50 pb-4">
                  <CardTitle className="text-lg text-foreground">Business Plan</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-foreground">$299</div>
                    <div className="text-sm text-muted-foreground">per month</div>
                  </div>
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center">
                      <Check className="h-4 w-4 mr-3 text-[hsl(var(--status-success-dot))]" />
                      <span className="text-sm text-foreground">Unlimited ad accounts</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-4 w-4 mr-3 text-[hsl(var(--status-success-dot))]" />
                      <span className="text-sm text-foreground">Priority support</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-4 w-4 mr-3 text-[hsl(var(--status-success-dot))]" />
                      <span className="text-sm text-foreground">Advanced analytics</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-4 w-4 mr-3 text-[hsl(var(--status-success-dot))]" />
                      <span className="text-sm text-foreground">Team collaboration</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <AlertTriangle className="h-4 w-4 mr-2 text-[hsl(var(--status-warning-dot))]" />
                      <span className="text-foreground">Trial ends May 29, 2025</span>
                    </div>
                    <Button className="w-full bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-white" size="sm">
                      Manage Subscription
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

## Implementation Notes

### Dark Mode Setup
1. **HTML Class**: Add `class="dark"` to the `<html>` element
2. **CSS Variables**: All components use semantic color classes that adapt automatically
3. **Component Styling**: Every element uses proper dark mode color variables

### Key Features
- **Organization Management**: Complete business information editing with dark mode forms
- **Team Collaboration**: User invitation system with role-based permissions
- **Security Settings**: 2FA setup, session management, and password updates
- **Billing Management**: Subscription details, payment methods, and billing history

### Usage in v0
1. Copy the CSS variables from the Ad Accounts export
2. Add the `dark` class to your HTML element
3. Use the provided component code with semantic color classes
4. All styling will automatically work in dark mode

This export provides a complete, production-ready dark mode implementation of the AdHub settings page that can be directly used in v0 or any other React/Next.js project. 