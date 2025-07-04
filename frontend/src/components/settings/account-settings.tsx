"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { toast } from "sonner"
import { Upload, Trash2 } from "lucide-react"
import { useAuth } from "../../contexts/AuthContext"
import { getInitials } from "../../lib/utils"

interface ProfileData {
  name: string;
  email: string;
  avatar_url: string | null;
}

export function AccountSettings() {
  const { user, profile, session } = useAuth()
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  
  // Form data state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    timezone: "UTC",
    language: "en",
  })

  // Load profile data when component mounts or profile changes
  useEffect(() => {
    if (profile && user) {
      // Parse name into first and last name
      const fullName = profile.name || user.user_metadata?.full_name || ""
      const nameParts = fullName.split(" ")
      const firstName = nameParts[0] || ""
      const lastName = nameParts.slice(1).join(" ") || ""

      setFormData({
        firstName,
        lastName,
        email: profile.email || user.email || "",
        phone: user.user_metadata?.phone || "",
        timezone: "UTC",
        language: "en",
      })

      setProfileData({
        name: fullName,
        email: profile.email || user.email || "",
        avatar_url: profile.avatar_url
      })
    }
  }, [profile, user])

  const handleSave = async () => {
    if (!session?.access_token) {
      toast.error("Authentication required")
      return
    }

    setLoading(true)
    try {
      // Combine first and last name
      const fullName = `${formData.firstName} ${formData.lastName}`.trim()
      
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: fullName,
          avatar_url: profileData?.avatar_url || null
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      const data = await response.json()
      
      // Update local state
      setProfileData(prev => ({
        ...prev!,
        name: fullName,
      }))
      
      setIsEditing(false)
      toast.success("Profile updated successfully!")
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error("Failed to save profile. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    // Reset form data to original values
    if (profile && user) {
      const fullName = profile.name || user.user_metadata?.full_name || ""
      const nameParts = fullName.split(" ")
      const firstName = nameParts[0] || ""
      const lastName = nameParts.slice(1).join(" ") || ""

      setFormData({
        firstName,
        lastName,
        email: profile.email || user.email || "",
        phone: user.user_metadata?.phone || "",
        timezone: "UTC",
        language: "en",
      })
    }
    setIsEditing(false)
  }

  // Show loading state while profile is being fetched
  if (!profile || !profileData) {
    return (
      <div className="space-y-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Profile Information</CardTitle>
            <CardDescription className="text-muted-foreground">
              Loading profile data...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
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
              <AvatarImage src={profileData.avatar_url || ""} alt="Profile" />
              <AvatarFallback className="text-lg bg-gradient-to-br from-[#b4a0ff] to-[#ffb4a0] text-white">
                {getInitials(profileData.name || formData.email)}
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
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                value={formData.email}
                disabled={true}
                className="bg-muted border-border text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-foreground">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing}
                className="bg-background border-border text-foreground"
                placeholder="Not provided"
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
                  <SelectItem value="CET">Central European Time</SelectItem>
                  <SelectItem value="JST">Japan Standard Time</SelectItem>
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
                <Button variant="outline" onClick={handleCancel} className="border-border text-foreground hover:bg-accent">
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
    </div>
  )
}
