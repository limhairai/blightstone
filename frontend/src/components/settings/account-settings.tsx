"use client"

import type React from "react"

import { useState } from "react"
import { Trash2, AlertTriangle, Mail, Copy, Upload, X, Shield } from "lucide-react"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Separator } from "../ui/separator"
import { Switch } from "../ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { useDemoState, type UserProfile } from "../../contexts/DemoStateContext"
import { gradientTokens } from "../../lib/design-tokens"

export function AccountSettings() {
  const { state, updateUserProfile } = useDemoState()
  const [profileImage, setProfileImage] = useState<string | null>(state.userProfile.avatar || null)
  const [isEditing, setIsEditing] = useState(false)
  const [updateEmailOpen, setUpdateEmailOpen] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [formData, setFormData] = useState({
    firstName: state.userProfile.firstName,
    lastName: state.userProfile.lastName,
    email: state.userProfile.email,
    phone: state.userProfile.phone || "",
    timezone: state.userProfile.timezone,
    language: state.userProfile.language,
  })
  const [notifications, setNotifications] = useState(state.userProfile.notifications)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Email copied to clipboard.")
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const newAvatar = e.target?.result as string
        setProfileImage(newAvatar)
        updateUserProfile({ avatar: newAvatar })
        toast.success("Your profile picture has been updated successfully.")
      }
      reader.readAsDataURL(file)
    }
  }

  const removeProfileImage = () => {
    setProfileImage(null)
    updateUserProfile({ avatar: undefined })
    toast.success("Your profile picture has been removed.")
  }

  const handleSave = () => {
    updateUserProfile({
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone || undefined,
      timezone: formData.timezone,
      language: formData.language,
    })
    setIsEditing(false)
    toast.success("Your profile information has been saved successfully.")
  }

  const handleUpdateEmail = () => {
    if (!newEmail || !currentPassword) {
      toast.error("Please fill in all required fields.")
      return
    }

    // Simulate API call
    updateUserProfile({ email: newEmail })
    toast.success("A verification link has been sent to your new email address.")
    setUpdateEmailOpen(false)
    setNewEmail("")
    setCurrentPassword("")
    setFormData({ ...formData, email: newEmail })
  }

  const handleNotificationChange = (key: keyof UserProfile['notifications'], value: boolean) => {
    const updatedNotifications = { ...notifications, [key]: value }
    setNotifications(updatedNotifications)
    updateUserProfile({ notifications: updatedNotifications })
    toast.success("Notification preferences updated.")
  }

  const handleConnectGoogle = () => {
    // Simulate Google OAuth flow
    toast.success("Redirecting to Google authentication...")
    // In a real app, this would redirect to Google OAuth
    setTimeout(() => {
      const updatedSecurity = {
        ...state.userProfile.security,
        connectedAccounts: state.userProfile.security.connectedAccounts.map(account =>
          account.provider === "Google" ? { ...account, connected: true } : account
        )
      }
      updateUserProfile({ security: updatedSecurity })
      toast.success("Your Google account has been successfully linked.")
    }, 2000)
  }

  const handleDisconnectGoogle = () => {
    const updatedSecurity = {
      ...state.userProfile.security,
      connectedAccounts: state.userProfile.security.connectedAccounts.map(account =>
        account.provider === "Google" ? { ...account, connected: false } : account
      )
    }
    updateUserProfile({ security: updatedSecurity })
    toast.success("Your Google account has been disconnected.")
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-foreground">Account Information</h3>
        <p className="text-sm text-muted-foreground mt-1">Manage your personal account data and preferences.</p>
      </div>

      {/* Profile Section */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium text-foreground">Profile</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="border-border text-foreground hover:bg-accent h-8"
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Profile Picture Section */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16">
                {profileImage ? (
                  <AvatarImage src={profileImage || "/placeholder.svg"} alt="Profile" className="object-cover" />
                ) : (
                  <AvatarFallback className={gradientTokens.avatar}>
                    {getInitials(`${formData.firstName} ${formData.lastName}`)}
                  </AvatarFallback>
                )}
              </Avatar>
              {profileImage && (
                <button
                  onClick={removeProfileImage}
                  className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-white rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="space-y-1">
              <div>
                <h4 className="font-medium text-foreground text-sm">Profile Picture</h4>
                <p className="text-xs text-muted-foreground">Upload a profile picture to personalize your account</p>
              </div>
              <div className="flex gap-2">
                <Label htmlFor="profile-upload" className="cursor-pointer">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border text-foreground hover:bg-accent h-7"
                    asChild
                  >
                    <span>
                      <Upload className="h-3 w-3 mr-1" />
                      Upload Photo
                    </span>
                  </Button>
                  <input
                    id="profile-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </Label>
                {profileImage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeProfileImage}
                    className="text-muted-foreground hover:text-foreground h-7"
                  >
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Recommended: Square image, at least 200x200px</p>
            </div>
          </div>

          {/* Profile Information */}
          {isEditing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="firstName" className="text-foreground text-sm">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="bg-background border-border text-foreground h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastName" className="text-foreground text-sm">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="bg-background border-border text-foreground h-8"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="phone" className="text-foreground text-sm">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    className="bg-background border-border text-foreground h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="timezone" className="text-foreground text-sm">
                    Timezone
                  </Label>
                  <Select value={formData.timezone} onValueChange={(value) => setFormData({ ...formData, timezone: value })}>
                    <SelectTrigger className="bg-background border-border text-foreground h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setIsEditing(false)
                    setFormData({
                      firstName: state.userProfile.firstName,
                      lastName: state.userProfile.lastName,
                      email: state.userProfile.email,
                      phone: state.userProfile.phone || "",
                      timezone: state.userProfile.timezone,
                      language: state.userProfile.language,
                    })
                  }}
                  className="h-8"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  className={gradientTokens.primary}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-foreground text-sm">First Name</Label>
                  <p className="text-sm text-foreground mt-1">{formData.firstName}</p>
                </div>
                <div>
                  <Label className="text-foreground text-sm">Last Name</Label>
                  <p className="text-sm text-foreground mt-1">{formData.lastName}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-foreground text-sm">Phone Number</Label>
                  <p className="text-sm text-foreground mt-1">{formData.phone || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-foreground text-sm">Timezone</Label>
                  <p className="text-sm text-foreground mt-1">{formData.timezone}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Section */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium text-foreground">Email Address</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUpdateEmailOpen(true)}
              className="border-border text-foreground hover:bg-accent h-8"
            >
              Update Email
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{formData.email}</p>
                <p className="text-xs text-muted-foreground">Primary email address</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(formData.email)}
              className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium text-foreground">Notification Preferences</CardTitle>
          <CardDescription className="text-muted-foreground">
            Choose how you want to receive notifications about your account activity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium text-foreground">Email Notifications</Label>
              <p className="text-xs text-muted-foreground">Receive notifications via email</p>
            </div>
            <Switch
              checked={notifications.email}
              onCheckedChange={(checked) => handleNotificationChange('email', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium text-foreground">Push Notifications</Label>
              <p className="text-xs text-muted-foreground">Receive push notifications in your browser</p>
            </div>
            <Switch
              checked={notifications.push}
              onCheckedChange={(checked) => handleNotificationChange('push', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium text-foreground">SMS Notifications</Label>
              <p className="text-xs text-muted-foreground">Receive notifications via text message</p>
            </div>
            <Switch
              checked={notifications.sms}
              onCheckedChange={(checked) => handleNotificationChange('sms', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium text-foreground">Marketing Communications</Label>
              <p className="text-xs text-muted-foreground">Receive updates about new features and promotions</p>
            </div>
            <Switch
              checked={notifications.marketing}
              onCheckedChange={(checked) => handleNotificationChange('marketing', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Authentication Section */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium text-foreground">Authentication</CardTitle>
          <CardDescription className="text-muted-foreground">
            Manage your authentication methods and security settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Password Authentication */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-background rounded-full border border-border">
                <Shield className="h-4 w-4 text-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Password</p>
                <p className="text-xs text-muted-foreground">Last updated {state.userProfile.security.lastPasswordChange}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-border text-foreground hover:bg-accent h-8"
              onClick={() => toast.success("Redirecting to password update...")}
            >
              Update
            </Button>
          </div>

          <Separator className="bg-border" />

          {/* Connected Accounts */}
          {state.userProfile.security.connectedAccounts.map((account, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full">
                  {account.provider === "Google" ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  ) : (
                    <Shield className="h-4 w-4 text-foreground" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{account.provider}</p>
                  <p className="text-xs text-muted-foreground">
                    {account.connected ? `Connected to ${account.email}` : "Not connected"}
                  </p>
                </div>
              </div>
              {account.connected ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border text-foreground hover:bg-accent h-8"
                  onClick={account.provider === "Google" ? handleDisconnectGoogle : undefined}
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border text-foreground hover:bg-accent h-8"
                  onClick={account.provider === "Google" ? handleConnectGoogle : undefined}
                >
                  Connect
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="bg-card border border-red-800/30">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1">
            These actions are permanent and cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3 px-4 bg-red-950/10 rounded-lg border border-red-800/20">
            <div>
              <div className="font-medium text-foreground">Delete Account</div>
              <div className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => toast.error("Account deletion is not available in demo mode.")}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Update Email Dialog */}
      <Dialog open={updateEmailOpen} onOpenChange={setUpdateEmailOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Update Email Address</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Enter your new email address and current password to update your email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-email" className="text-sm font-medium text-foreground">
                New Email Address
              </Label>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="bg-background border-border text-foreground"
                placeholder="Enter new email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current-password" className="text-sm font-medium text-foreground">
                Current Password
              </Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="bg-background border-border text-foreground"
                placeholder="Enter current password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUpdateEmailOpen(false)}
              className="border-border text-foreground hover:bg-accent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateEmail}
              className={gradientTokens.primary}
            >
              Update Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
