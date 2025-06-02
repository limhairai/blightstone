"use client"

import { useState } from "react"
import { AlertTriangle, Copy, Edit, Save, X, Shield, Users, CreditCard, Building } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

const SettingsPage = () => {
  const [isEditing, setIsEditing] = useState(false)
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
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="container py-6 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="organization" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="organization" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Organization Header - Full Width */}
            <Card className="xl:col-span-4">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] rounded-lg flex items-center justify-center text-black font-bold text-lg">
                      TO
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">Test Org</h2>
                      <p className="text-sm text-muted-foreground">Created January 15, 2025</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <Button variant="outline" size="sm" onClick={handleCancel}>
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSave}
                          className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-black hover:opacity-90"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Organization ID</Label>
                      <p className="font-mono text-sm mt-1">VrfbN6vMc2MCvaZELhfJ</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard("VrfbN6vMc2MCvaZELhfJ")}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Information - 2 columns */}
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>Manage your organization's business details and legal information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    {isEditing ? (
                      <Input
                        id="businessName"
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      />
                    ) : (
                      <div className="p-3 bg-muted/50 rounded-md text-sm">{formData.businessName}</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessType">Business Type</Label>
                    {isEditing ? (
                      <Select
                        value={formData.businessType}
                        onValueChange={(value) => setFormData({ ...formData, businessType: value })}
                      >
                        <SelectTrigger>
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
                      <div className="p-3 bg-muted/50 rounded-md text-sm">{formData.businessType}</div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxId">Tax ID (EIN)</Label>
                    {isEditing ? (
                      <Input
                        id="taxId"
                        value={formData.taxId}
                        onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                      />
                    ) : (
                      <div className="p-3 bg-muted/50 rounded-md text-sm">{formData.taxId}</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    {isEditing ? (
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      />
                    ) : (
                      <div className="p-3 bg-muted/50 rounded-md text-sm">{formData.website}</div>
                    )}
                  </div>
                </div>

                {/* Additional Business Details */}
                <div className="pt-4 border-t space-y-4">
                  <h4 className="font-medium">Additional Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Industry</Label>
                      <div className="p-3 bg-muted/50 rounded-md text-sm">Digital Marketing</div>
                    </div>
                    <div className="space-y-2">
                      <Label>Company Size</Label>
                      <div className="p-3 bg-muted/50 rounded-md text-sm">1-10 employees</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information - 2 columns */}
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Update your organization's contact details and address information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address</Label>
                    {isEditing ? (
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    ) : (
                      <div className="p-3 bg-muted/50 rounded-md text-sm">{formData.address}</div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      {isEditing ? (
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        />
                      ) : (
                        <div className="p-3 bg-muted/50 rounded-md text-sm">{formData.city}</div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      {isEditing ? (
                        <Input
                          id="state"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        />
                      ) : (
                        <div className="p-3 bg-muted/50 rounded-md text-sm">{formData.state}</div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      {isEditing ? (
                        <Input
                          id="zipCode"
                          value={formData.zipCode}
                          onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                        />
                      ) : (
                        <div className="p-3 bg-muted/50 rounded-md text-sm">{formData.zipCode}</div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    {isEditing ? (
                      <Input
                        id="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      />
                    ) : (
                      <div className="p-3 bg-muted/50 rounded-md text-sm">{formData.phoneNumber}</div>
                    )}
                  </div>
                </div>

                {/* Additional Contact Methods */}
                <div className="pt-4 border-t space-y-4">
                  <h4 className="font-medium">Additional Contact Methods</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Support Email</Label>
                      <div className="p-3 bg-muted/50 rounded-md text-sm">support@testorg.com</div>
                    </div>
                    <div className="space-y-2">
                      <Label>Billing Email</Label>
                      <div className="p-3 bg-muted/50 rounded-md text-sm">billing@testorg.com</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Organization Stats */}
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Organization Statistics</CardTitle>
                <CardDescription>Overview of your organization's activity and usage.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">12</div>
                    <div className="text-sm text-muted-foreground">Active Ad Accounts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">$45,231</div>
                    <div className="text-sm text-muted-foreground">Total Ad Spend</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">3</div>
                    <div className="text-sm text-muted-foreground">Team Members</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">89 days</div>
                    <div className="text-sm text-muted-foreground">Account Age</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Info */}
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Current Subscription</CardTitle>
                <CardDescription>Manage your subscription plan and billing information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">Business Plan</p>
                    <p className="text-sm text-muted-foreground">$299/month • Unlimited ad accounts</p>
                  </div>
                  <Badge className="bg-[#f0e6ff] text-[#6941c6] border-[#e9d7fe]">Active</Badge>
                </div>

                <div className="bg-orange-400/10 border border-orange-400/20 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    <span className="text-orange-400 text-sm font-medium">Trial ends May 29, 2025</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your trial period will end soon. Update your payment method to continue using all features.
                  </p>
                </div>

                <Button className="w-full bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-black hover:opacity-90">
                  Manage Subscription
                </Button>
              </CardContent>
            </Card>

            {/* Danger Zone - Full Width */}
            <Card className="xl:col-span-4 bg-red-500/5 border-red-200/20">
              <CardHeader>
                <CardTitle className="text-red-500">Danger Zone</CardTitle>
                <CardDescription>These actions are irreversible and should be used with caution.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-red-200/20 rounded-lg">
                  <div>
                    <p className="font-medium text-red-500">Leave Organization</p>
                    <p className="text-sm text-muted-foreground">
                      Remove yourself from this organization. You will lose access to all projects and data.
                    </p>
                  </div>
                  <Button variant="destructive">Leave Organization</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Two-Factor Authentication */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Two-Factor Authentication
                  <Badge variant="outline" className="text-red-600 border-red-200">
                    Not Enabled
                  </Badge>
                </CardTitle>
                <CardDescription>Add an extra layer of security to your account with 2FA.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm">SMS Authentication</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm">Authenticator App</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm">Hardware Keys</span>
                  </div>
                </div>
                <Button className="w-full bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-black hover:opacity-90">
                  Set up 2FA
                </Button>
              </CardContent>
            </Card>

            {/* Active Sessions */}
            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>Monitor and manage your active login sessions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Current Session</p>
                        <p className="text-xs text-muted-foreground">Chrome on macOS</p>
                        <p className="text-xs text-muted-foreground">San Francisco, CA</p>
                      </div>
                    </div>
                    <Badge className="bg-[#f0e6ff] text-[#6941c6] border-[#e9d7fe]">Current</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Mobile App</p>
                        <p className="text-xs text-muted-foreground">iPhone</p>
                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Revoke
                    </Button>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  View All Sessions
                </Button>
              </CardContent>
            </Card>

            {/* Security Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Security Score</CardTitle>
                <CardDescription>Your account security rating and recommendations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-500">65%</div>
                  <div className="text-sm text-muted-foreground">Security Score</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Password Strength</span>
                    <Badge className="bg-green-100 text-green-800 border-green-200">Strong</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Two-Factor Auth</span>
                    <Badge variant="outline" className="text-red-600 border-red-200">
                      Disabled
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Recent Activity</span>
                    <Badge className="bg-green-100 text-green-800 border-green-200">Normal</Badge>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  Security Recommendations
                </Button>
              </CardContent>
            </Card>

            {/* Password Management - Full Width */}
            <Card className="xl:col-span-3">
              <CardHeader>
                <CardTitle>Password Management</CardTitle>
                <CardDescription>Update your account password and manage password security.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" placeholder="Enter current password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" placeholder="Enter new password" />
                    <div className="text-xs text-muted-foreground">
                      Must be at least 8 characters with uppercase, lowercase, and numbers
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" placeholder="Confirm new password" />
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Last password change: January 15, 2025</div>
                  <Button className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-black hover:opacity-90">
                    Update Password
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Login History */}
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Recent Login Activity</CardTitle>
                <CardDescription>Monitor recent login attempts and locations.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      time: "2 hours ago",
                      location: "San Francisco, CA",
                      device: "Chrome on macOS",
                      status: "success",
                    },
                    { time: "1 day ago", location: "San Francisco, CA", device: "iPhone App", status: "success" },
                    { time: "3 days ago", location: "Los Angeles, CA", device: "Chrome on Windows", status: "success" },
                    { time: "1 week ago", location: "Unknown", device: "Firefox on Linux", status: "failed" },
                  ].map((login, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${login.status === "success" ? "bg-green-500" : "bg-red-500"}`}
                        ></div>
                        <div>
                          <p className="font-medium text-sm">{login.device}</p>
                          <p className="text-xs text-muted-foreground">
                            {login.location} • {login.time}
                          </p>
                        </div>
                      </div>
                      <Badge variant={login.status === "success" ? "default" : "destructive"} className="text-xs">
                        {login.status === "success" ? "Success" : "Failed"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Security Preferences</CardTitle>
                <CardDescription>Configure additional security settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Login Notifications</p>
                      <p className="text-xs text-muted-foreground">Get notified of new logins</p>
                    </div>
                    <Badge className="bg-[#f0e6ff] text-[#6941c6] border-[#e9d7fe]">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Suspicious Activity Alerts</p>
                      <p className="text-xs text-muted-foreground">Alert for unusual activity</p>
                    </div>
                    <Badge className="bg-[#f0e6ff] text-[#6941c6] border-[#e9d7fe]">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Session Timeout</p>
                      <p className="text-xs text-muted-foreground">Auto-logout after inactivity</p>
                    </div>
                    <Badge variant="outline">30 minutes</Badge>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  Configure Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Team management features coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Billing management features coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default SettingsPage
