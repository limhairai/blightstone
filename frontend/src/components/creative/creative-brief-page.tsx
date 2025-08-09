"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
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
  ExternalLink,
} from "lucide-react"

// Define the interface for a Creative entry
interface Creative {
  id: string
  batch: string
  status: "draft" | "in-review" | "live" | "paused" | "completed"
  launchDate: string
  adConcept: string
  testHypothesis: string
  adType: string
  adVariable: string
  desire: string
  benefit: string
  objections: string
  persona: string
  hookPattern: string
  results: string
  winningAdLink: string
  briefLink: string
}

interface CreativeBriefPageProps {
  creative: Creative | null
  onClose: () => void
  onUpdateCreative: (updatedCreative: Creative) => void
  onDeleteCreative: (creativeId: string) => void
  NEW_CREATIVE_ID: string
}

export default function CreativeBriefPage({
  creative,
  onClose,
  onUpdateCreative,
  onDeleteCreative,
  NEW_CREATIVE_ID,
}: CreativeBriefPageProps) {
  const [editingCreative, setEditingCreative] = useState<Creative | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [activeSection, setActiveSection] = useState("concept")
  const [mounted, setMounted] = useState(false)

  const isNewCreative = creative?.id === NEW_CREATIVE_ID

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (creative) {
      setEditingCreative(creative)
      setIsEditMode(isNewCreative)
    }
  }, [creative, isNewCreative])

  if (!creative || !mounted) {
    return null
  }

  const handleSave = () => {
    if (editingCreative) {
      const creativeToSave = isNewCreative ? { ...editingCreative, id: Date.now().toString() } : editingCreative
      onUpdateCreative(creativeToSave)
      onClose()
    }
  }

  const handleDiscard = () => {
    if (isNewCreative) {
      onClose()
    } else {
      setEditingCreative(creative)
      setIsEditMode(false)
    }
  }

  const handleDelete = () => {
    if (!isNewCreative && creative.id) {
      onDeleteCreative(creative.id)
    }
    onClose()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 border-green-200"
      case "live": return "bg-blue-100 text-blue-800 border-blue-200"
      case "in-review": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "draft": return "bg-gray-100 text-gray-800 border-gray-200"
      case "paused": return "bg-red-100 text-red-800 border-red-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const navItems = [
    { id: "concept", label: "Ad Concept", icon: Lightbulb },
    { id: "targeting", label: "Targeting", icon: Target },
    { id: "strategy", label: "Strategy", icon: List },
    { id: "performance", label: "Performance", icon: BarChart },
  ]

  const renderSectionContent = (sectionId: string) => {
    const renderField = (label: string, value: string, fieldName: keyof Creative, isTextarea = false) => (
      <div className="bg-muted/30 rounded-lg p-4 min-h-[80px] space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground">{label}</h3>
        {isEditMode ? (
          isTextarea ? (
            <Textarea
              value={(editingCreative?.[fieldName] as string) || ""}
              onChange={(e) => setEditingCreative({ ...editingCreative!, [fieldName]: e.target.value })}
              placeholder={`Enter ${label.toLowerCase()}`}
              className="min-h-[100px]"
            />
          ) : (
            <Input
              value={(editingCreative?.[fieldName] as string) || ""}
              onChange={(e) => setEditingCreative({ ...editingCreative!, [fieldName]: e.target.value })}
              placeholder={`Enter ${label.toLowerCase()}`}
            />
          )
        ) : (
          <p className="text-foreground whitespace-pre-wrap leading-relaxed">
            {value || `No ${label.toLowerCase()} provided.`}
          </p>
        )}
      </div>
    )

    const renderLinkField = (label: string, value: string, fieldName: keyof Creative) => (
      <div className="bg-muted/30 rounded-lg p-4 min-h-[80px] space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground">{label}</h3>
        {isEditMode ? (
          <Input
            type="url"
            value={(editingCreative?.[fieldName] as string) || ""}
            onChange={(e) => setEditingCreative({ ...editingCreative!, [fieldName]: e.target.value })}
            placeholder={`Enter ${label.toLowerCase()} URL`}
          />
        ) : (
          <div className="flex items-center">
            {value ? (
              <Button variant="link" size="sm" asChild className="p-0 h-auto">
                <a href={value} target="_blank" rel="noopener noreferrer">
                  {value} <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </Button>
            ) : (
              <span className="text-muted-foreground">No link provided.</span>
            )}
          </div>
        )}
      </div>
    )

    switch (sectionId) {
      case "concept":
        return (
          <div className="space-y-4">
            {/* Batch and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
                <h2 className="text-lg font-semibold mb-3">Batch</h2>
                {isEditMode ? (
                  <Input
                    value={editingCreative?.batch || ""}
                    onChange={(e) => setEditingCreative({ ...editingCreative!, batch: e.target.value })}
                    placeholder="e.g., Batch 1, Q1 2024"
                  />
                ) : (
                  <p className="text-foreground">{creative.batch || "No batch specified"}</p>
                )}
              </div>

              <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
                <h2 className="text-lg font-semibold mb-3">Status</h2>
                {isEditMode ? (
                  <Select
                    value={editingCreative?.status}
                    onValueChange={(value) => setEditingCreative({ ...editingCreative!, status: value as Creative["status"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                  <Badge className={getStatusColor(creative.status)}>
                    {creative.status.replace("-", " ")}
                  </Badge>
                )}
              </div>
            </div>

            {/* Ad Concept */}
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Ad Concept</h2>
              {renderField("Ad Concept", creative.adConcept, "adConcept", true)}
            </div>

            {/* Test Hypothesis */}
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Test Hypothesis</h2>
              {renderField("Test Hypothesis", creative.testHypothesis, "testHypothesis", true)}
            </div>

            {/* Launch Date */}
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Launch Date</h2>
              {isEditMode ? (
                <Input
                  type="date"
                  value={editingCreative?.launchDate || ""}
                  onChange={(e) => setEditingCreative({ ...editingCreative!, launchDate: e.target.value })}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{creative.launchDate || "No launch date set"}</span>
                </div>
              )}
            </div>
          </div>
        )
      case "targeting":
        return (
          <div className="space-y-4">
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Target Persona</h2>
              {renderField("Persona", creative.persona, "persona")}
            </div>

            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Desire</h2>
              {renderField("Desire", creative.desire, "desire", true)}
            </div>

            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Benefit</h2>
              {renderField("Benefit", creative.benefit, "benefit", true)}
            </div>

            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Objections</h2>
              {renderField("Objections", creative.objections, "objections", true)}
            </div>
          </div>
        )
      case "strategy":
        return (
          <div className="space-y-4">
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Ad Type</h2>
              {renderField("Ad Type", creative.adType, "adType")}
            </div>

            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Ad Variable</h2>
              {renderField("Ad Variable", creative.adVariable, "adVariable", true)}
            </div>

            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Hook Pattern</h2>
              {renderField("Hook Pattern", creative.hookPattern, "hookPattern", true)}
            </div>
          </div>
        )
      case "performance":
        return (
          <div className="space-y-4">
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Results</h2>
              {renderField("Results", creative.results, "results", true)}
            </div>

            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Winning Ad Link</h2>
              {renderLinkField("Winning Ad Link", creative.winningAdLink, "winningAdLink")}
            </div>

            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Brief Link</h2>
              {renderLinkField("Brief Link", creative.briefLink, "briefLink")}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  const briefPageContent = (
    <div className="fixed inset-0 z-[9999] flex bg-background text-foreground">
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
                  activeSection === item.id ? "bg-accent text-accent-foreground" : "hover:bg-[#F5F5F5]"
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
              {isNewCreative ? "New Creative" : creative.batch || "Untitled Creative"}
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
              <Button onClick={handleSave} className="bg-accent hover:bg-[#F5F5F5]/90 text-accent-foreground">
                {isNewCreative ? "Create Creative" : "Save changes"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )

  // Render the brief page as a portal to document.body to ensure it's above everything
  return createPortal(briefPageContent, document.body)
}