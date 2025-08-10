"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertTriangle, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { projectsApi } from "@/lib/api"

interface DeleteProjectDialogProps {
  project: { id: string; name: string } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onProjectDeleted: (projectId: string) => void
}

export function DeleteProjectDialog({ project, open, onOpenChange, onProjectDeleted }: DeleteProjectDialogProps) {
  const [confirmationText, setConfirmationText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const handleClose = () => {
    setConfirmationText("")
    setIsDeleting(false)
    onOpenChange(false)
  }

  const handleDelete = async () => {
    if (!project || confirmationText !== project.name) {
      toast.error("Please type the project name exactly to confirm deletion")
      return
    }

    setIsDeleting(true)
    try {
      await projectsApi.delete(project.id)
      toast.success(`Project "${project.name}" has been deleted`)
      onProjectDeleted(project.id)
      handleClose()
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error("Failed to delete project. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  const isConfirmationValid = confirmationText === project?.name
  const canDelete = isConfirmationValid && !isDeleting

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Project
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <p>
              This action cannot be undone. This will permanently delete the project{" "}
              <strong>"{project?.name}"</strong> and remove all associated data including:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
              <li>All tasks and their details</li>
              <li>All personas and customer avatars</li>
              <li>All competitor analysis data</li>
              <li>All creative tracker entries</li>
              <li>All project settings and configurations</li>
            </ul>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800 font-medium">
              To confirm deletion, please type the project name exactly:
            </p>
            <p className="text-sm font-mono bg-red-100 px-2 py-1 rounded mt-1">
              {project?.name}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmation">Project name</Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Type the project name to confirm"
              className={confirmationText && !isConfirmationValid ? "border-red-300" : ""}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!canDelete}
            className="gap-2"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete Project
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}