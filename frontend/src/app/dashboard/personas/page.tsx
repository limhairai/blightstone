"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus, Eye } from "lucide-react"
import { useProjectStore } from "@/lib/stores/project-store"

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
}

export default function PersonasPage() {
  const { currentProjectId, getAvatarsForProject, addAvatar } = useProjectStore()
  const projectAvatars = currentProjectId ? getAvatarsForProject(currentProjectId) : []

  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)

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
      projectId: currentProjectId || ""
    })
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Personas</h1>
          <p className="text-muted-foreground">Customer personas for your current project</p>
        </div>
        
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
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projectAvatars.map((avatar) => (
              <TableRow key={avatar.id}>
                <TableCell className="font-medium">{avatar.name}</TableCell>
                <TableCell>{avatar.description || "No description"}</TableCell>
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

      {/* TODO: Integrate PersonaBriefPage component when ready */}
      {selectedPersona && (
        <div className="fixed inset-0 bg-background z-50 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {selectedPersona.id === "new-persona-temp-id" ? "Create New Persona" : "Edit Persona"}
              </h2>
              <Button variant="outline" onClick={() => setSelectedPersona(null)}>
                Close
              </Button>
            </div>
            
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Persona Name</label>
                  <input 
                    type="text" 
                    value={selectedPersona.name}
                    onChange={(e) => setSelectedPersona({...selectedPersona, name: e.target.value})}
                    className="w-full p-2 border border-border rounded mt-1"
                    placeholder="e.g., Catherine (Mom, 35-50, stressed, sleep-deprived)"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Age, Gender, Location</label>
                  <input 
                    type="text" 
                    value={selectedPersona.ageGenderLocation}
                    onChange={(e) => setSelectedPersona({...selectedPersona, ageGenderLocation: e.target.value})}
                    className="w-full p-2 border border-border rounded mt-1"
                    placeholder="e.g., Female - 35/60 - United States"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Daily Struggles</label>
                  <textarea 
                    value={selectedPersona.dailyStruggles}
                    onChange={(e) => setSelectedPersona({...selectedPersona, dailyStruggles: e.target.value})}
                    className="w-full p-2 border border-border rounded mt-1 h-20"
                    placeholder="What are their day to day struggles?"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Deeper Pain Points</label>
                  <textarea 
                    value={selectedPersona.deeperPainPoints}
                    onChange={(e) => setSelectedPersona({...selectedPersona, deeperPainPoints: e.target.value})}
                    className="w-full p-2 border border-border rounded mt-1 h-20"
                    placeholder="What are deeper pain points?"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Hidden/Specific Desires</label>
                  <textarea 
                    value={selectedPersona.hiddenSpecificDesires}
                    onChange={(e) => setSelectedPersona({...selectedPersona, hiddenSpecificDesires: e.target.value})}
                    className="w-full p-2 border border-border rounded mt-1 h-20"
                    placeholder="What are their hidden desires?"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Objections</label>
                  <textarea 
                    value={selectedPersona.objections}
                    onChange={(e) => setSelectedPersona({...selectedPersona, objections: e.target.value})}
                    className="w-full p-2 border border-border rounded mt-1 h-20"
                    placeholder="What are their objections?"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleUpdatePersona(selectedPersona)} 
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    {selectedPersona.id === "new-persona-temp-id" ? "Create Persona" : "Update Persona"}
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedPersona(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}