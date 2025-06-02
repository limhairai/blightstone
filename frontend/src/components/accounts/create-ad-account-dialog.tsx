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

interface CreateAdAccountDialogProps {
  trigger: React.ReactNode
}

export function CreateAdAccountDialog({ trigger }: CreateAdAccountDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    project: "",
    accountCount: 1,
  })

  // Mock projects data
  const projects = [
    { id: "1", name: "Marketing Campaigns", status: "Approved" },
    { id: "2", name: "Social Media", status: "Approved" },
    { id: "3", name: "New Campaign", status: "Pending" },
  ]

  const approvedProjects = projects.filter((p) => p.status === "Approved")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAccountCountChange = (increment: boolean) => {
    setFormData((prev) => ({
      ...prev,
      accountCount: increment
        ? Math.min(prev.accountCount + 1, 10) // Max 10 accounts at once
        : Math.max(prev.accountCount - 1, 1), // Min 1 account
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Ad Account data:", formData)
    // Here you would submit the data to your API
    setOpen(false)
    // Reset form
    setFormData({
      name: "",
      project: "",
      accountCount: 1,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Ad Account Application</DialogTitle>
            <DialogDescription>Create new ad accounts linked to an approved project.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="project">Project</Label>
              {approvedProjects.length === 0 ? (
                <div className="text-sm text-red-500">
                  No approved projects available. Please create and get a project approved first.
                </div>
              ) : (
                <Select value={formData.project} onValueChange={(value) => handleSelectChange("project", value)}>
                  <SelectTrigger id="project">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {approvedProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Account Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter a name for this ad account"
                required
                disabled={approvedProjects.length === 0}
              />
            </div>

            <div className="grid gap-2">
              <Label>No. of accounts</Label>
              <div className="flex items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleAccountCountChange(false)}
                  disabled={formData.accountCount <= 1 || approvedProjects.length === 0}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M5 12h14"></path>
                  </svg>
                </Button>
                <div className="w-16 mx-2">
                  <Input
                    className="text-center"
                    value={formData.accountCount}
                    readOnly
                    disabled={approvedProjects.length === 0}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleAccountCountChange(true)}
                  disabled={formData.accountCount >= 10 || approvedProjects.length === 0}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M5 12h14"></path>
                    <path d="M12 5v14"></path>
                  </svg>
                </Button>
              </div>
            </div>

            <div className="mt-2 p-4 rounded-md bg-muted">
              <h4 className="text-sm font-medium mb-2">Business Manager Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Business Manager ID</Label>
                  <div className="text-sm mt-1">{formData.project ? "123456789" : "Select a project"}</div>
                </div>
                <div>
                  <Label className="text-xs">Timezone</Label>
                  <div className="text-sm mt-1">{formData.project ? "Eastern Time (ET)" : "Select a project"}</div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.project || !formData.name || approvedProjects.length === 0}>
              Create {formData.accountCount} Account{formData.accountCount > 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
