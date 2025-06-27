"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Badge } from "../ui/badge"
import { Switch } from "../ui/switch"
import { Separator } from "../ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { toast } from "sonner"
import { Copy, Upload, Trash2, Mail, Phone, Globe, Bell, Shield, Link as LinkIcon } from "lucide-react"
import { UserProfile } from "../../types/user"
import { getInitials } from "../../lib/utils"

export function AccountSettings() {
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [updateEmailOpen, setUpdateEmailOpen] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  
  // Mock user data - in real app this would come from SWR or similar
  const [formData, setFormData] = useState({
    firstName: "John",
    lastName: "Doe", 
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    timezone: "UTC",
    language: "en",
  })
  
  const [notifications, setNotifications] = useState({
    email: true,
    push: true, 
    sms: false,
    marketing: false,
    security: true
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Email copied to clipboard.")
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // In real app, this would make API call to update user profile
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      setIsEditing(false)
      toast.success("Profile updated successfully!")
    } catch (error) {
      toast.error("Failed to save profile. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateEmail = async () => {
    if (!newEmail || !currentPassword) {
      toast.error("Please fill in all required fields.")
      return
    }

    setLoading(true)
    try {
      // In real app, this would make API call to update email
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      setFormData({ ...formData, email: newEmail })
      toast.success("A verification link has been sent to your new email address.")
      setUpdateEmailOpen(false)
      setNewEmail("")
      setCurrentPassword("")
    } catch (error) {
      toast.error("Failed to update email. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationChange = async (key: string, value: boolean) => {
    setLoading(true)
    try {
      // In real app, this would make API call to update notification preferences
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API call
      
      setNotifications({ ...notifications, [key]: value })
      toast.success("Notification preferences updated.")
    } catch (error) {
      toast.error("Failed to update notification preferences.")
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Profile Information</CardTitle>
          <CardDescription className="text-muted-foreground">
            Update your personal information and profile settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Picture */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src="" alt="Profile" />
              <AvatarFallback className="text-lg bg-gradient-to-br from-[#b4a0ff] to-[#ffb4a0] text-white">
                {getInitials(`${formData.firstName} ${formData.lastName}`)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-accent">
                <Upload className="h-4 w-4 mr-2" />
                Upload Photo
              </Button>
              <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:bg-accent">
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-foreground">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                disabled={!isEditing}
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-foreground">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                disabled={!isEditing}
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-foreground">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing}
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone" className="text-foreground">Timezone</Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                disabled={!isEditing}
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="EST">Eastern Time</SelectItem>
                  <SelectItem value="PST">Pacific Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button onClick={handleSave} disabled={loading} className="bg-[#c4b5fd] hover:bg-[#b4a0ff] text-white">
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)} className="border-border text-foreground hover:bg-accent">
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} variant="outline" className="border-border text-foreground hover:bg-accent">
                Edit Profile
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Settings
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Manage your email address and email preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Email Address</p>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-muted px-2 py-1 rounded border font-mono text-foreground">
                  {formData.email}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(formData.email)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <Dialog open={updateEmailOpen} onOpenChange={setUpdateEmailOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-accent">
                  Update Email
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Update Email Address</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Enter your new email address and current password to update your email.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newEmail" className="text-foreground">New Email Address</Label>
                    <Input
                      id="newEmail"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-foreground">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setUpdateEmailOpen(false)} className="border-border text-foreground hover:bg-accent">
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateEmail} disabled={loading} className="bg-[#c4b5fd] hover:bg-[#b4a0ff] text-white">
                    {loading ? "Updating..." : "Update Email"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Choose how you want to be notified about account activity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground capitalize">
                  {key === 'sms' ? 'SMS' : key} Notifications
                </p>
                <p className="text-xs text-muted-foreground">
                  {key === 'email' && 'Receive notifications via email'}
                  {key === 'push' && 'Receive push notifications in your browser'}
                  {key === 'sms' && 'Receive SMS notifications on your phone'}
                  {key === 'marketing' && 'Receive marketing and promotional emails'}
                  {key === 'security' && 'Receive security alerts and updates'}
                </p>
              </div>
              <Switch
                checked={value}
                onCheckedChange={(checked) => handleNotificationChange(key, checked)}
                disabled={loading}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
