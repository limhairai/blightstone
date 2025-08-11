"use client"

import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog"
import { Plus, Eye, Edit3, Trash2 } from "lucide-react"
import { CustomerAvatar } from "@/lib/stores/project-store"
import { personasApi } from "@/lib/api"
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
  description: string // Description of the persona
  projectId: string // Add project association
  notes?: string // Quick notes about the persona
}

export default function PersonasPage() {

  
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)
  const [notesEditingPersona, setNotesEditingPersona] = useState<Persona | null>(null)
  const [tempNotes, setTempNotes] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [personaToDelete, setPersonaToDelete] = useState<Persona | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch all personas for shared view
  useEffect(() => {
    const fetchPersonas = async () => {
      setLoading(true)
      setError(null)
      try {
        const fetchedPersonas = await personasApi.getAll()
        // Convert API data to local Persona format
        const convertedPersonas: Persona[] = fetchedPersonas.map((persona: any) => ({
          id: persona.id,
          name: persona.name,
          ageGenderLocation: persona.ageGenderLocation || persona.age_gender_location || "",
          dailyStruggles: persona.dailyStruggles || persona.daily_struggles || "",
          desiredCharacteristics: persona.desiredCharacteristics || persona.desired_characteristics || "",
          desiredSocialStatus: persona.desiredSocialStatus || persona.desired_social_status || "",
          productHelpAchieveStatus: persona.productHelpAchieveStatus || persona.product_help_achieve_status || "",
          beliefsToOvercome: persona.beliefsToOvercome || persona.beliefs_to_overcome || "",
          failedSolutions: persona.failedSolutions || persona.failed_solutions || "",
          marketAwareness: persona.marketAwareness || persona.market_awareness || "",
          marketSophistication: persona.marketSophistication || persona.market_sophistication || "",
          insecurities: persona.insecurities || "",
          mindset: persona.mindset || "",
          deeperPainPoints: persona.deeperPainPoints || persona.deeper_pain_points || "",
          hiddenSpecificDesires: persona.hiddenSpecificDesires || persona.hidden_specific_desires || "",
          objections: persona.objections || "",
          angle: persona.angle || "",
          dominoStatement: persona.dominoStatement || persona.domino_statement || "",
          description: persona.description || "",
          projectId: persona.projectId || persona.project_id || "shared",
          notes: persona.notes || ""
        }))
        setPersonas(convertedPersonas)
      } catch (err) {
        setError('Failed to fetch personas')
        console.error('Error fetching personas:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPersonas()
  }, []) // No project dependency - load once

  const handleUpdatePersona = async (updatedPersona: Persona) => {
    try {
      if (updatedPersona.id === "new-persona-temp-id") {
        // Creating a new persona
        const { id, ...personaData } = updatedPersona
        const newPersona = await personasApi.create({
          ...personaData,
          projectId: "shared"
        })
        // Convert back to local format and add to state
        const convertedPersona: Persona = {
          id: newPersona.id,
          name: newPersona.name,
          ageGenderLocation: newPersona.ageGenderLocation || "",
          dailyStruggles: newPersona.dailyStruggles || "",
          desiredCharacteristics: newPersona.desiredCharacteristics || "",
          desiredSocialStatus: newPersona.desiredSocialStatus || "",
          productHelpAchieveStatus: newPersona.productHelpAchieveStatus || "",
          beliefsToOvercome: newPersona.beliefsToOvercome || "",
          failedSolutions: newPersona.failedSolutions || "",
          marketAwareness: newPersona.marketAwareness || "",
          marketSophistication: newPersona.marketSophistication || "",
          insecurities: newPersona.insecurities || "",
          mindset: newPersona.mindset || "",
          deeperPainPoints: newPersona.deeperPainPoints || "",
          hiddenSpecificDesires: newPersona.hiddenSpecificDesires || "",
          objections: newPersona.objections || "",
          angle: newPersona.angle || "",
          dominoStatement: newPersona.dominoStatement || "",
          description: newPersona.description || "",
          projectId: newPersona.projectId || "shared",
          notes: newPersona.notes || ""
        }
        setPersonas(prev => [...prev, convertedPersona])
      } else {
        // Updating existing persona
        const updated = await personasApi.update(updatedPersona.id, updatedPersona)
        setPersonas(prev => prev.map(persona => persona.id === updated.id ? { ...persona, ...updatedPersona } : persona))
      }
      setSelectedPersona(null)
    } catch (error) {
      console.error('Error updating persona:', error)
      alert('Failed to save persona. Please try again.')
    }
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
      angle: "To be defined",
      dominoStatement: "To be defined",
      description: "New persona",
      projectId: "shared",
      notes: ""
    })
  }

  const handleNotesEdit = (persona: Persona) => {
    setNotesEditingPersona(persona)
    setTempNotes(persona.notes || "")
  }

  const handleDeleteClick = (persona: Persona) => {
    setPersonaToDelete(persona)
    setDeleteDialogOpen(true)
  }

  const handleDeletePersona = async () => {
    if (!personaToDelete) return
    
    setIsDeleting(true)
    try {
      await personasApi.delete(personaToDelete.id)
      setPersonas(prev => prev.filter(persona => persona.id !== personaToDelete.id))
      if (selectedPersona && selectedPersona.id === personaToDelete.id) {
        setSelectedPersona(null)
      }
    } catch (error) {
      console.error('Error deleting persona:', error)
      alert('Failed to delete persona. Please try again.')
    } finally {
      setIsDeleting(false)
      setPersonaToDelete(null)
    }
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
            {personas.map((persona) => (
              <TableRow key={persona.id}>
                <TableCell className="font-medium">{persona.name}</TableCell>
                <TableCell>{persona.ageGenderLocation || "Unknown"}</TableCell>
                <TableCell>
                  <span className="px-2 py-1 bg-muted rounded text-xs">
                    {(persona.marketAwareness || "Problem Aware").replace(" Aware", "")}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground italic">
                  {/* For now showing mindset as a placeholder for domino statement */}
                  {persona.dominoStatement ? persona.dominoStatement.substring(0, 80) + "..." : "No domino statement defined"}
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
                        handleNotesEdit(persona)
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
                      setSelectedPersona(persona)
                    }}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteClick(persona)
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Delete persona"
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

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Persona"
        itemName={personaToDelete?.name}
        onConfirm={handleDeletePersona}
        isLoading={isDeleting}
      />

      {/* Persona Brief Page (Full-screen overlay like Facebook Ads Manager) */}
      {selectedPersona && (
        <React.Suspense fallback={<div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center">Loading...</div>}>
          <PersonaBriefPage
            persona={selectedPersona}
            onClose={() => setSelectedPersona(null)}
            onUpdatePersona={handleUpdatePersona}
            onDeletePersona={(personaId: string) => {
              const persona = personas.find(p => p.id === personaId)
              if (persona) handleDeleteClick(persona)
            }}
            NEW_PERSONA_ID="new-persona-temp-id"
          />
        </React.Suspense>
      )}
    </div>
  )
}