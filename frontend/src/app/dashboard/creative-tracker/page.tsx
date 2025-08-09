"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Eye } from "lucide-react"
import { useProjectStore } from "@/lib/stores/project-store"

// Define the interface for a Creative entry
interface Creative {
  id: string
  batch: string
  status: "draft" | "in-review" | "live" | "paused" | "completed"
  launchDate: string // YYYY-MM-DD
  adConcept: string
  testHypothesis: string // "What are you creating/testing and what gives you the confidence this test will improve overall performance?"
  adType: string
  adVariable: string // "What was iterated"
  desire: string
  benefit: string // "Focus on pain points and objections to determine which benefits to highlight."
  objections: string
  persona: string // This will now be a string matching Persona.name
  hookPattern: string // "Desribe how the hook will look like"
  results: string
  winningAdLink: string // "All Winning Ads or Best Performing Ad"
  briefLink: string // "Link to Brief"
  projectId: string // Add project association
}

export default function CreativeTrackerPage() {
  const { currentProjectId, getCreativeTrackersForProject, addCreativeTracker } = useProjectStore()
  const projectTrackers = currentProjectId ? getCreativeTrackersForProject(currentProjectId) : []

  const [selectedCreative, setSelectedCreative] = useState<Creative | null>(null)

  const getStatusColor = (status: Creative["status"]) => {
    switch (status) {
      case "live":
        return "bg-green-100 text-green-800 border-green-200"
      case "in-review":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "draft":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "paused":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleUpdateCreative = (updatedCreative: Creative) => {
    if (!currentProjectId) return
    
    if (updatedCreative.id === "new-creative-temp-id") {
      const newCreativeWithId = { 
        ...updatedCreative, 
        id: Date.now().toString(),
        projectId: currentProjectId
      }
      
      // Convert to store format
      const trackerData = {
        id: newCreativeWithId.id,
        batch: newCreativeWithId.batch,
        campaign: newCreativeWithId.adConcept,
        status: newCreativeWithId.status,
        launchDate: newCreativeWithId.launchDate,
        results: newCreativeWithId.results,
        projectId: currentProjectId
      }
      
      addCreativeTracker(trackerData)
      setSelectedCreative(null)
    } else {
      // TODO: Implement update functionality in the store
      setSelectedCreative(null)
    }
  }

  const handleDeleteCreative = (creativeId: string) => {
    // TODO: Implement delete functionality in the store
    setSelectedCreative(null)
  }

  const handleNewCreativeClick = () => {
    setSelectedCreative({
      id: "new-creative-temp-id",
      batch: "",
      status: "draft",
      launchDate: "",
      adConcept: "",
      testHypothesis: "",
      adType: "",
      adVariable: "",
      desire: "",
      benefit: "",
      objections: "",
      persona: "",
      hookPattern: "",
      results: "",
      winningAdLink: "",
      briefLink: "",
      projectId: currentProjectId || ""
    })
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Creative Tracker</h1>
          <p className="text-muted-foreground">Track creative campaigns for your current project</p>
        </div>
        
        <Button onClick={handleNewCreativeClick} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Plus className="h-4 w-4 mr-2" />
          New Creative
        </Button>
      </div>
      
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch #</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ad Concept (Inspo)</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projectTrackers.map((tracker) => (
              <TableRow key={tracker.id}>
                <TableCell className="font-medium">{tracker.batch}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(tracker.status as Creative["status"])}>{tracker.status.replace("-", " ")}</Badge>
                </TableCell>
                <TableCell>{tracker.campaign}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => {
                    // Convert from store format to Creative format for editing
                    setSelectedCreative({
                      id: tracker.id,
                      batch: tracker.batch,
                      status: tracker.status as Creative["status"],
                      launchDate: tracker.launchDate,
                      adConcept: tracker.campaign,
                      testHypothesis: "",
                      adType: "",
                      adVariable: "",
                      desire: "",
                      benefit: "",
                      objections: "",
                      persona: "",
                      hookPattern: "",
                      results: tracker.results,
                      winningAdLink: "",
                      briefLink: "",
                      projectId: tracker.projectId
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

      {/* Creative Brief Page (Full-screen overlay) - Simplified for now */}
      {selectedCreative && (
        <div className="fixed inset-0 bg-background z-50 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {selectedCreative.id === "new-creative-temp-id" ? "Create New Creative" : "Edit Creative"}
              </h2>
              <Button variant="outline" onClick={() => setSelectedCreative(null)}>
                Close
              </Button>
            </div>
            
            <Card className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Batch #</label>
                    <input 
                      type="text" 
                      value={selectedCreative.batch}
                      onChange={(e) => setSelectedCreative({...selectedCreative, batch: e.target.value})}
                      className="w-full p-2 border border-border rounded mt-1"
                      placeholder="e.g., Batch #001"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <select 
                      value={selectedCreative.status}
                      onChange={(e) => setSelectedCreative({...selectedCreative, status: e.target.value as Creative["status"]})}
                      className="w-full p-2 border border-border rounded mt-1"
                    >
                      <option value="draft">Draft</option>
                      <option value="in-review">In Review</option>
                      <option value="live">Live</option>
                      <option value="paused">Paused</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Launch Date</label>
                    <input 
                      type="date" 
                      value={selectedCreative.launchDate}
                      onChange={(e) => setSelectedCreative({...selectedCreative, launchDate: e.target.value})}
                      className="w-full p-2 border border-border rounded mt-1"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Ad Type</label>
                    <input 
                      type="text" 
                      value={selectedCreative.adType}
                      onChange={(e) => setSelectedCreative({...selectedCreative, adType: e.target.value})}
                      className="w-full p-2 border border-border rounded mt-1"
                      placeholder="e.g., Video Ad, Image Ad"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Ad Concept</label>
                  <input 
                    type="text" 
                    value={selectedCreative.adConcept}
                    onChange={(e) => setSelectedCreative({...selectedCreative, adConcept: e.target.value})}
                    className="w-full p-2 border border-border rounded mt-1"
                    placeholder="e.g., Grounding Sheets - Sleep Improvement"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Test Hypothesis</label>
                  <textarea 
                    value={selectedCreative.testHypothesis}
                    onChange={(e) => setSelectedCreative({...selectedCreative, testHypothesis: e.target.value})}
                    className="w-full p-2 border border-border rounded mt-1 h-24"
                    placeholder="What are you creating/testing and what gives you the confidence this test will improve overall performance?"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Hook Pattern</label>
                  <textarea 
                    value={selectedCreative.hookPattern}
                    onChange={(e) => setSelectedCreative({...selectedCreative, hookPattern: e.target.value})}
                    className="w-full p-2 border border-border rounded mt-1 h-20"
                    placeholder="Describe how the hook will look like"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Results</label>
                  <textarea 
                    value={selectedCreative.results}
                    onChange={(e) => setSelectedCreative({...selectedCreative, results: e.target.value})}
                    className="w-full p-2 border border-border rounded mt-1 h-20"
                    placeholder="Campaign results and performance metrics"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleUpdateCreative(selectedCreative)} 
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    {selectedCreative.id === "new-creative-temp-id" ? "Create Creative" : "Update Creative"}
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedCreative(null)}>
                    Cancel
                  </Button>
                  {selectedCreative.id !== "new-creative-temp-id" && (
                    <Button variant="destructive" onClick={() => handleDeleteCreative(selectedCreative.id)}>
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