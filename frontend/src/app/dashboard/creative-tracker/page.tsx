"use client"

import React from "react"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Eye, Edit3 } from "lucide-react"
// Lazy load the brief page for better performance
const CreativeBriefPage = React.lazy(() => import("@/components/creative/creative-brief-page"))
import { useProjectStore } from "@/lib/stores/project-store"
import { useState, useEffect } from "react"

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
  driveLink: string // "Google Drive link for creative files"
  createdAt: string // "Date when the creative was created"
  notes?: string // "Quick notes about the creative"
}

// Define the interface for a Persona entry (re-used from persona-page.tsx)
interface Persona {
  id: string
  name: string // Persona Type (Naming) - e.g., "Catherine (Mom, 35-50, stressed, sleep-deprived)"
  ageGenderLocation: string
  dailyStruggles: string
  desiredCharacteristics: string
  desiredSocialStatus: string
  productHelpAchieveStatus: string
  beliefsToOvercome: string
  failedSolutions: string
  marketAwareness: string
  marketSophistication: string
  insecurities: string
  mindset: string
  deeperPainPoints: string
  hiddenSpecificDesires: string
  objections: string
}

// Define a constant for a new creative's temporary ID
const NEW_CREATIVE_ID = "new-creative-temp-id"

export default function CreativeTrackerPage() {
  const { currentProjectId } = useProjectStore()
  
  // Project-specific mock data
  const getCreativesForCurrentProject = () => {
    if (currentProjectId === "1") {
      // Grounding.co Campaign creatives
      return [
        {
          id: "c1",
          batch: "Batch #001",
          status: "live" as Creative["status"],
          launchDate: "2025-07-15",
          adConcept: "Grounding Sheets - Sleep Improvement",
          testHypothesis: "Creating a video ad focusing on sleep improvement benefits for problem-aware customers. Confidence comes from high search volume for 'sleep problems' and positive testimonials.",
          adType: "Video Ad",
          adVariable: "Hook (Problem-Solution)",
          desire: "Better sleep, reduced stress, improved well-being.",
          objections: "Skepticism about 'grounding', cost, effectiveness.",
          persona: "Catherine (Mom)",
          hookPattern: "Problem-agitation-solution with emotional appeal",
          results: "3.2% CTR, $1.85 CPC, 12% conversion rate",
          winningAdLink: "https://example.com/winning-ad-1",
          briefLink: "https://example.com/brief-1",
          driveLink: "https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j",
          createdAt: "2025-01-08",
          notes: "High performing hook, test more variations"
        }
      ]
    } else if (currentProjectId === "2") {
      // Brand X Product Launch creatives
      return [
        {
          id: "c2",
          batch: "Batch #002", 
          status: "in-review" as Creative["status"],
          launchDate: "2025-08-01",
          adConcept: "Professional Wellness - Work-Life Balance",
          testHypothesis: "Targeting busy professionals with wellness solutions. Confidence from market research showing high demand for professional wellness products.",
          adType: "Carousel Ad",
          adVariable: "Audience (Professional vs General)",
          desire: "Peak performance without sacrificing health.",
          objections: "Time constraints, another wellness trend.",
          persona: "Alex (Professional)",
          hookPattern: "Authority-based with social proof",
          results: "Pending launch",
          winningAdLink: "https://example.com/winning-ad-2",
          briefLink: "https://example.com/brief-2",
          driveLink: "https://drive.google.com/drive/folders/9z8y7x6w5v4u3t2s1r0q",
          createdAt: "2025-01-10",
          notes: "Pending review, targeting professionals"
        }
      ]
    }
    return [] // Default empty for other projects
  }

  const [creatives, setCreatives] = useState<Creative[]>(getCreativesForCurrentProject())
  
  // Add effect to update creatives when project changes
  useEffect(() => {
    setCreatives(getCreativesForCurrentProject())
  }, [currentProjectId])

  /* Old mock data removed - now using project-specific data
    {
      id: "c1",
      batch: "Batch #001",
      status: "live",
      launchDate: "2025-07-15",
      adConcept: "Grounding Sheets - Sleep Improvement",
      testHypothesis:
        "Creating a video ad focusing on sleep improvement benefits for problem-aware customers. Confidence comes from high search volume for 'sleep problems' and positive testimonials.",
      adType: "Video Ad",
      adVariable: "Hook (Problem-Solution)",
      desire: "Better sleep, reduced stress, improved well-being.",
      objections: "Skepticism about 'grounding', cost, effectiveness.",
      persona: "Catherine (Mom, 35-50, stressed, sleep-deprived)",
      hookPattern: "Start with a common sleep problem, introduce grounding sheets as a natural solution.",
      results: "Initial positive CTR, monitoring conversion rates.",
      winningAdLink: "https://example.com/ad-001-video",
      briefLink: "https://example.com/brief-001",
      benefit:
        "Emphasize deep, restorative sleep, natural stress reduction, and waking up refreshed without medication.",
    },
    {
      id: "c2",
      batch: "Batch #002",
      status: "draft",
      launchDate: "2025-08-01",
      adConcept: "Grounding Mats - Desk Setup",
      testHypothesis:
        "Testing static image ads showcasing grounding mats in a home office setting to target remote workers experiencing fatigue. Confidence from increasing remote work trends.",
      adType: "Image Ad",
      adVariable: "Visual (Home Office)",
      desire: "Increased focus, reduced fatigue, better energy during work.",
      objections: "Clutter, aesthetics, perceived necessity.",
      persona: "David (Remote Worker, 28-45, tech-savvy, health-conscious)",
      hookPattern: "Show a sleek desk setup with the mat, pose a question about workday fatigue.",
      results: "N/A",
      winningAdLink: "",
      briefLink: "https://example.com/brief-002",
      benefit: "Highlight improved concentration, reduced eye strain, and sustained energy throughout the workday.",
    },
    {
      id: "c3",
      batch: "Batch #001",
      status: "completed",
      launchDate: "2025-07-01",
      adConcept: "Grounding Pillowcases - Anxiety Relief",
      testHypothesis:
        "Short-form video ad targeting individuals with mild anxiety, focusing on the calming effects of grounding. Confidence from anecdotal evidence and mental wellness trends.",
      adType: "Short Video",
      adVariable: "Benefit (Calmness)",
      desire: "Reduced anxiety, feeling more grounded, peaceful sleep.",
      objections: "Effectiveness, scientific backing, 'woo-woo' perception.",
      persona: "Sarah (Young Professional, 25-35, struggles with mild anxiety)",
      hookPattern:
        "Quick cuts showing a person unwinding, then a serene sleep, with text overlays about anxiety relief.",
      results: "High engagement, good conversion rate. Winning ad.",
      winningAdLink: "https://example.com/ad-003-video",
      briefLink: "https://example.com/brief-003",
      benefit: "Emphasize a sense of calm, reduced nighttime restlessness, and a peaceful start to the day.",
    },
  ] */

  // Mock personas for the dropdown
  const [personas] = useState<Persona[]>([
    {
      id: "p1",
      name: "Catherine (Mom, 35-50, stressed, sleep-deprived)",
      ageGenderLocation: "Female - 35/60 - United States",
      dailyStruggles: "Bad Sleeper, Stress, Headache And Migraine",
      desiredCharacteristics: "Caring person, Organized, Health-Conscious, Thoughtful, Reliable",
      desiredSocialStatus:
        "Recognized for her ability to balance family, work, and personal life seamlessly. Known for her commitment to a healthy and sustainable lifestyle. Respected for her involvement in school, local events, or charitable causes. Admired by other moms for her wisdom, organization, and compassion.",
      productHelpAchieveStatus:
        "Restful sleep and reduced stress help her manage family life with ease. Shows her commitment to natural, holistic wellness for her and her family. Increased energy lets her stay active and involved. Balances health and family, inspiring other moms.",
      beliefsToOvercome:
        "Natural remedies take too long to work. Grounding products are complicated to use. I don't have time for self-care.",
      failedSolutions:
        "Sleep supplements: Left her groggy in the morning. Meditation apps: Hard to stay consistent. Expensive mattresses: Didn't resolve stress-related sleep issues.",
      marketAwareness: "Problem Aware",
      marketSophistication: "Low to Medium",
      insecurities:
        "Worried about being perceived as a tired, overwhelmed mom. Feels guilty if she's not prioritizing her family's health and her own self-care. Insecure about her lack of sleep and visible signs of exhaustion (e.g., dark circles, irritability).",
      mindset:
        "Catherine juggles multiple responsibilities daily—work, home, and family. She's always \"on,\" and her to-do list feels endless. She believes that caring for her family comes first, often putting her own well-being last. However, she craves peace of mind and sees solving her sleep and pain issues as a way to become more energized and present for her family.",
      deeperPainPoints:
        "Feeling exhausted and unable to give her best to her family. Waking up feeling more tired than when she went to bed. Emotional frustration from being spread too thin and lacking \"me time.\" Fear of long-term health issues due to poor sleep and constant body tension.",
      hiddenSpecificDesires:
        "To wake up feeling energized and ready to take on the day. To create a calm and nurturing environment for her family without feeling burned out. To have moments of uninterrupted rest and self-care. To maintain her health so she can stay active for her kids long-term. To look pretty without wrinkles or dark circles.",
      objections:
        "Will this really improve my sleep, or is it just another gimmick? I'm too busy to add another routine or product to my life. Is it safe to use around my children? What if it doesn't work as promised?",
    },
    {
      id: "p2",
      name: "David (Remote Worker, 28-45, tech-savvy, health-conscious)",
      ageGenderLocation: "Male - 28/45 - United States",
      dailyStruggles: "Fatigue, lack of focus, eye strain from screen time.",
      desiredCharacteristics: "Productive, efficient, healthy, innovative.",
      desiredSocialStatus: "Recognized as a high-performer, early adopter of wellness tech.",
      productHelpAchieveStatus: "Grounding mats boost focus and reduce fatigue, enhancing productivity.",
      beliefsToOvercome: "Skepticism about 'alternative' health, preference for tech solutions.",
      failedSolutions: "More coffee, energy drinks, ergonomic chairs (didn't address root cause).",
      marketAwareness: "Solution Aware",
      marketSophistication: "Medium",
      insecurities: "Worried about burnout, falling behind, not optimizing his health.",
      mindset: "Always seeking an edge, values efficiency and data-driven solutions.",
      deeperPainPoints: "Chronic low energy, mental fog, feeling disconnected from nature.",
      hiddenSpecificDesires:
        "Sustained energy without crashes, mental clarity, feeling more 'connected' to his environment.",
      objections: "Is it scientifically proven? Is it worth the desk space? Will it look good?",
    },
  ])

  const [selectedCreative, setSelectedCreative] = useState<Creative | null>(null)
  const [notesEditingCreative, setNotesEditingCreative] = useState<Creative | null>(null)
  const [tempNotes, setTempNotes] = useState("")

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
    if (updatedCreative.id === NEW_CREATIVE_ID) {
      const newCreativeWithId = { ...updatedCreative, id: Date.now().toString() }
      setCreatives([...creatives, newCreativeWithId])
      setSelectedCreative(null)
    } else {
      setCreatives(creatives.map((c) => (c.id === updatedCreative.id ? updatedCreative : c)))
      setSelectedCreative(updatedCreative)
    }
  }

  const handleDeleteCreative = (creativeId: string) => {
    setCreatives(creatives.filter((c) => c.id !== creativeId))
    setSelectedCreative(null)
  }

  const handleNewCreativeClick = () => {
    setSelectedCreative({
      id: NEW_CREATIVE_ID,
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
      persona: "", // Default to empty string
      hookPattern: "",
      results: "",
      winningAdLink: "",
      briefLink: "",
      driveLink: "",
      createdAt: new Date().toISOString().split("T")[0],
      notes: "",
    })
  }

  const handleNotesEdit = (creative: Creative) => {
    setNotesEditingCreative(creative)
    setTempNotes(creative.notes || "")
  }

  const handleNotesSave = () => {
    if (notesEditingCreative) {
      const updatedCreatives = creatives.map(creative => 
        creative.id === notesEditingCreative.id 
          ? { ...creative, notes: tempNotes }
          : creative
      )
      setCreatives(updatedCreatives)
      setNotesEditingCreative(null)
      setTempNotes("")
    }
  }

  const handleNotesCancel = () => {
    setNotesEditingCreative(null)
    setTempNotes("")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button onClick={handleNewCreativeClick} className="bg-black hover:bg-black/90 text-white">
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
              <TableHead>Created Date</TableHead>
              <TableHead>Drive Link</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {creatives.map((creative) => (
              <TableRow key={creative.id}>
                <TableCell className="font-medium">{creative.batch}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(creative.status)}>{creative.status.replace("-", " ")}</Badge>
                </TableCell>
                <TableCell>{creative.adConcept}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{creative.createdAt}</TableCell>
                <TableCell>
                  {creative.driveLink ? (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => window.open(creative.driveLink, '_blank')}
                      className="text-blue-600 hover:text-blue-800 p-0 h-auto"
                    >
                      Open Drive
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-sm">No link</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="max-w-24 truncate text-sm text-muted-foreground">
                      {creative.notes || "No notes"}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleNotesEdit(creative)
                      }}
                      className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => setSelectedCreative(creative)}>
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
      <Dialog open={!!notesEditingCreative} onOpenChange={() => setNotesEditingCreative(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Creative: <span className="font-medium">{notesEditingCreative?.adConcept}</span>
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

      {/* Creative Brief Page (Full-screen overlay) */}
      {selectedCreative && (
        <React.Suspense fallback={<div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center">Loading...</div>}>
          <CreativeBriefPage
            creative={selectedCreative}
            onClose={() => setSelectedCreative(null)}
            onUpdateCreative={handleUpdateCreative}
            onDeleteCreative={handleDeleteCreative}
            NEW_CREATIVE_ID={NEW_CREATIVE_ID}
          />
        </React.Suspense>
      )}
    </div>
  )
}