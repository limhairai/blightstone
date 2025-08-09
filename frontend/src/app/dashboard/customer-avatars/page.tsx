"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Users, Target, Brain, Heart, AlertTriangle } from "lucide-react"
import { useProjectStore, CustomerAvatar } from "@/lib/stores/project-store"

export default function CustomerAvatarsPage() {
  const { currentProjectId, getAvatarsForProject, addAvatar } = useProjectStore()
  const projectAvatars = currentProjectId ? getAvatarsForProject(currentProjectId) : []

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newAvatar, setNewAvatar] = useState<Partial<CustomerAvatar>>({})

  const handleCreateAvatar = () => {
    if (newAvatar.name && newAvatar.type && currentProjectId) {
      const avatar: CustomerAvatar = {
        id: Date.now().toString(),
        name: newAvatar.name || "",
        type: newAvatar.type || "",
        age: newAvatar.age || "",
        gender: newAvatar.gender || "",
        location: newAvatar.location || "",
        struggles: [],
        characteristics: [],
        statusDesired: [],
        productHelp: [],
        beliefs: [],
        failedSolutions: [],
        awareness: newAvatar.awareness || "Problem Aware",
        sophistication: newAvatar.sophistication || "Medium",
        insecurities: [],
        mindset: newAvatar.mindset || "",
        painPoints: [],
        desires: [],
        objections: [],
        projectId: currentProjectId
      }
      addAvatar(avatar)
      setNewAvatar({})
      setShowCreateForm(false)
    }
  }

  const getAwarenessColor = (awareness: string) => {
    switch (awareness) {
      case "Completely Unaware": return "bg-secondary text-secondary-foreground"
      case "Problem Aware": return "bg-primary text-primary-foreground"
      case "Solution Aware": return "bg-muted text-muted-foreground"
      case "Product Aware": return "bg-accent text-accent-foreground"
      case "Most Aware": return "bg-primary text-primary-foreground"
      default: return "bg-secondary text-secondary-foreground"
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customer Avatars</h1>
          <p className="text-muted-foreground">Define and manage your target customer personas</p>
        </div>
        
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Avatar
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Customer Avatar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  placeholder="e.g., Catherine (Mom)"
                  value={newAvatar.name || ""}
                  onChange={(e) => setNewAvatar({...newAvatar, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Persona Type</label>
                <Input
                  placeholder="e.g., Persona 1"
                  value={newAvatar.type || ""}
                  onChange={(e) => setNewAvatar({...newAvatar, type: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Age Range</label>
                <Input
                  placeholder="e.g., 35-60"
                  value={newAvatar.age || ""}
                  onChange={(e) => setNewAvatar({...newAvatar, age: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Gender</label>
                <Select onValueChange={(value) => setNewAvatar({...newAvatar, gender: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Non-binary">Non-binary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Location</label>
                <Input
                  placeholder="e.g., United States"
                  value={newAvatar.location || ""}
                  onChange={(e) => setNewAvatar({...newAvatar, location: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Awareness Level</label>
                <Select onValueChange={(value) => setNewAvatar({...newAvatar, awareness: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select awareness" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Completely Unaware">Completely Unaware</SelectItem>
                    <SelectItem value="Problem Aware">Problem Aware</SelectItem>
                    <SelectItem value="Solution Aware">Solution Aware</SelectItem>
                    <SelectItem value="Product Aware">Product Aware</SelectItem>
                    <SelectItem value="Most Aware">Most Aware</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Mindset</label>
              <Textarea
                placeholder="Describe their overall mindset and approach to life"
                value={newAvatar.mindset || ""}
                onChange={(e) => setNewAvatar({...newAvatar, mindset: e.target.value})}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateAvatar} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Create Avatar
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {projectAvatars.map((avatar) => (
          <Card key={avatar.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-xl">{avatar.name}</CardTitle>
                    <Badge variant="outline">{avatar.type}</Badge>
                    <Badge className={getAwarenessColor(avatar.awareness)}>
                      {avatar.awareness}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{avatar.age} • {avatar.gender} • {avatar.location}</span>
                  </div>
                </div>
                <Users className="h-6 w-6 text-primary" />
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-primary" />
                    Daily Struggles
                  </h4>
                  <ul className="space-y-1">
                    {avatar.struggles.map((struggle, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0" />
                        {struggle}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Characteristics
                  </h4>
                  <ul className="space-y-1">
                    {avatar.characteristics.map((char, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0" />
                        {char}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Heart className="h-4 w-4 text-primary" />
                    Hidden Desires
                  </h4>
                  <ul className="space-y-1">
                    {avatar.desires.map((desire, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0" />
                        {desire}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {avatar.mindset && (
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    Mindset
                  </h4>
                  <p className="text-sm text-muted-foreground italic bg-muted/30 p-3 rounded-lg">
                    "{avatar.mindset}"
                  </p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Pain Points</h4>
                  <ul className="space-y-1">
                    {avatar.painPoints.slice(0, 3).map((point, i) => (
                      <li key={i} className="text-xs flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Common Objections</h4>
                  <ul className="space-y-1">
                    {avatar.objections.slice(0, 3).map((objection, i) => (
                      <li key={i} className="text-xs flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
                        {objection}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}