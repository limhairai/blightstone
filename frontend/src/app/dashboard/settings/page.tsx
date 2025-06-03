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

export default function SettingsPage() {
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
        navigator.clipboard.writeText(text).catch(err => console.error('Failed to copy:', err));
    }
  }

  const handleInvite = () => {
    console.log(`Inviting ${inviteEmail} as ${inviteRole}`);
    setInviteDialogOpen(false)
    setInviteEmail("")
  }

  return (
    // AppShell is provided by layout.tsx
    <div className="container py-6 space-y-6 max-w-7xl">
      {/* Removed the h1 "Settings" from here as TopNavigation in AppShell should provide it */}
      <Tabs defaultValue="organization" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="organization" className="flex items-center gap-2"><Building className="w-4 h-4" />Organization</TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2"><Users className="w-4 h-4" />Team</TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2"><Shield className="w-4 h-4" />Security</TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2"><CreditCard className="w-4 h-4" />Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="md:col-span-2"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] rounded-lg flex items-center justify-center text-black font-bold text-lg">TO</div><div><h2 className="text-xl font-semibold">Test Org</h2><p className="text-sm text-muted-foreground">Created January 15, 2025</p></div></div><div className="flex items-center gap-2">{isEditing ? (<><Button variant="outline" size="sm" onClick={handleCancel}><X className="w-4 h-4 mr-2" />Cancel</Button><Button size="sm" onClick={handleSave} className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-black hover:opacity-90"><Save className="w-4 h-4 mr-2" />Save</Button></>) : (<Button variant="outline" size="sm" onClick={() => setIsEditing(true)}><Edit className="w-4 h-4 mr-2" />Edit</Button>)}</div></div><div className="mt-6 p-4 bg-muted/50 rounded-lg flex items-center justify-between"><div><Label className="text-sm font-medium text-muted-foreground">Organization ID</Label><p className="font-mono text-sm mt-1">VrfbN6vMc2MCvaZELhfJ</p></div><Button variant="ghost" size="sm" onClick={() => copyToClipboard("VrfbN6vMc2MCvaZELhfJ")}><Copy className="w-4 h-4" /></Button></div></CardContent></Card>
            <Card><CardHeader><CardTitle>Business Information</CardTitle><CardDescription>Manage your organization&apos;s business details.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="businessName">Business Name</Label>{isEditing ? (<Input id="businessName" value={formData.businessName} onChange={(e) => setFormData({ ...formData, businessName: e.target.value })} />) : (<div className="p-3 bg-muted/50 rounded-md text-sm">{formData.businessName}</div>)}</div><div className="space-y-2"><Label htmlFor="businessType">Business Type</Label>{isEditing ? (<Select value={formData.businessType} onValueChange={(value) => setFormData({ ...formData, businessType: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="LLC">LLC</SelectItem><SelectItem value="Corporation">Corporation</SelectItem><SelectItem value="Partnership">Partnership</SelectItem><SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem></SelectContent></Select>) : (<div className="p-3 bg-muted/50 rounded-md text-sm">{formData.businessType}</div>)}</div></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="taxId">Tax ID (EIN)</Label>{isEditing ? (<Input id="taxId" value={formData.taxId} onChange={(e) => setFormData({ ...formData, taxId: e.target.value })} />) : (<div className="p-3 bg-muted/50 rounded-md text-sm">{formData.taxId}</div>)}</div><div className="space-y-2"><Label htmlFor="website">Website</Label>{isEditing ? (<Input id="website" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} />) : (<div className="p-3 bg-muted/50 rounded-md text-sm">{formData.website}</div>)}</div></div></CardContent></Card>
            <Card><CardHeader><CardTitle>Contact Information</CardTitle><CardDescription>Update your organization&apos;s contact details.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor="address">Street Address</Label>{isEditing ? (<Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />) : (<div className="p-3 bg-muted/50 rounded-md text-sm">{formData.address}</div>)}</div><div className="grid grid-cols-3 gap-4"><div className="space-y-2"><Label htmlFor="city">City</Label>{isEditing ? (<Input id="city" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />) : (<div className="p-3 bg-muted/50 rounded-md text-sm">{formData.city}</div>)}</div><div className="space-y-2"><Label htmlFor="state">State</Label>{isEditing ? (<Input id="state" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />) : (<div className="p-3 bg-muted/50 rounded-md text-sm">{formData.state}</div>)}</div><div className="space-y-2"><Label htmlFor="zipCode">ZIP Code</Label>{isEditing ? (<Input id="zipCode" value={formData.zipCode} onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })} />) : (<div className="p-3 bg-muted/50 rounded-md text-sm">{formData.zipCode}</div>)}</div></div><div className="space-y-2"><Label htmlFor="phoneNumber">Phone Number</Label>{isEditing ? (<Input id="phoneNumber" value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} />) : (<div className="p-3 bg-muted/50 rounded-md text-sm">{formData.phoneNumber}</div>)}</div></CardContent></Card>
            <Card className="md:col-span-2 bg-red-500/5 border-red-200/20"><CardHeader><CardTitle className="text-red-500">Danger Zone</CardTitle><CardDescription>These actions are irreversible and should be used with caution.</CardDescription></CardHeader><CardContent><Button variant="destructive">Leave Organization</Button></CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Team Members</CardTitle><CardDescription>Manage your team members and their access levels.</CardDescription></div><Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}><DialogTrigger asChild><Button className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black">Invite User</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Invite Team Member</DialogTitle><DialogDescription>Send an invitation to join your organization.</DialogDescription></DialogHeader><div className="space-y-4 py-4"><div className="space-y-2"><Label htmlFor="email">Email Address</Label><Input id="email" placeholder="colleague@example.com" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="role">Role</Label><Select value={inviteRole} onValueChange={setInviteRole}><SelectTrigger id="role"><SelectValue placeholder="Select a role" /></SelectTrigger><SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="member">Member</SelectItem><SelectItem value="viewer">Viewer</SelectItem></SelectContent></Select></div></div><DialogFooter><Button variant="outline" onClick={() => setInviteDialogOpen(false)}>Cancel</Button><Button className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black" onClick={handleInvite}>Send Invitation</Button></DialogFooter></DialogContent></Dialog></CardHeader><CardContent><div className="space-y-4"><div className="rounded-md border"><div className="flex items-center p-4"><div className="flex items-center gap-4 flex-1"><Avatar><AvatarFallback>JD</AvatarFallback></Avatar><div><p className="font-medium">John Doe</p><p className="text-sm text-muted-foreground">john.doe@example.com</p></div></div><Badge className="mr-4 bg-[#f0e6ff] text-[#6941c6] border-[#e9d7fe]">Admin</Badge><Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">Remove</Button></div></div></div>{/* ... more team members ... */}
          <div className="rounded-md border border-dashed bg-muted/50"><div className="flex items-center p-4"><div className="flex items-center gap-4 flex-1"><div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center"><Mail className="h-4 w-4 text-muted-foreground" /></div><div><p className="font-medium">alex.johnson@example.com</p><div className="flex items-center text-sm text-muted-foreground"><Clock className="mr-1 h-3 w-3" /><span>Invited 2 days ago</span></div></div></div><Badge variant="outline" className="mr-4 bg-[#f0e6ff] text-[#6941c6] border-[#e9d7fe]">Viewer</Badge><Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">Cancel</Button></div></div></CardContent></Card>
          <Card><CardHeader><CardTitle>Roles & Permissions</CardTitle><CardDescription>Learn about the different roles and their permissions.</CardDescription></CardHeader><CardContent><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="space-y-2 p-4 bg-muted/30 rounded-lg"><h4 className="font-medium">Admin</h4><p className="text-sm text-muted-foreground">Full access to all features, including user management, billing, and organization settings.</p></div><div className="space-y-2 p-4 bg-muted/30 rounded-lg"><h4 className="font-medium">Member</h4><p className="text-sm text-muted-foreground">Can create and manage projects and ad accounts. Cannot manage users or billing.</p></div><div className="space-y-2 p-4 bg-muted/30 rounded-lg"><h4 className="font-medium">Viewer</h4><p className="text-sm text-muted-foreground">Read-only access to projects and ad accounts. Cannot make changes or create resources.</p></div></div></CardContent></Card>
          <p className="text-sm text-muted-foreground">
            Here&apos;s a list of your active team members and their roles.
          </p>
          <p className="text-sm text-muted-foreground">
            You&apos;re currently viewing the members for your selected team.
          </p>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card><CardHeader><CardTitle className="flex items-center justify-between">Two-Factor Authentication<Badge variant="outline" className="text-red-600 border-red-200">Not Enabled</Badge></CardTitle><CardDescription>Add an extra layer of security to your account.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-3"><div className="flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full"></div><span className="text-sm">SMS Authentication</span></div><div className="flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full"></div><span className="text-sm">Authenticator App</span></div></div><Button className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-black hover:opacity-90">Set up 2FA</Button></CardContent></Card>
            <Card><CardHeader><CardTitle>Active Sessions</CardTitle><CardDescription>Monitor and manage your active login sessions.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-3"><div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"><div><p className="font-medium text-sm">Current Session</p><p className="text-xs text-muted-foreground">Chrome on macOS • San Francisco, CA</p></div><Badge className="bg-[#f0e6ff] text-[#6941c6] border-[#e9d7fe]">Current</Badge></div><div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"><div><p className="font-medium text-sm">Mobile App</p><p className="text-xs text-muted-foreground">iPhone • 2 hours ago</p></div><Button variant="outline" size="sm">Revoke</Button></div></div></CardContent></Card>
            <Card className="md:col-span-2"><CardHeader><CardTitle>Password</CardTitle><CardDescription>Update your account password for better security.</CardDescription></CardHeader><CardContent><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="space-y-2"><Label htmlFor="currentPassword">Current Password</Label><Input id="currentPassword" type="password" placeholder="Enter current password" /></div><div className="space-y-2"><Label htmlFor="newPassword">New Password</Label><Input id="newPassword" type="password" placeholder="Enter new password" /><div className="text-xs text-muted-foreground">Must be at least 8 characters with uppercase, lowercase, and numbers</div></div><div className="space-y-2"><Label htmlFor="confirmPassword">Confirm New Password</Label><Input id="confirmPassword" type="password" placeholder="Confirm new password" /></div></div><div className="mt-6"><Button className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-black hover:opacity-90">Update Password</Button></div></CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2"><Card><CardHeader><CardTitle>Subscription</CardTitle><CardDescription>Manage your subscription and billing details.</CardDescription></CardHeader><CardContent className="space-y-6"><div className="flex items-center justify-between p-4 rounded-lg border bg-card/50"><div><p className="font-medium">Current Plan</p><p className="text-sm text-muted-foreground">Business Plan</p></div><Badge className="bg-[#f0e6ff] text-[#6941c6] border-[#e9d7fe]">Active</Badge></div><div className="space-y-2"><h4 className="font-medium">Payment Method</h4><div className="flex items-center gap-4 p-4 rounded-lg border"><div className="h-10 w-16 bg-muted rounded-md flex items-center justify-center"><span className="font-medium text-sm">VISA</span></div><div><p className="font-medium">Visa ending in 4242</p><p className="text-sm text-muted-foreground">Expires 12/2025</p></div><Button variant="outline" size="sm" className="ml-auto">Change</Button></div></div><div className="space-y-2"><div className="flex items-center justify-between"><h4 className="font-medium">Billing History</h4><Button variant="outline" size="sm">View All</Button></div><div className="rounded-lg border overflow-hidden"><div className="grid grid-cols-4 gap-4 p-4 border-b bg-muted/50 text-sm font-medium"><div>Date</div><div>Description</div><div>Amount</div><div className="text-right">Invoice</div></div><div className="grid grid-cols-4 gap-4 p-4 text-sm"><div>May 1, 2025</div><div>Business Plan</div><div>$299.00</div><div className="text-right"><Button variant="ghost" size="sm" className="h-8 px-2">Download</Button></div></div><div className="grid grid-cols-4 gap-4 p-4 text-sm border-t"><div>Apr 1, 2025</div><div>Business Plan</div><div>$299.00</div><div className="text-right"><Button variant="ghost" size="sm" className="h-8 px-2">Download</Button></div></div></div></div></CardContent></Card></div>
            <div><Card><CardHeader className="bg-muted/50"><CardTitle>Business Plan</CardTitle></CardHeader><CardContent className="pt-6"><div className="text-center mb-4"><div className="text-4xl font-bold">$299</div><div className="text-sm text-muted-foreground">per month</div></div><div className="space-y-4 mb-6"><div className="flex items-center"><Check className="h-4 w-4 mr-2 text-primary" /><span className="text-sm">Unlimited ad accounts</span></div><div className="flex items-center"><Check className="h-4 w-4 mr-2 text-primary" /><span className="text-sm">Priority support</span></div><div className="flex items-center"><Check className="h-4 w-4 mr-2 text-primary" /><span className="text-sm">Advanced analytics</span></div><div className="flex items-center"><Check className="h-4 w-4 mr-2 text-primary" /><span className="text-sm">Team collaboration</span></div></div><div className="space-y-2"><div className="flex items-center text-sm"><AlertTriangle className="h-4 w-4 mr-2 text-amber-500" /><span>Trial ends May 29, 2025</span></div><Button className="w-full bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black">Manage Subscription</Button></div></CardContent></Card></div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 