"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Users, Target, Brain, Heart, AlertTriangle } from "lucide-react"

interface CustomerAvatar {
  id: string
  name: string
  type: string
  age: string
  gender: string
  location: string
  struggles: string[]
  characteristics: string[]
  statusDesired: string[]
  productHelp: string[]
  beliefs: string[]
  failedSolutions: string[]
  awareness: string
  sophistication: string
  insecurities: string[]
  mindset: string
  painPoints: string[]
  desires: string[]
  objections: string[]
}

export default function CustomerAvatarsPage() {
  const [avatars, setAvatars] = useState<CustomerAvatar[]>([
    {
      id: "1",
      name: "Catherine (Mom)",
      type: "Persona 1",
      age: "35-60",
      gender: "Female",
      location: "United States",
      struggles: [
        "Bad Sleeper",
        "Stress",
        "Headache And Migraine"
      ],
      characteristics: [
        "Caring person",
        "Organized", 
        "Health-Conscious",
        "Thoughtful",
        "Reliable"
      ],
      statusDesired: [
        "Recognized for her ability to balance family, work, and personal life seamlessly",
        "Known for her commitment to a healthy and sustainable lifestyle",
        "Respected for her involvement in school, local events, or charitable causes"
      ],
      productHelp: [
        "Restful sleep and reduced stress help her manage family life with ease",
        "Shows her commitment to natural, holistic wellness for her and her family",
        "Increased energy lets her stay active and involved"
      ],
      beliefs: [
        "Natural remedies take too long to work",
        "Grounding products are complicated to use", 
        "I don't have time for self-care"
      ],
      failedSolutions: [
        "Sleep supplements: Left her groggy in the morning",
        "Meditation apps: Hard to stay consistent",
        "Expensive mattresses: Didn't resolve stress-related sleep issues"
      ],
      awareness: "Problem Aware",
      sophistication: "Low to Medium",
      insecurities: [
        "Worried about being perceived as a tired, overwhelmed mom",
        "Feels guilty if she's not prioritizing her family's health and her own self-care",
        "Insecure about her lack of sleep and visible signs of exhaustion"
      ],
      mindset: "Catherine juggles multiple responsibilities daily—work, home, and family. She's always 'on,' and her to-do list feels endless.",
      painPoints: [
        "Feeling exhausted and unable to give her best to her family",
        "Waking up feeling more tired than when she went to bed",
        "Emotional frustration from being spread too thin and lacking 'me time'"
      ],
      desires: [
        "To wake up feeling energized and ready to take on the day",
        "To create a calm and nurturing environment for her family without feeling burned out",
        "To have moments of uninterrupted rest and self-care"
      ],
      objections: [
        "Will this really improve my sleep, or is it just another gimmick?",
        "I'm too busy to add another routine or product to my life",
        "Is it safe to use around my children?"
      ]
    },
    {
      id: "2",
      name: "John (Dad)",
      type: "Persona 2", 
      age: "35-60",
      gender: "Male",
      location: "United States",
      struggles: [
        "Back pain",
        "Muscle pain",
        "Bad sleeper"
      ],
      characteristics: [
        "Protective & a provider for the family",
        "Handy and fixing things",
        "Resilient and problem-solver",
        "Active & physically strong",
        "Knowledgeable and has wisdom"
      ],
      statusDesired: [
        "Viewed as a dependable provider and protector for his family",
        "Respected for maintaining physical health and mental health",
        "Admired for his ability to fix things and take care of his household"
      ],
      productHelp: [
        "Better sleep and less pain make him strong and dependable",
        "Faster recovery keeps him consistent with workouts", 
        "Pain-free mobility helps him tackle home projects"
      ],
      beliefs: [
        "Back pain is just part of getting older",
        "Quick fixes don't last",
        "Grounding can't be as effective as medication"
      ],
      failedSolutions: [
        "Pain relief creams: Temporary relief only",
        "Chiropractor visits: Too costly and time-consuming",
        "Heating pads: Helped briefly but didn't address the root issue"
      ],
      awareness: "Problem Aware",
      sophistication: "Medium",
      insecurities: [
        "Concerned about showing weakness or needing help for body pain or stress",
        "Insecure about missing out on family activities due to back pain or fatigue",
        "Worried he won't be seen as the strong, dependable 'provider'"
      ],
      mindset: "John is focused on providing for his family and managing his responsibilities at work and home. He pushes through discomfort and fatigue.",
      painPoints: [
        "Chronic back pain and muscle tightness that affect his productivity and mood",
        "Anxiety about losing physical strength and energy as he ages",
        "Feeling disconnected from his family due to fatigue after work"
      ],
      desires: [
        "To feel physically strong and capable, maintaining his role as a provider and protector",
        "To enjoy quality time with his family without being held back by pain or fatigue",
        "To sleep deeply and wake up refreshed for peak performance"
      ],
      objections: [
        "Is this durable enough for long-term use?",
        "Will this actually help me recover from aches and pains after a long day?",
        "What makes this better than other products I've tried?"
      ]
    }
  ])

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newAvatar, setNewAvatar] = useState<Partial<CustomerAvatar>>({})

  const handleCreateAvatar = () => {
    if (newAvatar.name && newAvatar.type) {
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
        objections: []
      }
      setAvatars([...avatars, avatar])
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
        {avatars.map((avatar) => (
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