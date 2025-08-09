"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Target, Calendar, BarChart3, ExternalLink, Edit2 } from "lucide-react"
import { useProjectStore, CreativeTracker } from "@/lib/stores/project-store"

export default function CreativeTrackerPage() {
  const { currentProjectId, getCreativeTrackersForProject, addCreativeTracker } = useProjectStore()
  const projectTrackers = currentProjectId ? getCreativeTrackersForProject(currentProjectId) : []

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTracker, setNewTracker] = useState<Partial<CreativeTracker>>({})

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-accent text-accent-foreground"
      case "in-progress": return "bg-primary text-primary-foreground"
      case "planned": return "bg-secondary text-secondary-foreground"
      case "paused": return "bg-muted text-muted-foreground"
      default: return "bg-secondary text-secondary-foreground"
    }
  }

  const handleCreateTracker = () => {
    if (newTracker.batch && newTracker.brand && currentProjectId) {
      const tracker: CreativeTracker = {
        id: Date.now().toString(),
        batch: newTracker.batch || "",
        brand: newTracker.brand || "",
        status: "planned",
        launchDate: newTracker.launchDate || "",
        adConcept: newTracker.adConcept || "",
        adType: newTracker.adType || "",
        adVariable: newTracker.adVariable || "",
        desire: newTracker.desire || "",
        benefit: newTracker.benefit || "",
        objections: newTracker.objections || "",
        persona: newTracker.persona || "",
        positioning: newTracker.positioning || "",
        positioningHow: newTracker.positioningHow || "",
        hookPattern: newTracker.hookPattern || "",
        results: "Pending",
        winningAds: "",
        briefLink: newTracker.briefLink || "",
        projectId: currentProjectId
      }
      addCreativeTracker(tracker)
      setNewTracker({})
      setShowCreateForm(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Creative Tracker</h1>
          <p className="text-muted-foreground">Track and manage your creative campaigns and ad variations</p>
        </div>
        
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Creative Campaign</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Batch Number</label>
                <Input
                  placeholder="e.g., Batch 003"
                  value={newTracker.batch || ""}
                  onChange={(e) => setNewTracker({...newTracker, batch: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Brand</label>
                <Input
                  placeholder="e.g., Grounding.co"
                  value={newTracker.brand || ""}
                  onChange={(e) => setNewTracker({...newTracker, brand: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Launch Date</label>
                <Input
                  type="date"
                  value={newTracker.launchDate || ""}
                  onChange={(e) => setNewTracker({...newTracker, launchDate: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Ad Type</label>
                <Select onValueChange={(value) => setNewTracker({...newTracker, adType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ad type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="static">Static</SelectItem>
                    <SelectItem value="carousel">Carousel</SelectItem>
                    <SelectItem value="video-static">Video + Static</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Ad Concept</label>
              <Textarea
                placeholder="Describe the ad concept and inspiration"
                value={newTracker.adConcept || ""}
                onChange={(e) => setNewTracker({...newTracker, adConcept: e.target.value})}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateTracker} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                Create Campaign
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectTrackers.length}</div>
            <p className="text-xs text-muted-foreground">Active tracking</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectTrackers.filter(t => t.status === 'in-progress').length}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectTrackers.filter(t => t.status === 'completed').length}</div>
            <p className="text-xs text-muted-foreground">Finished campaigns</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projectTrackers.filter(t => t.status === 'completed').length > 0 ? '75%' : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">Campaign effectiveness</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Launch Date</TableHead>
                  <TableHead>Ad Concept</TableHead>
                  <TableHead>Persona</TableHead>
                  <TableHead>Results</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectTrackers.map((tracker) => (
                  <TableRow key={tracker.id}>
                    <TableCell className="font-medium">{tracker.batch}</TableCell>
                    <TableCell>{tracker.brand}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(tracker.status)}>
                        {tracker.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{tracker.launchDate}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={tracker.adConcept}>
                        {tracker.adConcept || "No concept set"}
                      </div>
                    </TableCell>
                    <TableCell>{tracker.persona}</TableCell>
                    <TableCell>{tracker.results}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        {tracker.briefLink && (
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}