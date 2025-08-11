"use client"

import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog"
import { Plus, Eye, Edit3, ExternalLink, Trash2 } from "lucide-react"

import { competitorsApi } from "@/lib/api"
import { useProjectStore } from "@/lib/stores/project-store"
// Lazy load the brief page for better performance
const CompetitorBriefPage = React.lazy(() => import("@/components/competitors/competitor-brief-page"))

// Import the Competitor interface from the store
import { Competitor } from "@/lib/stores/project-store"

// Define the interface for the brief page (different from store)
interface CompetitorBrief {
  id: string
  name: string
  website: string
  adLibraryLink: string
  market: string // e.g., "USA"
  offerUrl: string
  trafficVolume: string // e.g., "100K-500K", "50K"
  level: "poor" | "medium" | "high"
  projectId: string // Add project association
  notes?: string // Quick notes about the competitor
}

export default function CompetitorsPage() {
  // Project store
  const { currentProjectId } = useProjectStore()

  
  const [competitors, setCompetitors] = useState<CompetitorBrief[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorBrief | null>(null)
  const [notesEditingCompetitor, setNotesEditingCompetitor] = useState<CompetitorBrief | null>(null)
  const [tempNotes, setTempNotes] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [competitorToDelete, setCompetitorToDelete] = useState<CompetitorBrief | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch competitors for current project
  useEffect(() => {
    const fetchCompetitors = async () => {
      if (!currentProjectId) {
        setCompetitors([])
        return
      }
      
      setLoading(true)
      setError(null)
      try {
        const fetchedCompetitors = await competitorsApi.getByProject(currentProjectId)
        // Convert API data to local CompetitorBrief format
        const convertedCompetitors: CompetitorBrief[] = fetchedCompetitors.map((competitor: any) => ({
          id: competitor.id,
          name: competitor.name,
          website: competitor.websiteUrl || competitor.website_url || "",
          adLibraryLink: competitor.adLibraryLink || competitor.ad_library_link || "",
          market: competitor.market || "",
          offerUrl: competitor.offerUrl || competitor.offer_url || "",
          trafficVolume: competitor.trafficVolume || competitor.traffic_volume || "",
          level: (competitor.level || "medium") as "poor" | "medium" | "high",
          projectId: competitor.projectId || competitor.project_id || currentProjectId,
          notes: competitor.notes || ""
        }))
        setCompetitors(convertedCompetitors)
      } catch (err) {
        setError('Failed to fetch competitors')
        console.error('Error fetching competitors:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCompetitors()
  }, [currentProjectId]) // Refetch when project changes

  const handleUpdateCompetitor = async (updatedCompetitor: CompetitorBrief) => {
    try {
      if (updatedCompetitor.id === "new-competitor-temp-id") {
        // Creating a new competitor
        const { id, ...competitorData } = updatedCompetitor
        const newCompetitor = await competitorsApi.create({
          ...competitorData,
          projectId: currentProjectId
        })
        // Convert back to local format and add to state
        const convertedCompetitor: CompetitorBrief = {
          id: newCompetitor.id,
          name: newCompetitor.name,
          website: newCompetitor.websiteUrl || newCompetitor.website_url || "",
          adLibraryLink: newCompetitor.adLibraryLink || newCompetitor.ad_library_link || "",
          market: newCompetitor.market || "",
          offerUrl: newCompetitor.offerUrl || newCompetitor.offer_url || "",
          trafficVolume: newCompetitor.trafficVolume || newCompetitor.traffic_volume || "",
          level: (newCompetitor.level || "medium") as "poor" | "medium" | "high",
          projectId: newCompetitor.projectId || "00000000-0000-0000-0000-000000000001",
          notes: newCompetitor.notes || ""
        }
        setCompetitors(prev => [...prev, convertedCompetitor])
      } else {
        // Updating existing competitor
        const updated = await competitorsApi.update(updatedCompetitor.id, updatedCompetitor)
        setCompetitors(prev => prev.map(competitor => competitor.id === updated.id ? { ...competitor, ...updatedCompetitor } : competitor))
      }
      setSelectedCompetitor(null)
    } catch (error) {
      console.error('Error updating competitor:', error)
      alert('Failed to save competitor. Please try again.')
    }
  }



  const handleNewCompetitorClick = () => {
    setSelectedCompetitor({
      id: "new-competitor-temp-id",
      name: "",
      website: "",
      adLibraryLink: "",
      market: "USA",
      offerUrl: "",
      trafficVolume: "",
      level: "medium", // Default level
      projectId: currentProjectId || "",
      notes: ""
    })
  }

  const handleNotesEdit = (competitor: CompetitorBrief) => {
    setNotesEditingCompetitor(competitor)
    setTempNotes(competitor.notes || "")
  }

  const handleDeleteClick = (competitor: CompetitorBrief) => {
    setCompetitorToDelete(competitor)
    setDeleteDialogOpen(true)
  }

  const handleDeleteCompetitor = async () => {
    if (!competitorToDelete) return
    
    setIsDeleting(true)
    try {
      await competitorsApi.delete(competitorToDelete.id)
      setCompetitors(prev => prev.filter(competitor => competitor.id !== competitorToDelete.id))
      if (selectedCompetitor && selectedCompetitor.id === competitorToDelete.id) {
        setSelectedCompetitor(null)
      }
    } catch (error) {
      console.error('Error deleting competitor:', error)
      alert('Failed to delete competitor. Please try again.')
    } finally {
      setIsDeleting(false)
      setCompetitorToDelete(null)
    }
  }

  const handleNotesSave = () => {
    if (notesEditingCompetitor) {
      // For now, just update the local state since we don't have full CRUD operations
      setNotesEditingCompetitor(null)
      setTempNotes("")
    }
  }

  const handleNotesCancel = () => {
    setNotesEditingCompetitor(null)
    setTempNotes("")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-start">
        <Button onClick={handleNewCompetitorClick} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Plus className="h-4 w-4 mr-2" />
          New Competitor
        </Button>
      </div>
      
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Competitor Name</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>Market</TableHead>
              <TableHead>Ads Library</TableHead>
              <TableHead>Offer URL</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
                          {competitors.map((competitor) => (
              <TableRow key={competitor.id}>
                <TableCell className="font-medium">{competitor.name}</TableCell>
                <TableCell>{competitor.website}</TableCell>
                <TableCell>{competitor.market || 'Unknown'}</TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => window.open("https://facebook.com/ads/library", '_blank')}
                    className="text-blue-600 hover:text-blue-800 p-0 h-auto"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Ads Library
                  </Button>
                </TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => window.open(competitor.website, '_blank')}
                    className="text-blue-600 hover:text-blue-800 p-0 h-auto"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Offer
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="max-w-24 truncate text-sm text-muted-foreground">
                      No notes
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleNotesEdit({
                          id: competitor.id,
                          name: competitor.name,
                          website: competitor.website,
                          adLibraryLink: competitor.adLibraryLink || "",
                          market: competitor.market || 'USA',
                          offerUrl: competitor.offerUrl || "",
                          trafficVolume: competitor.trafficVolume || "",
                          level: competitor.level || "Medium",
                          projectId: competitor.projectId,
                          notes: competitor.notes || ""
                        })
                      }}
                      className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={() => {
                      // Convert from store format to Competitor format for editing
                      setSelectedCompetitor({
                        id: competitor.id,
                        name: competitor.name,
                        website: competitor.website,
                        adLibraryLink: competitor.adLibraryLink || "",
                        market: competitor.market || 'USA',
                        offerUrl: competitor.offerUrl || "",
                        trafficVolume: competitor.trafficVolume || "",
                        level: competitor.level || "Medium",
                        projectId: competitor.projectId
                      })
                    }}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteClick(competitor)
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Delete competitor"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Notes Edit Dialog */}
      <Dialog open={!!notesEditingCompetitor} onOpenChange={() => setNotesEditingCompetitor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Competitor: <span className="font-medium">{notesEditingCompetitor?.name}</span>
              </p>
              <Textarea
                value={tempNotes}
                onChange={(e) => setTempNotes(e.target.value)}
                placeholder="Add your notes here..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleNotesCancel}>
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
        title="Delete Competitor"
        itemName={competitorToDelete?.name}
        onConfirm={handleDeleteCompetitor}
        isLoading={isDeleting}
      />

      {/* Competitor Brief Page (Full-screen overlay like Facebook Ads Manager) */}
      {selectedCompetitor && (
        <React.Suspense fallback={<div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center">Loading...</div>}>
          <CompetitorBriefPage
            competitor={selectedCompetitor}
            onClose={() => setSelectedCompetitor(null)}
            onUpdateCompetitor={handleUpdateCompetitor}
            onDeleteCompetitor={(competitorId: string) => {
              const competitor = competitors.find(c => c.id === competitorId)
              if (competitor) handleDeleteClick(competitor)
            }}
            NEW_COMPETITOR_ID="new-competitor-temp-id"
          />
        </React.Suspense>
      )}
    </div>
  )
}