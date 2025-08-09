"use client"

import React, { useState } from "react"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Eye, Edit3 } from "lucide-react"
import { useProjectStore } from "@/lib/stores/project-store"
// Lazy load the brief page for better performance
const PersonaBriefPage = React.lazy(() => import("@/components/personas/persona-brief-page"))

// Define the interface for a Persona entry
interface Persona {
  id: string
  name: string // Persona Type (Naming) - e.g., "Catherine (Mom, 35-50, stressed, sleep-deprived)"
  ageGenderLocation: string // Age, Gender, Location - e.g., "Female - 35/60 - United States"
  dailyStruggles: string // What are their day to day struggles?
  desiredCharacteristics: string // What are some of the characteristics your prospect wants others to see in them?
  desiredSocialStatus: string // What status does your prospect want to achieve in society?
  productHelpAchieveStatus: string // How does our product help them achieve that status or characteristic?
  beliefsToOvercome: string // What are some beliefs our prospect has that we need to overcome?
  failedSolutions: string // What are other solutions that they have tried and failed at and why?
  marketAwareness: string // What is their market awareness?
  marketSophistication: string // What is their market sophistication?
  insecurities: string // What are the personas insecurities?
  mindset: string // What is her mindset?
  deeperPainPoints: string // What are deeper pain points of her?
  hiddenSpecificDesires: string // What are her Hidden/Specific Desires
  objections: string // What are her objections?
  angle: string // New: The specific angle to approach this persona
  dominoStatement: string // New: The key idea that unlocks their skepticism
  projectId: string // Add project association
  notes?: string // Quick notes about the persona
}

export default function PersonasPage() {
  const { currentProjectId, getAvatarsForProject, addAvatar } = useProjectStore()
  const projectAvatars = currentProjectId ? getAvatarsForProject(currentProjectId) : []

  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)
  const [notesEditingPersona, setNotesEditingPersona] = useState<Persona | null>(null)
  const [tempNotes, setTempNotes] = useState("")

  const handleUpdatePersona = (updatedPersona: Persona) => {
    if (!currentProjectId) return
    
    // Convert from new Persona format to existing CustomerAvatar format for the store
    const avatarData = {
      id: updatedPersona.id === "new-persona-temp-id" ? Date.now().toString() : updatedPersona.id,
      name: updatedPersona.name,
      description: `${updatedPersona.ageGenderLocation} - ${updatedPersona.dailyStruggles}`,
      painPoints: updatedPersona.deeperPainPoints,
      desires: updatedPersona.hiddenSpecificDesires,
      objections: updatedPersona.objections,
      projectId: currentProjectId
    }

    addAvatar(avatarData)
    setSelectedPersona(null)
  }

  const handleDeletePersona = (personaId: string) => {
    // TODO: Implement delete functionality in the store
    setSelectedPersona(null)
  }

  const handleNewPersonaClick = () => {
    setSelectedPersona({
      id: "new-persona-temp-id",
      name: "",
      ageGenderLocation: "",
      dailyStruggles: "",
      desiredCharacteristics: "",
      desiredSocialStatus: "",
      productHelpAchieveStatus: "",
      beliefsToOvercome: "",
      failedSolutions: "",
      marketAwareness: "",
      marketSophistication: "",
      insecurities: "",
      mindset: "",
      deeperPainPoints: "",
      hiddenSpecificDesires: "",
      objections: "",
      angle: "",
      dominoStatement: "",
      projectId: currentProjectId || "",
      notes: ""
    })
  }

  const handleNotesEdit = (persona: Persona) => {
    setNotesEditingPersona(persona)
    setTempNotes(persona.notes || "")
  }

  const handleNotesSave = () => {
    if (notesEditingPersona) {
      // For now, just update the local state since we don't have full CRUD operations
      setNotesEditingPersona(null)
      setTempNotes("")
    }
  }

  const handleNotesCancel = () => {
    setNotesEditingPersona(null)
    setTempNotes("")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-start">
        <Button onClick={handleNewPersonaClick} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Plus className="h-4 w-4 mr-2" />
          New Persona
        </Button>
      </div>
      
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Persona Type (Naming)</TableHead>
              <TableHead>Age, Gender, Location</TableHead>
              <TableHead>Awareness Stage</TableHead>
              <TableHead>Domino Statement</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projectAvatars.map((avatar) => (
              <TableRow key={avatar.id}>
                <TableCell className="font-medium">{avatar.name}</TableCell>
                <TableCell>{`${avatar.gender || "Unknown"} - ${avatar.age || "Unknown"} - ${avatar.location || "Unknown"}`}</TableCell>
                <TableCell>
                  <span className="px-2 py-1 bg-muted rounded text-xs">
                    {(avatar.awareness || "Problem Aware").replace(" Aware", "")}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground italic">
                  {/* For now showing mindset as a placeholder for domino statement */}
                  {avatar.mindset ? avatar.mindset.substring(0, 80) + "..." : "No domino statement defined"}
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
                          id: avatar.id,
                          name: avatar.name,
                          ageGenderLocation: avatar.description?.split(' - ')[0] || "",
                          dailyStruggles: avatar.description?.split(' - ')[1] || "",
                          desiredCharacteristics: "",
                          desiredSocialStatus: "",
                          productHelpAchieveStatus: "",
                          beliefsToOvercome: "",
                          failedSolutions: "",
                          marketAwareness: "",
                          marketSophistication: "",
                          insecurities: "",
                          mindset: "",
                          deeperPainPoints: avatar.painPoints,
                          hiddenSpecificDesires: avatar.desires,
                          objections: avatar.objections,
                          angle: "",
                          dominoStatement: "",
                          projectId: avatar.projectId,
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
                    // Convert from CustomerAvatar to Persona format for editing
                    setSelectedPersona({
                      id: avatar.id,
                      name: avatar.name,
                      ageGenderLocation: avatar.description?.split(' - ')[0] || "",
                      dailyStruggles: avatar.description?.split(' - ')[1] || "",
                      desiredCharacteristics: "",
                      desiredSocialStatus: "",
                      productHelpAchieveStatus: "",
                      beliefsToOvercome: "",
                      failedSolutions: "",
                      marketAwareness: "",
                      marketSophistication: "",
                      insecurities: "",
                      mindset: "",
                      deeperPainPoints: avatar.painPoints,
                      hiddenSpecificDesires: avatar.desires,
                      objections: avatar.objections,
                      angle: "",
                      dominoStatement: "",
                      projectId: avatar.projectId
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
      <Dialog open={!!notesEditingPersona} onOpenChange={() => setNotesEditingPersona(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Persona: <span className="font-medium">{notesEditingPersona?.name}</span>
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

      {/* Persona Brief Page (Full-screen overlay like Facebook Ads Manager) */}
      {selectedPersona && (
        <React.Suspense fallback={<div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center">Loading...</div>}>
          <PersonaBriefPage
            persona={selectedPersona}
            onClose={() => setSelectedPersona(null)}
            onUpdatePersona={handleUpdatePersona}
            onDeletePersona={handleDeletePersona}
            NEW_PERSONA_ID="new-persona-temp-id"
          />
        </React.Suspense>
      )}
    </div>
  )
}