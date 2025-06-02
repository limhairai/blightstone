"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CreateProjectDialogProps {
  trigger: React.ReactNode
}

export function CreateProjectDialog({ trigger }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    bmId: "",
    landingPage: "",
    facebookPage: "",
    timezone: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Project data:", formData)
    // Here you would submit the data to your API
    setOpen(false)
    // Reset form
    setFormData({
      name: "",
      bmId: "",
      landingPage: "",
      facebookPage: "",
      timezone: "",
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>
              Create a new project to link ad accounts. Projects require approval before you can create ad accounts.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Marketing Campaign"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bmId">Business Manager ID</Label>
              <Input
                id="bmId"
                name="bmId"
                value={formData.bmId}
                onChange={handleChange}
                placeholder="123456789"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="landingPage">Landing Page URL</Label>
              <Input
                id="landingPage"
                name="landingPage"
                value={formData.landingPage}
                onChange={handleChange}
                placeholder="https://example.com/landing"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="facebookPage">Facebook Page URL</Label>
              <Input
                id="facebookPage"
                name="facebookPage"
                value={formData.facebookPage}
                onChange={handleChange}
                placeholder="https://facebook.com/example"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={formData.timezone} onValueChange={(value) => handleSelectChange("timezone", value)}>
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="utc">UTC</SelectItem>
                  <SelectItem value="est">Eastern Time (ET)</SelectItem>
                  <SelectItem value="cst">Central Time (CT)</SelectItem>
                  <SelectItem value="mst">Mountain Time (MT)</SelectItem>
                  <SelectItem value="pst">Pacific Time (PT)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Project</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
