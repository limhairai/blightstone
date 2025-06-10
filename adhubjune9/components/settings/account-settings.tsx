"use client"

import type React from "react"

import { useState } from "react"
import { User, Trash2, AlertTriangle, Mail, Calendar, Copy, Upload, X, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function AccountSettings() {
  const { toast } = useToast()
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [updateEmailOpen, setUpdateEmailOpen] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [formData, setFormData] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Email copied to clipboard.",
    })
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string)
        toast({
          title: "Profile picture updated!",
          description: "Your profile picture has been updated successfully.",
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const removeProfileImage = () => {
    setProfileImage(null)
    toast({
      title: "Profile picture removed",
      description: "Your profile picture has been removed.",
    })
  }

  const handleSave = () => {
    setIsEditing(false)
    toast({
      title: "Profile updated!",
      description: "Your profile information has been saved successfully.",
    })
  }

  const handleUpdateEmail = () => {
    if (!newEmail || !currentPassword) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    // Simulate API call
    toast({
      title: "Email update initiated",
      description: "A verification link has been sent to your new email address.",
    })
    setUpdateEmailOpen(false)
    setNewEmail("")
    setCurrentPassword("")
  }

  const handleConnectGoogle = () => {
    // Simulate Google OAuth flow
    toast({
      title: "Google integration",
      description: "Redirecting to Google authentication...",
    })
    // In a real app, this would redirect to Google OAuth
    setTimeout(() => {
      toast({
        title: "Google account connected!",
        description: "Your Google account has been successfully linked.",
      })
    }, 2000)
  }

  const getInitials = () => {
    return `${formData.firstName.charAt(0)}${formData.lastName.charAt(0)}`.toUpperCase()
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
                  <AvatarFallback className="bg-gradient-to-br from-[#c4b5fd] to-[#ffc4b5] text-white text-lg font-semibold">
                    {getInitials()}
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
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  className="border-border text-foreground hover:bg-accent h-8"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] text-black hover:opacity-90 h-8"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Full Name</label>
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded border border-border group">
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="text-foreground font-medium text-sm">
                      {formData.firstName} {formData.lastName}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(`${formData.firstName} ${formData.lastName}`)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 p-0"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Email Address
                </label>
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded border border-border group">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-foreground font-medium truncate text-sm">{formData.email}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Badge className="bg-emerald-950/50 text-emerald-400 border-emerald-700 text-xs px-1 py-0">
                      Verified
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUpdateEmailOpen(true)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 p-0"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-pencil"
                      >
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Member Since */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Member Since
                </label>
                <div className="flex items-center p-2 bg-muted/50 rounded border border-border">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-foreground font-medium text-sm">January 15, 2025</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium text-foreground">Connected Accounts</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Connect your accounts to enable single sign-on and enhanced features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
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
              </div>
              <div>
                <h4 className="font-medium text-foreground">Google</h4>
                <p className="text-xs text-muted-foreground">Use your Google account for single sign-on</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleConnectGoogle}
              className="border-border text-foreground hover:bg-accent"
            >
              Connect
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              Security Settings
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-foreground text-sm">Two-Factor Authentication</h4>
              <p className="text-xs text-muted-foreground mt-1">Add an extra layer of security to your account</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast({
                  title: "2FA Setup",
                  description: "Setting up two-factor authentication...",
                })
              }}
              className="border-border text-foreground hover:bg-accent h-8"
            >
              Setup
            </Button>
          </div>

          <Separator className="bg-border" />

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-foreground text-sm">Password</h4>
              <p className="text-xs text-muted-foreground mt-1">Last changed 3 months ago</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast({
                  title: "Change Password",
                  description: "Password change functionality coming soon.",
                })
              }}
              className="border-border text-foreground hover:bg-accent h-8"
            >
              Change
            </Button>
          </div>

          <Separator className="bg-border" />

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-foreground text-sm">Session Management</h4>
              <p className="text-xs text-muted-foreground mt-1">You're currently signed in on 1 device</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast({
                  title: "Session Management",
                  description: "View and manage your active sessions.",
                })
              }}
              className="border-border text-foreground hover:bg-accent h-8"
            >
              Manage
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card className="bg-red-950/20 border-red-800/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-red-400 text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Delete Account
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Permanently delete your account and all associated data.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-foreground text-sm">Delete Account</h4>
              <p className="text-xs text-muted-foreground mt-1">
                This will permanently delete your account and remove you from all organizations. This action cannot be
                undone.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="h-8"
              onClick={() => {
                toast({
                  title: "Delete Account",
                  description: "Account deletion requires confirmation. Please check your email.",
                  variant: "destructive",
                })
              }}
            >
              <Trash2 className="h-3 w-3 mr-2" />
              Delete Account
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
              Enter your new email address and current password to update.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-email" className="text-sm font-medium text-foreground">
                Current Email
              </Label>
              <Input
                id="current-email"
                value={formData.email}
                disabled
                className="bg-muted border-border text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email" className="text-sm font-medium text-foreground">
                New Email Address
              </Label>
              <Input
                id="new-email"
                type="email"
                placeholder="your-new-email@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current-password" className="text-sm font-medium text-foreground">
                Current Password
              </Label>
              <Input
                id="current-password"
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="bg-background border-border text-foreground"
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
              className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0"
            >
              Update Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
