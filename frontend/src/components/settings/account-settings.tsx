"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { toast } from "sonner"
import { Upload, Trash2 } from "lucide-react"
import { UserProfile } from "../../types/user"
import { getInitials } from "../../lib/utils"

export function AccountSettings() {
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  
  // Mock user data - in real app this would come from SWR or similar
  const [formData, setFormData] = useState({
    firstName: "John",
    lastName: "Doe", 
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    timezone: "UTC",
    language: "en",
  })
  




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


    </div>
  )
}
