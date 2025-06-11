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
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback } from "../ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { MOCK_ORGANIZATION } from "../../lib/mock-data"

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
        navigator.clipboard.writeText(text).catch(err => console.error('Failed to copy:', err));
    }
  }

  const handleInvite = () => {
    console.log(`Inviting ${inviteEmail} as ${inviteRole}`);
    setInviteDialogOpen(false)
    setInviteEmail("")
  }

  return (
    <div className="space-y-3">
      <Tabs defaultValue="organization" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="organization" className="flex items-center gap-2 text-xs"><Building className="w-3 h-3" />Organization</TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2 text-xs"><Users className="w-3 h-3" />Team</TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2 text-xs"><Shield className="w-3 h-3" />Security</TabsTrigger>
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
                    <Label htmlFor="businessName" className="text-xs">Business Name</Label>
                    {isEditing ? (
                      <Input id="businessName" value={formData.businessName} onChange={(e) => setFormData({ ...formData, businessName: e.target.value })} className="h-8 text-xs" />
                    ) : (
                      <div className="p-2 bg-muted/50 rounded-md text-xs">{formData.businessName}</div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="businessType" className="text-xs">Business Type</Label>
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
                    <Label htmlFor="taxId" className="text-xs">Tax ID (EIN)</Label>
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
                  <Label htmlFor="address" className="text-xs">Street Address</Label>
                  {isEditing ? (
                    <Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="h-8 text-xs" />
                  ) : (
                    <div className="p-2 bg-muted/50 rounded-md text-xs">{formData.address}</div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="city" className="text-xs">City</Label>
                    {isEditing ? (
                      <Input id="city" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="h-8 text-xs" />
                    ) : (
                      <div className="p-2 bg-muted/50 rounded-md text-xs">{formData.city}</div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="state" className="text-xs">State</Label>
                    {isEditing ? (
                      <Input id="state" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className="h-8 text-xs" />
                    ) : (
                      <div className="p-2 bg-muted/50 rounded-md text-xs">{formData.state}</div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="zipCode" className="text-xs">ZIP Code</Label>
                    {isEditing ? (
                      <Input id="zipCode" value={formData.zipCode} onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })} className="h-8 text-xs" />
                    ) : (
                      <div className="p-2 bg-muted/50 rounded-md text-xs">{formData.zipCode}</div>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phoneNumber" className="text-xs">Phone Number</Label>
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

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base">Team Members</CardTitle>
                <CardDescription className="text-xs">Manage your team members and their access levels.</CardDescription>
              </div>
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black" size="sm">Invite User</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-base">Invite Team Member</DialogTitle>
                    <DialogDescription className="text-xs">Send an invitation to join your organization.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 py-3">
                    <div className="space-y-1">
                      <Label htmlFor="email" className="text-xs">Email Address</Label>
                      <Input id="email" placeholder="colleague@example.com" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="role" className="text-xs">Role</Label>
                      <Select value={inviteRole} onValueChange={setInviteRole}>
                        <SelectTrigger id="role" className="h-8 text-xs">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setInviteDialogOpen(false)} size="sm">Cancel</Button>
                    <Button className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black" onClick={handleInvite} size="sm">Send Invitation</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="space-y-3">
                <div className="rounded-md border">
                  <div className="flex items-center p-3">
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">JD</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-xs">John Doe</p>
                        <p className="text-xs text-muted-foreground">john.doe@example.com</p>
                      </div>
                    </div>
                    <Badge className="mr-3 bg-[#f0e6ff] text-[#6941c6] border-[#e9d7fe] text-xs">Admin</Badge>
                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 h-6 text-xs">Remove</Button>
                  </div>
                </div>
                <div className="rounded-md border border-dashed bg-muted/50">
                  <div className="flex items-center p-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-xs">alex.johnson@example.com</p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="mr-1 h-2 w-2" />
                          <span>Invited 2 days ago</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="mr-3 bg-[#f0e6ff] text-[#6941c6] border-[#e9d7fe] text-xs">Viewer</Badge>
                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 h-6 text-xs">Cancel</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Roles & Permissions</CardTitle>
              <CardDescription className="text-xs">Learn about the different roles and their permissions.</CardDescription>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
                  <h4 className="font-medium text-xs">Admin</h4>
                  <p className="text-xs text-muted-foreground">Full access to all features, including user management, billing, and organization settings.</p>
                </div>
                <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
                  <h4 className="font-medium text-xs">Member</h4>
                  <p className="text-xs text-muted-foreground">Can create and manage businesses and ad accounts. Cannot manage users or billing.</p>
                </div>
                <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
                  <h4 className="font-medium text-xs">Viewer</h4>
                  <p className="text-xs text-muted-foreground">Read-only access to businesses and ad accounts. Cannot make changes or create resources.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  Two-Factor Authentication
                  <Badge variant="outline" className="text-red-600 border-red-200 text-xs">Not Enabled</Badge>
                </CardTitle>
                <CardDescription className="text-xs">Add an extra layer of security to your account.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-3 pt-0">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    <span className="text-xs">SMS Authentication</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    <span className="text-xs">Authenticator App</span>
                  </div>
                </div>
                <Button className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-black hover:opacity-90" size="sm">Set up 2FA</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Active Sessions</CardTitle>
                <CardDescription className="text-xs">Monitor and manage your active login sessions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-3 pt-0">
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-xs">Current Session</p>
                      <p className="text-xs text-muted-foreground">Chrome on macOS • San Francisco, CA</p>
                    </div>
                    <Badge className="bg-[#f0e6ff] text-[#6941c6] border-[#e9d7fe] text-xs">Current</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-xs">Mobile App</p>
                      <p className="text-xs text-muted-foreground">iPhone • 2 hours ago</p>
                    </div>
                    <Button variant="outline" size="sm" className="h-6 text-xs">Revoke</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Password</CardTitle>
                <CardDescription className="text-xs">Update your account password for better security.</CardDescription>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="currentPassword" className="text-xs">Current Password</Label>
                    <Input id="currentPassword" type="password" placeholder="Enter current password" className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="newPassword" className="text-xs">New Password</Label>
                    <Input id="newPassword" type="password" placeholder="Enter new password" className="h-8 text-xs" />
                    <div className="text-xs text-muted-foreground">Must be at least 8 characters with uppercase, lowercase, and numbers</div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="confirmPassword" className="text-xs">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" placeholder="Confirm new password" className="h-8 text-xs" />
                  </div>
                </div>
                <div className="mt-4">
                  <Button className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-black hover:opacity-90" size="sm">Update Password</Button>
                </div>
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
                      <p className="text-xs text-muted-foreground">{MOCK_ORGANIZATION.plan} Plan</p>
                    </div>
                    <Badge className="bg-[#f0e6ff] text-[#6941c6] border-[#e9d7fe] text-xs">Active</Badge>
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
                      <div className="grid grid-cols-4 gap-3 p-3 text-xs">
                        <div>May 1, 2025</div>
                        <div>{MOCK_ORGANIZATION.plan} Plan</div>
                        <div>$299.00</div>
                        <div className="text-right">
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">Download</Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-3 p-3 text-xs border-t">
                        <div>Apr 1, 2025</div>
                        <div>{MOCK_ORGANIZATION.plan} Plan</div>
                        <div>$299.00</div>
                        <div className="text-right">
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">Download</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div>
              <Card>
                <CardHeader className="bg-muted/50 pb-2">
                  <CardTitle className="text-base">{MOCK_ORGANIZATION.plan} Plan</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 p-3">
                  <div className="text-center mb-3">
                    <div className="text-3xl font-bold">$299</div>
                    <div className="text-xs text-muted-foreground">per month</div>
                  </div>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center">
                      <Check className="h-3 w-3 mr-2 text-primary" />
                      <span className="text-xs">Unlimited ad accounts</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-3 w-3 mr-2 text-primary" />
                      <span className="text-xs">Priority support</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-3 w-3 mr-2 text-primary" />
                      <span className="text-xs">Advanced analytics</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-3 w-3 mr-2 text-primary" />
                      <span className="text-xs">Team collaboration</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center text-xs">
                      <AlertTriangle className="h-3 w-3 mr-2 text-amber-500" />
                      <span>Trial ends May 29, 2025</span>
                    </div>
                    <Button className="w-full bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black" size="sm">Manage Subscription</Button>
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