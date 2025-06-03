"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ApplicationForm() {
  const [formData, setFormData] = useState({
    accountName: "",
    landingPageUrl: "",
    facebookPageUrl: "",
  })

  const handleChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="account-name" className="text-[#E0E0E0]">
            Account Name
          </Label>
          <Input
            id="account-name"
            placeholder="Enter a name for this ad account"
            value={formData.accountName}
            onChange={(e) => handleChange("accountName", e.target.value)}
            className="bg-[#1C1C1E] border-[#2C2C2E] focus:border-[#b19cd9] focus:ring-[#b19cd9]/20"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="landing-page-url" className="text-[#E0E0E0]">
            Landing Page URL
          </Label>
          <Input
            id="landing-page-url"
            placeholder="https://example.com"
            value={formData.landingPageUrl}
            onChange={(e) => handleChange("landingPageUrl", e.target.value)}
            className="bg-[#1C1C1E] border-[#2C2C2E] focus:border-[#b19cd9] focus:ring-[#b19cd9]/20"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="facebook-page-url" className="text-[#E0E0E0]">
            Facebook Page URL
          </Label>
          <Input
            id="facebook-page-url"
            placeholder="https://facebook.com/yourpage"
            value={formData.facebookPageUrl}
            onChange={(e) => handleChange("facebookPageUrl", e.target.value)}
            className="bg-[#1C1C1E] border-[#2C2C2E] focus:border-[#b19cd9] focus:ring-[#b19cd9]/20"
            required
          />
        </div>
      </div>
    </div>
  )
}
