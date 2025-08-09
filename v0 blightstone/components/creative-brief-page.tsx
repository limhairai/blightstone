"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  X,
  Edit,
  Calendar,
  List,
  Search,
  ChevronRight,
  Settings,
  Trash2,
  Tag,
  Lightbulb,
  Target,
  BarChart,
  User,
} from "lucide-react"
import { ExternalLink } from "lucide-react"

// Define the interface for a Creative entry (re-used from creative-tracker-page.tsx)
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
}

// Define the interface for a Persona entry (re-used from persona-page.tsx)
interface Persona {
  id: string
  name: string // Persona Type (Naming)
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

interface CreativeBriefPageProps {
  creative: Creative | null
  onClose: () => void
  onUpdateCreative: (updatedCreative: Creative) => void
  onDeleteCreative: (creativeId: string) => void
  NEW_CREATIVE_ID: string // Constant for new creative temp ID
  personas: Persona[] // Pass the list of personas for the dropdown
}

export default function CreativeBriefPage({
  creative,
  onClose,
  onUpdateCreative,
  onDeleteCreative,
  NEW_CREATIVE_ID,
  personas, // Receive the personas list
}: CreativeBriefPageProps) {
  const [editingCreative, setEditingCreative] = useState<Creative | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [activeSection, setActiveSection] = useState("overview") // For left navigation

  const isNewCreative = creative?.id === NEW_CREATIVE_ID

  useEffect(() => {
    if (creative) {
      setEditingCreative(creative)
      setIsEditMode(isNewCreative) // If it's a new creative, start in edit mode
    }
  }, [creative, isNewCreative])

  if (!creative) {
    return null // Should not happen if opened correctly
  }

  const handleSave = () => {
    if (editingCreative) {
      const creativeToSave = isNewCreative ? { ...editingCreative, id: Date.now().toString() } : editingCreative
      onUpdateCreative(creativeToSave)
      onClose() // Close the brief after saving
    }
  }

  const handleDiscard = () => {
    if (isNewCreative) {
      onClose() // If new creative, just close without saving
    } else {
      setEditingCreative(creative) // Revert to original creative data
      setIsEditMode(false)
    }
  }

  const handleDelete = () => {
    if (!isNewCreative && creative.id) {
      onDeleteCreative(creative.id)
    }
    onClose() // Close the brief after deletion or if it was a new creative
  }

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

  const navItems = [
    { id: "overview", label: "Overview", icon: List },
    { id: "ad-concept", label: "Ad Concept", icon: Lightbulb },
    { id: "hypothesis-strategy", label: "Hypothesis & Strategy", icon: Target },
    { id: "results-links", label: "Results & Links", icon: BarChart },
  ]

  const renderSectionContent = (sectionId: string) => {
    switch (sectionId) {
      case "overview":
        return (
          <div className="space-y-4">
            {/* Ad Concept Title */}
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Ad Concept (Inspo)</h2>
              {isEditMode ? (
                <Input
                  value={editingCreative?.adConcept || ""}
                  onChange={(e) => setEditingCreative({ ...editingCreative!, adConcept: e.target.value })}
                  className="text-xl font-bold"
                  placeholder="Enter ad concept"
                />
              ) : (
                <h3 className="text-xl font-bold">{creative.adConcept || "No Concept"}</h3>
              )}
            </div>

            {/* Creative Properties */}
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Creative Properties</h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-3">
                    <Tag className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Batch #</span>
                  </div>
                  {isEditMode ? (
                    <Input
                      value={editingCreative?.batch || ""}
                      onChange={(e) => setEditingCreative({ ...editingCreative!, batch: e.target.value })}
                      className="w-48"
                      placeholder="e.g., Batch #001"
                    />
                  ) : (
                    <span className="text-muted-foreground">{creative.batch || "N/A"}</span>
                  )}
                </div>

                <div className="flex items-center justify-between py-2 border-b">
                  <span className="font-medium">Status</span>
                  {isEditMode ? (
                    <Select
                      value={editingCreative?.status}
                      onValueChange={(value) =>
                        setEditingCreative({ ...editingCreative!, status: value as Creative["status"] })
                      }
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="in-review">In Review</SelectItem>
                        <SelectItem value="live">Live</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={getStatusColor(creative.status)}>{creative.status.replace("-", " ")}</Badge>
                  )}
                </div>

                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Launch Date</span>
                  </div>
                  {isEditMode ? (
                    <Input
                      type="date"
                      value={editingCreative?.launchDate || ""}
                      onChange={(e) => setEditingCreative({ ...editingCreative!, launchDate: e.target.value })}
                      className="w-48"
                    />
                  ) : (
                    <span className="text-muted-foreground">{creative.launchDate || "No date"}</span>
                  )}
                </div>

                <div className="flex items-center justify-between py-2 border-b">
                  <span className="font-medium">Ad Type</span>
                  {isEditMode ? (
                    <Input
                      value={editingCreative?.adType || ""}
                      onChange={(e) => setEditingCreative({ ...editingCreative!, adType: e.target.value })}
                      className="w-48"
                      placeholder="e.g., Video Ad, Image Ad"
                    />
                  ) : (
                    <span className="text-muted-foreground">{creative.adType || "N/A"}</span>
                  )}
                </div>

                <div className="flex items-center justify-between py-2 border-b">
                  <span className="font-medium">Ad Variable</span>
                  {isEditMode ? (
                    <Input
                      value={editingCreative?.adVariable || ""}
                      onChange={(e) => setEditingCreative({ ...editingCreative!, adVariable: e.target.value })}
                      className="w-48"
                      placeholder="e.g., Hook, Visual"
                    />
                  ) : (
                    <span className="text-muted-foreground">{creative.adVariable || "N/A"}</span>
                  )}
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Persona</span>
                  </div>
                  {isEditMode ? (
                    <Select
                      value={editingCreative?.persona || ""}
                      onValueChange={(value) => setEditingCreative({ ...editingCreative!, persona: value })}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select persona" />
                      </SelectTrigger>
                      <SelectContent>
                        {personas.map((p) => (
                          <SelectItem key={p.id} value={p.name}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-muted-foreground">{creative.persona || "No Persona"}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      case "ad-concept":
        return (
          <div className="space-y-4">
            <div className="bg-card p-6 rounded-lg shadow-sm border border-border space-y-4">
              <h2 className="text-lg font-semibold">Ad Concept (Inspo)</h2>
              {isEditMode ? (
                <Textarea
                  value={editingCreative?.adConcept || ""}
                  onChange={(e) => setEditingCreative({ ...editingCreative!, adConcept: e.target.value })}
                  rows={8}
                  className="resize-y"
                  placeholder="Describe the ad concept and inspiration."
                />
              ) : (
                <div className="bg-muted/30 rounded-lg p-4 min-h-[100px]">
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                    {creative.adConcept || "No ad concept provided."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      case "hypothesis-strategy":
        return (
          <div className="space-y-4">
            {/* Test Hypothesis */}
            <div className="bg-card p-6 rounded-lg shadow-sm border border-border space-y-4">
              <h2 className="text-lg font-semibold">
                What are you creating/testing and what gives you the confidence this test will improve overall
                performance?
              </h2>
              {isEditMode ? (
                <Textarea
                  value={editingCreative?.testHypothesis || ""}
                  onChange={(e) => setEditingCreative({ ...editingCreative!, testHypothesis: e.target.value })}
                  rows={8}
                  className="resize-y"
                  placeholder="Enter your test hypothesis and confidence factors."
                />
              ) : (
                <div className="bg-muted/30 rounded-lg p-4 min-h-[100px]">
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                    {creative.testHypothesis || "No hypothesis provided."}
                  </p>
                </div>
              )}
            </div>

            {/* Desire */}
            <div className="bg-card p-6 rounded-lg shadow-sm border border-border space-y-4">
              <h2 className="text-lg font-semibold">Desire</h2>
              {isEditMode ? (
                <Textarea
                  value={editingCreative?.desire || ""}
                  onChange={(e) => setEditingCreative({ ...editingCreative!, desire: e.target.value })}
                  rows={4}
                  className="resize-y"
                  placeholder="What is the core desire this ad appeals to?"
                />
              ) : (
                <div className="bg-muted/30 rounded-lg p-4 min-h-[80px]">
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                    {creative.desire || "No desire specified."}
                  </p>
                </div>
              )}
            </div>

            {/* Benefit */}
            <div className="bg-card p-6 rounded-lg shadow-sm border border-border space-y-4">
              <h2 className="text-lg font-semibold">
                Benefit (Focus on pain points and objections to determine which benefits to highlight.)
              </h2>
              {isEditMode ? (
                <Textarea
                  value={editingCreative?.benefit || ""}
                  onChange={(e) => setEditingCreative({ ...editingCreative!, benefit: e.target.value })}
                  rows={6}
                  className="resize-y"
                  placeholder="Describe the benefits, addressing pain points and objections."
                />
              ) : (
                <div className="bg-muted/30 rounded-lg p-4 min-h-[100px]">
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                    {creative.benefit || "No benefits specified."}
                  </p>
                </div>
              )}
            </div>

            {/* Objections */}
            <div className="bg-card p-6 rounded-lg shadow-sm border border-border space-y-4">
              <h2 className="text-lg font-semibold">Objections</h2>
              {isEditMode ? (
                <Textarea
                  value={editingCreative?.objections || ""}
                  onChange={(e) => setEditingCreative({ ...editingCreative!, objections: e.target.value })}
                  rows={4}
                  className="resize-y"
                  placeholder="List potential customer objections."
                />
              ) : (
                <div className="bg-muted/30 rounded-lg p-4 min-h-[80px]">
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                    {creative.objections || "No objections listed."}
                  </p>
                </div>
              )}
            </div>

            {/* Persona (moved to overview for now, but keeping this section for future expansion if needed) */}
            {/* <div className="bg-card p-6 rounded-lg shadow-sm border border-border space-y-4">
              <h2 className="text-lg font-semibold">Persona</h2>
              {isEditMode ? (
                <Input
                  value={editingCreative?.persona || ""}
                  onChange={(e) => setEditingCreative({ ...editingCreative!, persona: e.target.value })}
                  placeholder="e.g., Catherine (Mom, 35-50)"
                />
              ) : (
                <div className="bg-muted/30 rounded-lg p-4 min-h-[60px]">
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                    {creative.persona || "No persona specified."}
                  </p>
                </div>
              )}
            </div> */}

            {/* Hook Pattern */}
            <div className="bg-card p-6 rounded-lg shadow-sm border border-border space-y-4">
              <h2 className="text-lg font-semibold">Hook Pattern (Describe how the hook will look like)</h2>
              {isEditMode ? (
                <Textarea
                  value={editingCreative?.hookPattern || ""}
                  onChange={(e) => setEditingCreative({ ...editingCreative!, hookPattern: e.target.value })}
                  rows={6}
                  className="resize-y"
                  placeholder="Describe the visual or textual hook."
                />
              ) : (
                <div className="bg-muted/30 rounded-lg p-4 min-h-[100px]">
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                    {creative.hookPattern || "No hook pattern described."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      case "results-links":
        return (
          <div className="space-y-4">
            {/* Results */}
            <div className="bg-card p-6 rounded-lg shadow-sm border border-border space-y-4">
              <h2 className="text-lg font-semibold">Results</h2>
              {isEditMode ? (
                <Textarea
                  value={editingCreative?.results || ""}
                  onChange={(e) => setEditingCreative({ ...editingCreative!, results: e.target.value })}
                  rows={6}
                  className="resize-y"
                  placeholder="Summarize the performance results."
                />
              ) : (
                <div className="bg-muted/30 rounded-lg p-4 min-h-[100px]">
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                    {creative.results || "No results recorded."}
                  </p>
                </div>
              )}
            </div>

            {/* Winning Ad Link */}
            <div className="bg-card p-6 rounded-lg shadow-sm border border-border space-y-4">
              <h2 className="text-lg font-semibold">Winning Ad Link (All Winning Ads or Best Performing Ad)</h2>
              {isEditMode ? (
                <Input
                  type="url"
                  value={editingCreative?.winningAdLink || ""}
                  onChange={(e) => setEditingCreative({ ...editingCreative!, winningAdLink: e.target.value })}
                  placeholder="https://example.com/winning-ad"
                />
              ) : (
                <div className="bg-muted/30 rounded-lg p-4 min-h-[60px] flex items-center">
                  {creative.winningAdLink ? (
                    <Button variant="link" size="sm" asChild className="p-0 h-auto">
                      <a href={creative.winningAdLink} target="_blank" rel="noopener noreferrer">
                        {creative.winningAdLink} <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </Button>
                  ) : (
                    <span className="text-muted-foreground">No link provided.</span>
                  )}
                </div>
              )}
            </div>

            {/* Brief Link */}
            <div className="bg-card p-6 rounded-lg shadow-sm border border-border space-y-4">
              <h2 className="text-lg font-semibold">Brief Link</h2>
              {isEditMode ? (
                <Input
                  type="url"
                  value={editingCreative?.briefLink || ""}
                  onChange={(e) => setEditingCreative({ ...editingCreative!, briefLink: e.target.value })}
                  placeholder="https://example.com/creative-brief"
                />
              ) : (
                <div className="bg-muted/30 rounded-lg p-4 min-h-[60px] flex items-center">
                  {creative.briefLink ? (
                    <Button variant="link" size="sm" asChild className="p-0 h-auto">
                      <a href={creative.briefLink} target="_blank" rel="noopener noreferrer">
                        {creative.briefLink} <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </Button>
                  ) : (
                    <span className="text-muted-foreground">No link provided.</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex bg-background text-foreground">
      {/* Left Navigation Panel */}
      <div className="w-64 bg-card border-r border-border flex flex-col py-4 px-3">
        <div className="flex items-center justify-between px-2 mb-4">
          <h2 className="text-lg font-semibold">Creative Sections</h2>
        </div>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search sections..." className="pl-9" />
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={`w-full justify-start h-10 ${
                  activeSection === item.id ? "bg-accent text-accent-foreground" : "hover:bg-accent"
                }`}
                onClick={() => setActiveSection(item.id)}
              >
                <Icon className="h-4 w-4 mr-3" />
                {item.label}
              </Button>
            )
          })}
        </nav>
        <Separator className="my-4" />
        <Button variant="ghost" className="w-full justify-start h-10 text-muted-foreground hover:text-foreground">
          <Settings className="h-4 w-4 mr-3" />
          Settings
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Header */}
        <div className="h-16 border-b border-border flex items-center px-6 justify-between bg-card">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Creative Tracker</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {isNewCreative ? "New Creative" : creative.adConcept || "Untitled Creative"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {!isNewCreative && (
              <Button variant="outline" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
              className={isEditMode ? "bg-accent text-accent-foreground" : ""}
            >
              <Edit className="h-4 w-4 mr-2" />
              {isEditMode ? "Done" : "Edit"}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full ml-2">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">{renderSectionContent(activeSection)}</div>

        {/* Footer */}
        <div className="h-16 border-t border-border flex items-center px-6 justify-end gap-3 bg-card">
          <p className="text-xs text-muted-foreground mr-auto">Creative tracking powered by Blightstone.</p>
          {isEditMode && (
            <>
              <Button variant="outline" onClick={handleDiscard}>
                {isNewCreative ? "Cancel" : "Discard changes"}
              </Button>
              <Button onClick={handleSave} className="bg-black hover:bg-black/90 text-white">
                {isNewCreative ? "Create Creative" : "Save changes"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
