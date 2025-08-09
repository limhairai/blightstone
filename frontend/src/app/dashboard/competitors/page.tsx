"use client"

import React, { useState } from "react"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Eye, Edit3, ExternalLink } from "lucide-react"
import { useProjectStore } from "@/lib/stores/project-store"
// Lazy load the brief page for better performance
const CompetitorBriefPage = React.lazy(() => import("@/components/competitors/competitor-brief-page"))

// Define the interface for a Competitor entry
interface Competitor {
  id: string
  name: string
  websiteUrl: string
  adLibraryLink: string
  market: string // e.g., "USA"
  offerUrl: string
  trafficVolume: string // e.g., "100K-500K", "50K"
  level: "Poor" | "Medium" | "High"
  projectId: string // Add project association
  notes?: string // Quick notes about the competitor
}

export default function CompetitorsPage() {
  const { currentProjectId, getCompetitorsForProject, addCompetitor } = useProjectStore()
  const projectCompetitors = currentProjectId ? getCompetitorsForProject(currentProjectId) : []

  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null)
  const [notesEditingCompetitor, setNotesEditingCompetitor] = useState<Competitor | null>(null)
  const [tempNotes, setTempNotes] = useState("")

  const handleUpdateCompetitor = (updatedCompetitor: Competitor) => {
    if (!currentProjectId) return
    
    if (updatedCompetitor.id === "new-competitor-temp-id") {
      const newCompetitorWithId = { 
        ...updatedCompetitor, 
        id: Date.now().toString(),
        projectId: currentProjectId
      }
      
      // Convert to store format
      const competitorData = {
        id: newCompetitorWithId.id,
        name: newCompetitorWithId.name,
        website: newCompetitorWithId.websiteUrl,
        strengths: `Level: ${newCompetitorWithId.level}, Market: ${newCompetitorWithId.market}`,
        weaknesses: "To be analyzed",
        pricing: "Unknown",
        projectId: currentProjectId
      }
      
      addCompetitor(competitorData)
      setSelectedCompetitor(null)
    } else {
      // TODO: Implement update functionality in the store
      setSelectedCompetitor(null)
    }
  }

  const handleDeleteCompetitor = (competitorId: string) => {
    // TODO: Implement delete functionality in the store
    setSelectedCompetitor(null)
  }

  const handleNewCompetitorClick = () => {
    setSelectedCompetitor({
      id: "new-competitor-temp-id",
      name: "",
      websiteUrl: "",
      adLibraryLink: "",
      market: "USA",
      offerUrl: "",
      trafficVolume: "",
      level: "Medium", // Default level
      projectId: currentProjectId || "",
      notes: ""
    })
  }

  const handleNotesEdit = (competitor: Competitor) => {
    setNotesEditingCompetitor(competitor)
    setTempNotes(competitor.notes || "")
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
            {projectCompetitors.map((competitor) => (
              <TableRow key={competitor.id}>
                <TableCell className="font-medium">{competitor.name}</TableCell>
                <TableCell>{competitor.website}</TableCell>
                <TableCell>{(typeof competitor.strengths === 'string' ? competitor.strengths.split(', ')[1]?.replace('Market: ', '') : null) || 'Unknown'}</TableCell>
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
                          websiteUrl: competitor.website,
                          adLibraryLink: "",
                          market: (typeof competitor.strengths === 'string' ? competitor.strengths.split(', ')[1]?.replace('Market: ', '') : null) || 'USA',
                          offerUrl: "",
                          trafficVolume: "",
                          level: ((typeof competitor.strengths === 'string' ? competitor.strengths.split(', ')[0]?.replace('Level: ', '') : null) || "Medium") as "Poor" | "Medium" | "High",
                          projectId: competitor.projectId,
                          notes: ""
                        })
                      }}
                      className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => {
                    // Convert from store format to Competitor format for editing
                    setSelectedCompetitor({
                      id: competitor.id,
                      name: competitor.name,
                      websiteUrl: competitor.website,
                      adLibraryLink: "",
                      market: (typeof competitor.strengths === 'string' ? competitor.strengths.split(', ')[1]?.replace('Market: ', '') : null) || 'USA',
                      offerUrl: "",
                      trafficVolume: "",
                      level: ((typeof competitor.strengths === 'string' ? competitor.strengths.split(', ')[0]?.replace('Level: ', '') : null) || "Medium") as "Poor" | "Medium" | "High",
                      projectId: competitor.projectId
                    })
                  }}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
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

      {/* Competitor Brief Page (Full-screen overlay like Facebook Ads Manager) */}
      {selectedCompetitor && (
        <React.Suspense fallback={<div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center">Loading...</div>}>
          <CompetitorBriefPage
            competitor={selectedCompetitor}
            onClose={() => setSelectedCompetitor(null)}
            onUpdateCompetitor={handleUpdateCompetitor}
            onDeleteCompetitor={handleDeleteCompetitor}
            NEW_COMPETITOR_ID="new-competitor-temp-id"
          />
        </React.Suspense>
      )}
    </div>
  )
}