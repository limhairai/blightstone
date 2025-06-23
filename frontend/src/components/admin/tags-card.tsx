import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Label } from "../ui/label"
import { Plus, X, Edit } from "lucide-react"

interface TagsCardProps {
  tags: string[]
  orgId?: string
  onTagsChange?: (tags: string[]) => void
}

export function TagsCard({ tags, orgId, onTagsChange }: TagsCardProps) {
  const [localTags, setLocalTags] = useState<string[]>(tags || [])
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [newTag, setNewTag] = useState("")
  const [editingTag, setEditingTag] = useState("")
  const [editingIndex, setEditingIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const updateTags = async (updatedTags: string[]) => {
    if (orgId) {
      try {
        setLoading(true)
        setError("")
        const response = await fetch(`/api/v1/organizations/${orgId}/tags`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tags: updatedTags }),
        })
        
        if (!response.ok) throw new Error("Failed to update tags")
        
        setLocalTags(updatedTags)
        onTagsChange?.(updatedTags)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update tags")
      } finally {
        setLoading(false)
      }
    } else {
      // If no orgId, just update locally
      setLocalTags(updatedTags)
      onTagsChange?.(updatedTags)
    }
  }

  const handleAddTag = async () => {
    if (!newTag.trim()) return
    
    const trimmedTag = newTag.trim()
    if (localTags.includes(trimmedTag)) {
      setError("Tag already exists")
      return
    }

    const updatedTags = [...localTags, trimmedTag]
    await updateTags(updatedTags)
    
    if (!error) {
      setNewTag("")
      setAddDialogOpen(false)
    }
  }

  const handleEditTag = (index: number) => {
    setEditingIndex(index)
    setEditingTag(localTags[index])
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingTag.trim() || editingIndex === -1) return
    
    const trimmedTag = editingTag.trim()
    if (localTags.includes(trimmedTag) && localTags[editingIndex] !== trimmedTag) {
      setError("Tag already exists")
      return
    }

    const updatedTags = [...localTags]
    updatedTags[editingIndex] = trimmedTag
    await updateTags(updatedTags)
    
    if (!error) {
      setEditDialogOpen(false)
      setEditingIndex(-1)
      setEditingTag("")
    }
  }

  const handleRemoveTag = async (index: number) => {
    const tagToRemove = localTags[index]
    if (!confirm(`Are you sure you want to remove the tag "${tagToRemove}"?`)) return
    
    const updatedTags = localTags.filter((_, i) => i !== index)
    await updateTags(updatedTags)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Tags</CardTitle>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-8 w-8 p-0">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Tag</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}
              <div>
                <Label htmlFor="new-tag">Tag Name</Label>
                <Input
                  id="new-tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Enter tag name"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTag()
                    if (e.key === 'Escape') setAddDialogOpen(false)
                  }}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddTag} disabled={!newTag.trim() || loading}>
                  {loading ? "Adding..." : "Add Tag"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {localTags && localTags.length ? (
          localTags.map((tag, i) => (
            <div key={i} className="flex items-center gap-1">
              <Badge 
                variant="outline" 
                className="bg-blue-100 text-blue-800 border-blue-200 cursor-pointer hover:bg-blue-200"
                onClick={() => handleEditTag(i)}
              >
                {tag}
                <Edit className="h-3 w-3 ml-1" />
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0 hover:bg-red-100"
                onClick={() => handleRemoveTag(i)}
              >
                <X className="h-3 w-3 text-red-600" />
              </Button>
            </div>
          ))
        ) : (
          <span className="text-xs text-muted-foreground">No tags</span>
        )}

        {/* Edit Tag Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Tag</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}
              <div>
                <Label htmlFor="edit-tag">Tag Name</Label>
                <Input
                  id="edit-tag"
                  value={editingTag}
                  onChange={(e) => setEditingTag(e.target.value)}
                  placeholder="Enter tag name"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit()
                    if (e.key === 'Escape') setEditDialogOpen(false)
                  }}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={!editingTag.trim() || loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
} 