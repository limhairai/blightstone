"use client"

import React, { useState } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, FolderPlus } from "lucide-react"
import { useProjectStore } from "@/lib/stores/project-store"
import { useAuth } from "@/contexts/AuthContext"
import { projectsApi } from "@/lib/api"

interface ProjectCreationDialogProps {
  isOpen: boolean
  onClose: () => void
}

export default function ProjectCreationDialog({ isOpen, onClose }: ProjectCreationDialogProps) {
  const [mounted, setMounted] = useState(false)
  const { addProject, setCurrentProjectId } = useProjectStore()
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active" as "active" | "paused" | "completed"
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  React.useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setIsSubmitting(true)
    
    try {
      // Create project via API
      const newProject = await projectsApi.create({
        name: formData.name.trim(),
        description: formData.description.trim(),
        status: formData.status,
        user_id: user?.id || "",
        created_by: user?.email || "Unknown"
      })

      // Add to store and set as current
      addProject(newProject)
      setCurrentProjectId(newProject.id)
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        status: "active"
      })
      
      onClose()
    } catch (error) {
      console.error('Error creating project:', error)
      // You could add toast notification here
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      status: "active"
    })
    onClose()
  }

  if (!mounted || !isOpen) return null

  const dialogContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-background border border-border rounded-lg shadow-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
              <FolderPlus className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Create New Project</h2>
              <p className="text-sm text-muted-foreground">Set up a new project for your team</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="hover:bg-[#F5F5F5]"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name *</Label>
            <Input
              id="project-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter project name"
              required
              className="border-border focus:border-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this project is about..."
              rows={3}
              className="border-border focus:border-foreground resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value: "active" | "paused" | "completed") => 
                setFormData(prev => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger className="border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || !formData.name.trim()}
            >
              {isSubmitting ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(dialogContent, document.body)
}