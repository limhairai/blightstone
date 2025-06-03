"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FormLabel, FormDescription, FormControl } from "@/components/ui/form"

interface ReferralFormProps {
  data: {
    source: string
    details: string
  }
  updateData: (data: Partial<ReferralFormProps["data"]>) => void
  onNext: () => void
  onBack: () => void
}

export function ReferralForm({ data, updateData, onNext, onBack }: ReferralFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!data.source) {
      newErrors.source = "Please select how you heard about us"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onNext()
    }
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">How did you hear about us?</CardTitle>
        <CardDescription>We&apos;d love to know how you discovered AdHub</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <FormLabel>How did you hear about us?</FormLabel>
            <FormDescription>Let us know if someone referred you or how you found AdHub. We&apos;re curious!</FormDescription>
            <RadioGroup
              value={data.source}
              onValueChange={(value) => updateData({ source: value })}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="search" id="search" />
                <Label htmlFor="search">Search Engine (Google, Bing, etc.)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="social" id="social" />
                <Label htmlFor="social">Social Media</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="friend" id="friend" />
                <Label htmlFor="friend">Friend or Colleague</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="blog" id="blog" />
                <Label htmlFor="blog">Blog or Publication</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="event" id="event" />
                <Label htmlFor="event">Event or Conference</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other">Other</Label>
              </div>
            </RadioGroup>
            {errors.source && <p className="text-sm text-destructive">{errors.source}</p>}
          </div>

          {data.source && (
            <div className="space-y-2">
              <Label htmlFor="details">Any additional details?</Label>
              <Textarea
                id="details"
                placeholder="Tell us more..."
                value={data.details}
                onChange={(e) => updateData({ details: e.target.value })}
                rows={3}
              />
            </div>
          )}
        </form>
      </CardContent>
      <CardFooter className="flex justify-between border-t border-border/40 pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          Continue
        </Button>
      </CardFooter>
    </Card>
  )
}
