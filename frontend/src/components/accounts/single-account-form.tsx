"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Globe, Facebook } from "lucide-react"

interface SingleAccountFormProps {
  formData: any
  onChange: (data: any) => void
}

export function SingleAccountForm({ formData, onChange }: SingleAccountFormProps) {
  const [localData, setLocalData] = useState({
    businessManagerId: formData.businessManagerId || "",
    timezone: formData.timezone || "",
    accounts: [
      {
        id: 1,
        name: formData.accounts[0]?.name || "",
        landingPageUrl: formData.accounts[0]?.landingPageUrl || "",
        facebookPageUrl: formData.accounts[0]?.facebookPageUrl || "",
      },
    ],
  })

  // Only update parent when form is submitted, not on every change
  const handleChange = (field: string, value: string) => {
    setLocalData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAccountChange = (field: string, value: string) => {
    setLocalData((prev) => ({
      ...prev,
      accounts: [
        {
          ...prev.accounts[0],
          [field]: value,
        },
      ],
    }))
  }

  // Submit changes to parent component
  const submitChanges = () => {
    onChange(localData)
  }

  // Update local state if parent props change significantly
  useEffect(() => {
    if (
      formData.businessManagerId !== localData.businessManagerId ||
      formData.timezone !== localData.timezone ||
      formData.accounts[0]?.name !== localData.accounts[0]?.name ||
      formData.accounts[0]?.landingPageUrl !== localData.accounts[0]?.landingPageUrl ||
      formData.accounts[0]?.facebookPageUrl !== localData.accounts[0]?.facebookPageUrl
    ) {
      setLocalData({
        businessManagerId: formData.businessManagerId || "",
        timezone: formData.timezone || "",
        accounts: [
          {
            id: 1,
            name: formData.accounts[0]?.name || "",
            landingPageUrl: formData.accounts[0]?.landingPageUrl || "",
            facebookPageUrl: formData.accounts[0]?.facebookPageUrl || "",
          },
        ],
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData])

  // Submit changes when form loses focus
  const handleBlur = () => {
    submitChanges()
  }

  return (
    <div className="space-y-5">
      {/* Business Manager and Timezone section */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="business-manager-id" className="text-[#999] flex items-center text-xs">
              <Settings className="h-3.5 w-3.5 mr-1.5 text-[#b4a0ff]" />
              Business Manager ID
            </Label>
            <Input
              id="business-manager-id"
              placeholder="Enter your Facebook Business Manager ID"
              value={localData.businessManagerId}
              onChange={(e) => handleChange("businessManagerId", e.target.value)}
              onBlur={handleBlur}
              className="bg-[#0a0a0a] border-[#333] focus:border-[#b4a0ff] focus:ring-[#b4a0ff]/20 h-10 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="timezone" className="text-[#999] text-xs">
              Timezone
            </Label>
            <Select
              value={localData.timezone}
              onValueChange={(value) => {
                handleChange("timezone", value)
                submitChanges()
              }}
            >
              <SelectTrigger
                id="timezone"
                className="bg-[#0a0a0a] border-[#333] focus:border-[#b4a0ff] focus:ring-[#b4a0ff]/20 h-10 text-sm"
              >
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a0a] border-[#333]">
                <SelectItem value="utc">UTC (Coordinated Universal Time)</SelectItem>
                <SelectItem value="est">EST (Eastern Standard Time)</SelectItem>
                <SelectItem value="pst">PST (Pacific Standard Time)</SelectItem>
                <SelectItem value="cet">CET (Central European Time)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Account Details section */}
      <div className="mt-6">
        <h3 className="text-sm text-[#b4a0ff] mb-4">Account Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="account-name" className="text-[#999] text-xs">
              Account Name
            </Label>
            <Input
              id="account-name"
              placeholder="Enter a name for this ad account"
              value={localData.accounts[0].name}
              onChange={(e) => handleAccountChange("name", e.target.value)}
              onBlur={handleBlur}
              className="bg-[#0a0a0a] border-[#333] focus:border-[#b4a0ff] focus:ring-[#b4a0ff]/20 h-10 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="landing-page-url" className="text-[#999] flex items-center text-xs">
              <Globe className="h-3.5 w-3.5 mr-1.5 text-[#b4a0ff]" />
              Landing Page URL
            </Label>
            <Input
              id="landing-page-url"
              placeholder="https://example.com"
              value={localData.accounts[0].landingPageUrl}
              onChange={(e) => handleAccountChange("landingPageUrl", e.target.value)}
              onBlur={handleBlur}
              className="bg-[#0a0a0a] border-[#333] focus:border-[#b4a0ff] focus:ring-[#b4a0ff]/20 h-10 text-sm"
            />
          </div>
        </div>

        <div className="mt-4">
          <div className="space-y-1.5">
            <Label htmlFor="facebook-page-url" className="text-[#999] flex items-center text-xs">
              <Facebook className="h-3.5 w-3.5 mr-1.5 text-[#b4a0ff]" />
              Facebook Page URL
            </Label>
            <Input
              id="facebook-page-url"
              placeholder="https://facebook.com/yourpage"
              value={localData.accounts[0].facebookPageUrl}
              onChange={(e) => handleAccountChange("facebookPageUrl", e.target.value)}
              onBlur={handleBlur}
              className="bg-[#0a0a0a] border-[#333] focus:border-[#b4a0ff] focus:ring-[#b4a0ff]/20 h-10 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  )
} 