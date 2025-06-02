"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface PositionFormProps {
  data: {
    title: string
    department: string
    decisionMaker: boolean
  }
  updateData: (data: Partial<PositionFormProps["data"]>) => void
  onNext: () => void
  onBack: () => void
}

export function PositionForm({ data, updateData, onNext, onBack }: PositionFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!data.title.trim()) {
      newErrors.title = "Job title is required"
    }

    if (!data.department) {
      newErrors.department = "Department is required"
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
        <CardTitle className="text-2xl">Your role</CardTitle>
        <CardDescription>Tell us about your position in the company</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="job-title">Job title</Label>
            <Input
              id="job-title"
              placeholder="Marketing Manager"
              value={data.title}
              onChange={(e) => updateData({ title: e.target.value })}
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select value={data.department} onValueChange={(value) => updateData({ department: value })}>
              <SelectTrigger id="department" className={errors.department ? "border-destructive" : ""}>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="engineering">Engineering</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="hr">Human Resources</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
                <SelectItem value="executive">Executive</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.department && <p className="text-sm text-destructive">{errors.department}</p>}
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="decision-maker" className="cursor-pointer">
              Are you a decision maker for advertising spend?
            </Label>
            <Switch
              id="decision-maker"
              checked={data.decisionMaker}
              onCheckedChange={(checked) => updateData({ decisionMaker: checked })}
            />
          </div>
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
