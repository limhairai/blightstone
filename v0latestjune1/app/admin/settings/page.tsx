import { AvatarFallback } from "@/components/ui/avatar"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tag, Users, Shield, DollarSign, Percent, Plus } from "lucide-react"

export default function AdminSettingsPage() {
  return (
    <AdminLayout title="Platform Settings" subtitle="Configure fees, plans, and system settings">
      <div className="space-y-8">
        {/* Settings Tabs */}
        <Tabs defaultValue="fees" className="w-full">
          <TabsList className="bg-[#1A1A1A] border border-[#2A2A2A]">
            <TabsTrigger value="fees" className="flex items-center data-[state=active]:bg-[#2A2A2A]">
              <DollarSign className="mr-2 h-4 w-4" /> Fees & Pricing
            </TabsTrigger>
            <TabsTrigger value="plans" className="flex items-center data-[state=active]:bg-[#2A2A2A]">
              <Tag className="mr-2 h-4 w-4" /> Plans & Tiers
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center data-[state=active]:bg-[#2A2A2A]">
              <Users className="mr-2 h-4 w-4" /> User Roles
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center data-[state=active]:bg-[#2A2A2A]">
              <Shield className="mr-2 h-4 w-4" /> Security
            </TabsTrigger>
          </TabsList>

          {/* Fees & Pricing Content */}
          <TabsContent value="fees">
            <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
              <CardHeader>
                <CardTitle>Fee Structure</CardTitle>
                <CardDescription>Configure platform fees and commission rates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Platform Fees */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Platform Fees</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="platform-fee" className="flex items-center">
                        Base Platform Fee <Percent className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
                      </Label>
                      <Input
                        id="platform-fee"
                        type="number"
                        defaultValue="5"
                        min="0"
                        max="100"
                        step="0.5"
                        className="bg-[#0A0A0A] border-[#2A2A2A]"
                      />
                      <p className="text-xs text-muted-foreground">Base fee applied to all transactions</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="processing-fee" className="flex items-center">
                        Payment Processing Fee <Percent className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
                      </Label>
                      <Input
                        id="processing-fee"
                        type="number"
                        defaultValue="2.5"
                        min="0"
                        max="100"
                        step="0.1"
                        className="bg-[#0A0A0A] border-[#2A2A2A]"
                      />
                      <p className="text-xs text-muted-foreground">Additional fee for payment processing</p>
                    </div>
                  </div>
                </div>

                <Separator className="bg-[#2A2A2A]" />

                {/* Volume Discounts */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Volume Discounts</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 border-[#2A2A2A] bg-[#0A0A0A] hover:bg-[#2A2A2A]"
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" /> Add Tier
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-sm font-medium text-muted-foreground px-2">
                      <div>Spend Threshold</div>
                      <div>Discount Rate</div>
                      <div></div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 items-center">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                        <Input defaultValue="10000" className="bg-[#0A0A0A] border-[#2A2A2A]" />
                      </div>
                      <div className="flex items-center">
                        <Percent className="h-4 w-4 mr-1 text-muted-foreground" />
                        <Input defaultValue="1" className="bg-[#0A0A0A] border-[#2A2A2A]" />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-self-end text-destructive hover:bg-[#2A2A2A]/50"
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 items-center">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                        <Input defaultValue="50000" className="bg-[#0A0A0A] border-[#2A2A2A]" />
                      </div>
                      <div className="flex items-center">
                        <Percent className="h-4 w-4 mr-1 text-muted-foreground" />
                        <Input defaultValue="2" className="bg-[#0A0A0A] border-[#2A2A2A]" />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-self-end text-destructive hover:bg-[#2A2A2A]/50"
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 items-center">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                        <Input defaultValue="100000" className="bg-[#0A0A0A] border-[#2A2A2A]" />
                      </div>
                      <div className="flex items-center">
                        <Percent className="h-4 w-4 mr-1 text-muted-foreground" />
                        <Input defaultValue="3.5" className="bg-[#0A0A0A] border-[#2A2A2A]" />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-self-end text-destructive hover:bg-[#2A2A2A]/50"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator className="bg-[#2A2A2A]" />

                {/* Promotional Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Promotional Settings</h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="font-medium">First-Time User Discount</div>
                        <div className="text-sm text-muted-foreground">Special discount for new users</div>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first-time-discount">Discount Percentage</Label>
                        <div className="flex items-center">
                          <Percent className="h-4 w-4 mr-1 text-muted-foreground" />
                          <Input
                            id="first-time-discount"
                            type="number"
                            defaultValue="10"
                            min="0"
                            max="100"
                            step="1"
                            className="bg-[#0A0A0A] border-[#2A2A2A]"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="max-discount">Maximum Discount</Label>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                          <Input
                            id="max-discount"
                            type="number"
                            defaultValue="500"
                            min="0"
                            step="10"
                            className="bg-[#0A0A0A] border-[#2A2A2A]"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="valid-days">Valid for (days)</Label>
                        <Input
                          id="valid-days"
                          type="number"
                          defaultValue="30"
                          min="1"
                          step="1"
                          className="bg-[#0A0A0A] border-[#2A2A2A]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t border-[#2A2A2A] pt-4">
                <Button variant="outline" className="border-[#2A2A2A] bg-[#0A0A0A] hover:bg-[#2A2A2A]">
                  Reset Changes
                </Button>
                <Button className="bg-[#b4a0ff] hover:bg-[#9f84ca] text-black">Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Plans & Tiers Content */}
          <TabsContent value="plans">
            <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
              <CardHeader>
                <CardTitle>Subscription Plans</CardTitle>
                <CardDescription>Manage the different plans offered on the platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-end">
                  <Button className="bg-[#b4a0ff] hover:bg-[#9f84ca] text-black">
                    <Plus className="mr-2 h-4 w-4" /> Add New Plan
                  </Button>
                </div>

                {/* Plan Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Standard Plan */}
                  <Card className="border-[#2A2A2A] bg-[#0A0A0A]">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle>Standard</CardTitle>
                        <Badge variant="outline" className="bg-[#2A2A2A]/50 border-[#2A2A2A]">
                          Active
                        </Badge>
                      </div>
                      <CardDescription>Basic plan for small businesses</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="flex items-baseline mb-4">
                        <span className="text-3xl font-bold">$49</span>
                        <span className="text-muted-foreground ml-1">/month</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-2 text-[#b4a0ff]" />
                          <span>4.5% platform fee</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-[#b4a0ff]" />
                          <span>Up to 3 ad accounts</span>
                        </div>
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 mr-2 text-[#b4a0ff]" />
                          <span>Basic support</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button variant="outline" className="w-full border-[#2A2A2A] hover:bg-[#2A2A2A]">
                        Edit Plan
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Premium Plan */}
                  <Card className="border-2 border-[#b4a0ff] bg-[#0A0A0A]">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle>Premium</CardTitle>
                        <Badge variant="outline" className="bg-[#b4a0ff]/20 text-[#b4a0ff] border-[#b4a0ff]/30">
                          Popular
                        </Badge>
                      </div>
                      <CardDescription>Enhanced plan for growing businesses</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="flex items-baseline mb-4">
                        <span className="text-3xl font-bold">$149</span>
                        <span className="text-muted-foreground ml-1">/month</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-2 text-[#b4a0ff]" />
                          <span>3.5% platform fee</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-[#b4a0ff]" />
                          <span>Up to 10 ad accounts</span>
                        </div>
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 mr-2 text-[#b4a0ff]" />
                          <span>Priority support</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button variant="outline" className="w-full border-[#2A2A2A] hover:bg-[#2A2A2A]">
                        Edit Plan
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Enterprise Plan */}
                  <Card className="border-[#2A2A2A] bg-[#0A0A0A]">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle>Enterprise</CardTitle>
                        <Badge variant="outline" className="bg-[#2A2A2A]/50 border-[#2A2A2A]">
                          Active
                        </Badge>
                      </div>
                      <CardDescription>Complete solution for large businesses</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="flex items-baseline mb-4">
                        <span className="text-3xl font-bold">$499</span>
                        <span className="text-muted-foreground ml-1">/month</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-2 text-[#b4a0ff]" />
                          <span>2.5% platform fee</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-[#b4a0ff]" />
                          <span>Unlimited ad accounts</span>
                        </div>
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 mr-2 text-[#b4a0ff]" />
                          <span>Dedicated account manager</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button variant="outline" className="w-full border-[#2A2A2A] hover:bg-[#2A2A2A]">
                        Edit Plan
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Roles Content */}
          <TabsContent value="users">
            <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage admin users and permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-end">
                  <Button className="bg-[#b4a0ff] hover:bg-[#9f84ca] text-black">
                    <Plus className="mr-2 h-4 w-4" /> Add Admin User
                  </Button>
                </div>

                <div className="rounded-md border border-[#2A2A2A]">
                  <div className="p-4 grid grid-cols-4 font-medium text-sm text-muted-foreground">
                    <div>User</div>
                    <div>Role</div>
                    <div>Status</div>
                    <div className="text-right">Actions</div>
                  </div>
                  <Separator className="bg-[#2A2A2A]" />

                  {/* Admin Users List */}
                  <div className="divide-y divide-[#2A2A2A]">
                    <div className="p-4 grid grid-cols-4 items-center">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-[#2A2A2A]">JD</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">John Doe</div>
                          <div className="text-sm text-muted-foreground">john@example.com</div>
                        </div>
                      </div>
                      <div>Super Admin</div>
                      <div>
                        <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Active</Badge>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" className="h-8 border-[#2A2A2A] hover:bg-[#2A2A2A]">
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 border-[#2A2A2A] hover:bg-[#2A2A2A] text-red-500"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 grid grid-cols-4 items-center">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-[#2A2A2A]">JS</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">Jane Smith</div>
                          <div className="text-sm text-muted-foreground">jane@example.com</div>
                        </div>
                      </div>
                      <div>Finance Admin</div>
                      <div>
                        <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Active</Badge>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" className="h-8 border-[#2A2A2A] hover:bg-[#2A2A2A]">
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 border-[#2A2A2A] hover:bg-[#2A2A2A] text-red-500"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 grid grid-cols-4 items-center">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-[#2A2A2A]">RJ</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">Robert Johnson</div>
                          <div className="text-sm text-muted-foreground">robert@example.com</div>
                        </div>
                      </div>
                      <div>Support Admin</div>
                      <div>
                        <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Invited</Badge>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" className="h-8 border-[#2A2A2A] hover:bg-[#2A2A2A]">
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 border-[#2A2A2A] hover:bg-[#2A2A2A] text-red-500"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Content */}
          <TabsContent value="security">
            <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Configure security options for the platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Authentication</h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="font-medium">Two-Factor Authentication</div>
                        <div className="text-sm text-muted-foreground">Require 2FA for all admin users</div>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="font-medium">Session Timeout</div>
                        <div className="text-sm text-muted-foreground">Automatically log out inactive admin users</div>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timeout-minutes">Timeout (minutes)</Label>
                      <Input
                        id="timeout-minutes"
                        type="number"
                        defaultValue="30"
                        min="5"
                        step="5"
                        className="bg-[#0A0A0A] border-[#2A2A2A] max-w-xs"
                      />
                    </div>
                  </div>

                  <Separator className="bg-[#2A2A2A]" />

                  <h3 className="text-lg font-medium">Access Control</h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="font-medium">IP Restrictions</div>
                        <div className="text-sm text-muted-foreground">Limit admin access to specific IP addresses</div>
                      </div>
                      <Switch />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="font-medium">Audit Logging</div>
                        <div className="text-sm text-muted-foreground">Log all admin actions for security review</div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t border-[#2A2A2A] pt-4">
                <Button variant="outline" className="border-[#2A2A2A] bg-[#0A0A0A] hover:bg-[#2A2A2A]">
                  Reset Changes
                </Button>
                <Button className="bg-[#b4a0ff] hover:bg-[#9f84ca] text-black">Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
