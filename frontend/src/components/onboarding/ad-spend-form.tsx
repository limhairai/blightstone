"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, ArrowRight } from "lucide-react"

interface AdSpendFormProps {
  data: {
    monthly: string
    platforms: string[]
  }
  updateData: (data: Partial<AdSpendFormProps["data"]>) => void
  onNext: () => void
  onBack: () => void
}

export function AdSpendForm({ data, updateData, onNext, onBack }: AdSpendFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const platforms = [
    { id: "facebook", label: "Facebook" },
    { id: "instagram", label: "Instagram" },
    { id: "google", label: "Google Ads" },
    { id: "tiktok", label: "TikTok" },
    { id: "twitter", label: "Twitter" },
    { id: "linkedin", label: "LinkedIn" },
    { id: "snapchat", label: "Snapchat" },
    { id: "pinterest", label: "Pinterest" },
  ]

  const togglePlatform = (platform: string) => {
    const currentPlatforms = [...data.platforms]

    if (currentPlatforms.includes(platform)) {
      updateData({ platforms: currentPlatforms.filter((p) => p !== platform) })
    } else {
      updateData({ platforms: [...currentPlatforms, platform] })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!data.monthly) {
      newErrors.monthly = "Monthly ad spend is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      setIsSubmitting(true)

      // Simulate API call
      setTimeout(() => {
        onNext()
        setIsSubmitting(false)
      }, 500)
    }
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="space-y-2 text-center mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Your advertising spend</h1>
        <p className="text-xs sm:text-sm text-[#71717a]">Help us understand your advertising needs</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="monthly-spend">Monthly advertising budget</Label>
          <Select value={data.monthly} onValueChange={(value) => updateData({ monthly: value })}>
            <SelectTrigger id="monthly-spend" className={errors.monthly ? "border-red-500" : ""}>
              <SelectValue placeholder="Select monthly budget" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="<1000">Less than $1,000</SelectItem>
              <SelectItem value="1000-5000">$1,000 - $5,000</SelectItem>
              <SelectItem value="5001-10000">$5,001 - $10,000</SelectItem>
              <SelectItem value="10001-25000">$10,001 - $25,000</SelectItem>
              <SelectItem value="25001-50000">$25,001 - $50,000</SelectItem>
              <SelectItem value="50001-100000">$50,001 - $100,000</SelectItem>
              <SelectItem value="100001+">More than $100,000</SelectItem>
            </SelectContent>
          </Select>
          {errors.monthly && <p className="text-sm text-red-500">{errors.monthly}</p>}
        </div>

        <div className="space-y-3">
          <Label>Which platforms do you advertise on?</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {platforms.map((platform) => (
              <div key={platform.id} className="flex items-center space-x-2">
                <Checkbox
                  id={platform.id}
                  checked={data.platforms.includes(platform.id)}
                  onCheckedChange={() => togglePlatform(platform.id)}
                />
                <Label htmlFor={platform.id} className="cursor-pointer">
                  {platform.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting} className="flex-1">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black"
          >
            {isSubmitting ? (
              "Processing..."
            ) : (
              <>
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
