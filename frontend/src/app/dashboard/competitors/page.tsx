"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus, Eye } from "lucide-react"
import { useProjectStore } from "@/lib/stores/project-store"

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
}

export default function CompetitorsPage() {
  const { currentProjectId, getCompetitorsForProject, addCompetitor } = useProjectStore()
  const projectCompetitors = currentProjectId ? getCompetitorsForProject(currentProjectId) : []

  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null)

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
      projectId: currentProjectId || ""
    })
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Competitor Analysis</h1>
          <p className="text-muted-foreground">Analyze competitors for your current project</p>
        </div>
        
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

      {/* Competitor Brief Page (Full-screen overlay) - Simplified for now */}
      {selectedCompetitor && (
        <div className="fixed inset-0 bg-background z-50 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {selectedCompetitor.id === "new-competitor-temp-id" ? "Add New Competitor" : "Edit Competitor"}
              </h2>
              <Button variant="outline" onClick={() => setSelectedCompetitor(null)}>
                Close
              </Button>
            </div>
            
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Competitor Name</label>
                  <input 
                    type="text" 
                    value={selectedCompetitor.name}
                    onChange={(e) => setSelectedCompetitor({...selectedCompetitor, name: e.target.value})}
                    className="w-full p-2 border border-border rounded mt-1"
                    placeholder="e.g., SleepWell Co."
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Website URL</label>
                  <input 
                    type="url" 
                    value={selectedCompetitor.websiteUrl}
                    onChange={(e) => setSelectedCompetitor({...selectedCompetitor, websiteUrl: e.target.value})}
                    className="w-full p-2 border border-border rounded mt-1"
                    placeholder="https://example.com"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Ad Library Link</label>
                  <input 
                    type="url" 
                    value={selectedCompetitor.adLibraryLink}
                    onChange={(e) => setSelectedCompetitor({...selectedCompetitor, adLibraryLink: e.target.value})}
                    className="w-full p-2 border border-border rounded mt-1"
                    placeholder="Facebook Ad Library link"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Market</label>
                    <input 
                      type="text" 
                      value={selectedCompetitor.market}
                      onChange={(e) => setSelectedCompetitor({...selectedCompetitor, market: e.target.value})}
                      className="w-full p-2 border border-border rounded mt-1"
                      placeholder="e.g., USA, Canada, UK"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Level</label>
                    <select 
                      value={selectedCompetitor.level}
                      onChange={(e) => setSelectedCompetitor({...selectedCompetitor, level: e.target.value as "Poor" | "Medium" | "High"})}
                      className="w-full p-2 border border-border rounded mt-1"
                    >
                      <option value="Poor">Poor</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Offer URL</label>
                  <input 
                    type="url" 
                    value={selectedCompetitor.offerUrl}
                    onChange={(e) => setSelectedCompetitor({...selectedCompetitor, offerUrl: e.target.value})}
                    className="w-full p-2 border border-border rounded mt-1"
                    placeholder="Link to their main product/offer"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Traffic Volume</label>
                  <input 
                    type="text" 
                    value={selectedCompetitor.trafficVolume}
                    onChange={(e) => setSelectedCompetitor({...selectedCompetitor, trafficVolume: e.target.value})}
                    className="w-full p-2 border border-border rounded mt-1"
                    placeholder="e.g., 50K-100K, 10K-50K"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleUpdateCompetitor(selectedCompetitor)} 
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    {selectedCompetitor.id === "new-competitor-temp-id" ? "Add Competitor" : "Update Competitor"}
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedCompetitor(null)}>
                    Cancel
                  </Button>
                  {selectedCompetitor.id !== "new-competitor-temp-id" && (
                    <Button variant="destructive" onClick={() => handleDeleteCompetitor(selectedCompetitor.id)}>
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}