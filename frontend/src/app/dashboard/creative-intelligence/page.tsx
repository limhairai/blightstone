"use client"

import React, { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog"
import { Plus, Brain, Eye, ExternalLink, Edit3, Image, Video, FileText, Trash2 } from "lucide-react"
// Lazy load the brief page for better performance
const CreativeIntelligenceBriefPage = React.lazy(() => import("@/components/creative-intelligence/creative-intelligence-brief-page"))

import { creativeIntelligenceApi } from "@/lib/api"
import { useProjectStore } from "@/lib/stores/project-store"

// Import interfaces from project store
import { CreativeIntelligence } from "@/lib/stores/project-store"

// Define a constant for a new creative's temporary ID
const NEW_CREATIVE_ID = "new-creative-temp-id"

export default function CreativeIntelligencePage() {
  // Project store
  const { currentProjectId } = useProjectStore()

  
  // State for real data
  const [creatives, setCreatives] = useState<CreativeIntelligence[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Fetch creatives for current project
  useEffect(() => {
    const fetchCreatives = async () => {
      if (!currentProjectId) {
        setCreatives([])
        return
      }
      
      setLoading(true)
      setError(null)
      try {
        const fetchedCreatives = await creativeIntelligenceApi.getByProject(currentProjectId)
        setCreatives(fetchedCreatives)
      } catch (err) {
        console.error('Failed to fetch creatives:', err)
        setError('Failed to load creatives')
      } finally {
        setLoading(false)
      }
    }

    fetchCreatives()
  }, [currentProjectId]) // Refetch when project changes
  
  // UI State
  const [selectedCreative, setSelectedCreative] = useState<CreativeIntelligence | null>(null)
  const [showBrief, setShowBrief] = useState(false)
  const [notesDialog, setNotesDialog] = useState<{ open: boolean; creative: CreativeIntelligence | null }>({ open: false, creative: null })
  const [notesText, setNotesText] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [creativeToDelete, setCreativeToDelete] = useState<CreativeIntelligence | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleNewCreative = () => {
    const newCreative: CreativeIntelligence = {
      id: NEW_CREATIVE_ID,
      projectId: currentProjectId || "",
      createdBy: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      title: "",
      platform: "facebook",
      creativeType: "image",
      isTemplate: false,
      status: "active",
      creativeCategory: "concept_gold"
    }
    setSelectedCreative(newCreative)
    setShowBrief(true)
  }

  const handleViewCreative = (creative: CreativeIntelligence) => {
    setSelectedCreative(creative)
    setShowBrief(true)
  }

  const handleUpdateCreative = async (updatedCreative: CreativeIntelligence) => {
    try {
      if (updatedCreative.id === NEW_CREATIVE_ID) {
        // Creating a new creative
        const { id, ...creativeData } = updatedCreative
        const newCreative = await creativeIntelligenceApi.create({
          ...creativeData,
          projectId: currentProjectId || undefined
        })
        // Add to state
        setCreatives(prev => [...prev, newCreative])
      } else {
        // Updating existing creative
        const updated = await creativeIntelligenceApi.update(updatedCreative.id, updatedCreative)
        setCreatives(prev => prev.map(creative => creative.id === updated.id ? updated : creative))
      }
      setSelectedCreative(null)
      setShowBrief(false)
    } catch (error) {
      console.error('Error updating creative:', error)
      alert('Failed to save creative. Please try again.')
    }
  }

  const handleDeleteClick = (creative: CreativeIntelligence) => {
    setCreativeToDelete(creative)
    setDeleteDialogOpen(true)
  }

  const handleDeleteCreative = async () => {
    if (!creativeToDelete) return
    
    setIsDeleting(true)
    try {
      await creativeIntelligenceApi.delete(creativeToDelete.id)
      setCreatives(prev => prev.filter(creative => creative.id !== creativeToDelete.id))
      if (selectedCreative && selectedCreative.id === creativeToDelete.id) {
        setSelectedCreative(null)
        setShowBrief(false)
      }
    } catch (error) {
      console.error('Error deleting creative:', error)
      alert('Failed to delete creative. Please try again.')
    } finally {
      setIsDeleting(false)
      setCreativeToDelete(null)
    }
  }

  const handleNotesEdit = (creative: CreativeIntelligence) => {
    setNotesDialog({ open: true, creative })
    setNotesText(creative.performanceNotes || "")
  }

  const handleNotesSave = async () => {
    if (!notesDialog.creative) return
    
    try {
      const updatedCreative = { ...notesDialog.creative, performanceNotes: notesText }
      await creativeIntelligenceApi.update(notesDialog.creative.id, updatedCreative)
      setCreatives(prev => prev.map(creative => 
        creative.id === notesDialog.creative!.id ? { ...creative, performanceNotes: notesText } : creative
      ))
      setNotesDialog({ open: false, creative: null })
      setNotesText("")
    } catch (error) {
      console.error('Error updating notes:', error)
      alert('Failed to update notes. Please try again.')
    }
  }

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      hook_library: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      winning_angles: "bg-green-100 text-green-800 hover:bg-green-200", 
      concept_gold: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
      script_templates: "bg-purple-100 text-purple-800 hover:bg-purple-200",
      headline_formulas: "bg-pink-100 text-pink-800 hover:bg-pink-200",
      visual_patterns: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
    }
    return colors[category] || colors.concept_gold
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "template":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200"
      case "archived":
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  const getCreativeTypeIcon = (type: string) => {
    switch (type) {
      case "image":
        return <Image className="h-4 w-4" />
      case "video":
        return <Video className="h-4 w-4" />
      case "carousel":
        return <FileText className="h-4 w-4" />
      default:
        return <Image className="h-4 w-4" />
    }
  }

  const formatCategoryName = (category: string) => {
    if (!category) return 'Unknown Category'
    return category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }



  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">
          Loading creative intelligence...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button onClick={handleNewCreative} className="gap-2">
          <Plus className="h-4 w-4" />
          New Creative
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Hook Pattern</TableHead>
                <TableHead>Angle</TableHead>
                <TableHead>Psychology Trigger</TableHead>

                <TableHead>Notes</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creatives.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No creative intelligence found. Create your first creative to start building your intelligence library.
                  </TableCell>
                </TableRow>
              ) : (
                creatives.map((creative) => (
                  <TableRow 
                    key={creative.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewCreative(creative)}
                  >
                    <TableCell className="font-medium">{creative.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getCreativeTypeIcon(creative.creativeType)}
                        <span className="capitalize">{creative.creativeType}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoryBadgeColor(creative.creativeCategory)}>
                        {formatCategoryName(creative.creativeCategory)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">{creative.hookPattern || "-"}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{creative.angle || "-"}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{creative.psychologyTrigger || "-"}</TableCell>

                    <TableCell className="max-w-[150px] truncate">
                      {creative.performanceNotes ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleNotesEdit(creative)
                          }}
                          className="h-6 px-2 text-xs"
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          {creative.performanceNotes.slice(0, 20)}...
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleNotesEdit(creative)
                          }}
                          className="h-6 px-2 text-xs text-muted-foreground"
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          Add notes
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewCreative(creative)
                          }}
                          title="View creative"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteClick(creative)
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete creative"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Brief Dialog */}
      {showBrief && selectedCreative && (
        <React.Suspense fallback={<div>Loading...</div>}>
          <CreativeIntelligenceBriefPage
            creative={selectedCreative}
            onClose={() => {
              setShowBrief(false)
              setSelectedCreative(null)
            }}
            onUpdateCreative={handleUpdateCreative}
            isNewCreative={selectedCreative.id === NEW_CREATIVE_ID}
          />
        </React.Suspense>
      )}

      {/* Notes Edit Dialog */}
      <Dialog open={notesDialog.open} onOpenChange={(open) => !open && setNotesDialog({ open: false, creative: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Performance Notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Add notes about why this creative worked, performance context, etc..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesDialog({ open: false, creative: null })}>
              Cancel
            </Button>
            <Button onClick={handleNotesSave}>
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Creative"
        itemName={creativeToDelete?.title}
        onConfirm={handleDeleteCreative}
        isLoading={isDeleting}
      />
    </div>
  )
}