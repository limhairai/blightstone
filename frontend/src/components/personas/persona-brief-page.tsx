"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  X,
  Edit,
  User,
  Brain,
  Target,
  TrendingUp,
  Search,
  ChevronRight,
  Settings,
  Trash2,
  Heart,
} from "lucide-react"

// Define the interface for a Persona entry
// Use the local Persona interface from the personas page
interface Persona {
  id: string
  name: string
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
  projectId: string
  description: string
  angle: string
  dominoStatement: string
}

interface PersonaBriefPageProps {
  persona: Persona | null
  onClose: () => void
  onUpdatePersona: (updatedPersona: Persona) => void
  onDeletePersona: (personaId: string) => void
  NEW_PERSONA_ID: string
}

export default function PersonaBriefPage({
  persona,
  onClose,
  onUpdatePersona,
  onDeletePersona,
  NEW_PERSONA_ID,
}: PersonaBriefPageProps) {
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [activeSection, setActiveSection] = useState("overview")
  const [mounted, setMounted] = useState(false)

  const isNewPersona = persona?.id === NEW_PERSONA_ID

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (persona) {
      setEditingPersona(persona)
      setIsEditMode(isNewPersona)
    }
  }, [persona, isNewPersona])

  if (!persona || !mounted) {
    return null
  }

  const handleSave = () => {
    if (editingPersona) {
      const personaToSave = isNewPersona ? { ...editingPersona, id: Date.now().toString() } : editingPersona
      onUpdatePersona(personaToSave)
      onClose()
    }
  }

  const handleDiscard = () => {
    if (isNewPersona) {
      onClose()
    } else {
      setEditingPersona(persona)
      setIsEditMode(false)
    }
  }

  const handleDelete = () => {
    if (!isNewPersona && persona.id) {
      onDeletePersona(persona.id)
    }
    onClose()
  }

  const navItems = [
    { id: "overview", label: "Overview", icon: User },
    { id: "psychology", label: "Psychology", icon: Brain },
    { id: "targeting", label: "Targeting", icon: Target },
    { id: "strategy", label: "Strategy", icon: TrendingUp },
  ]

  const renderSectionContent = (sectionId: string) => {
    const renderField = (label: string, value: string, fieldName: keyof Persona, isTextarea = false) => (
      <div className="bg-muted/30 rounded-lg p-4 min-h-[80px] space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground">{label}</h3>
        {isEditMode ? (
          isTextarea ? (
            <Textarea
              value={(editingPersona?.[fieldName] as string) || ""}
              onChange={(e) => setEditingPersona({ ...editingPersona!, [fieldName]: e.target.value })}
              placeholder={`Enter ${label.toLowerCase()}`}
              className="min-h-[100px]"
            />
          ) : (
            <Input
              value={(editingPersona?.[fieldName] as string) || ""}
              onChange={(e) => setEditingPersona({ ...editingPersona!, [fieldName]: e.target.value })}
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

    switch (sectionId) {
      case "overview":
        return (
          <div className="space-y-4">
            {/* Persona Name */}
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Persona Name</h2>
              {isEditMode ? (
                <Input
                  value={editingPersona?.name || ""}
                  onChange={(e) => setEditingPersona({ ...editingPersona!, name: e.target.value })}
                  className="text-xl font-bold"
                  placeholder="Enter persona name"
                />
              ) : (
                <h3 className="text-xl font-bold">{persona.name || "Untitled Persona"}</h3>
              )}
            </div>

            {/* Demographics */}
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Demographics</h2>
              {renderField("Age, Gender & Location", persona.ageGenderLocation, "ageGenderLocation")}
            </div>

            {/* Description */}
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Description</h2>
              {renderField("Description", persona.description || "", "description", true)}
            </div>
          </div>
        )
      case "psychology":
        return (
          <div className="space-y-4">
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Daily Struggles</h2>
              {renderField("Daily Struggles", persona.dailyStruggles, "dailyStruggles", true)}
            </div>

            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Desired Characteristics</h2>
              {renderField("Desired Characteristics", persona.desiredCharacteristics, "desiredCharacteristics", true)}
            </div>

            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Insecurities</h2>
              {renderField("Insecurities", persona.insecurities, "insecurities", true)}
            </div>

            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Beliefs to Overcome</h2>
              {renderField("Beliefs to Overcome", persona.beliefsToOvercome, "beliefsToOvercome", true)}
            </div>
          </div>
        )
      case "targeting":
        return (
          <div className="space-y-4">
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Desired Social Status</h2>
              {renderField("Desired Social Status", persona.desiredSocialStatus, "desiredSocialStatus", true)}
            </div>

            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">How Product Helps Achieve Status</h2>
              {renderField("Product Help Achieve Status", persona.productHelpAchieveStatus, "productHelpAchieveStatus", true)}
            </div>

            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Failed Solutions</h2>
              {renderField("Failed Solutions", persona.failedSolutions, "failedSolutions", true)}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
                <h2 className="text-lg font-semibold mb-3">Market Awareness</h2>
                {isEditMode ? (
                  <Select
                    value={editingPersona?.marketAwareness}
                    onValueChange={(value) => setEditingPersona({ ...editingPersona!, marketAwareness: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select awareness level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Unaware">Unaware</SelectItem>
                      <SelectItem value="Problem Aware">Problem Aware</SelectItem>
                      <SelectItem value="Solution Aware">Solution Aware</SelectItem>
                      <SelectItem value="Product Aware">Product Aware</SelectItem>
                      <SelectItem value="Most Aware">Most Aware</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-foreground">{persona.marketAwareness || "Not specified"}</p>
                )}
              </div>

              <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
                <h2 className="text-lg font-semibold mb-3">Market Sophistication</h2>
                {isEditMode ? (
                  <Select
                    value={editingPersona?.marketSophistication}
                    onValueChange={(value) => setEditingPersona({ ...editingPersona!, marketSophistication: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sophistication level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Very High">Very High</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-foreground">{persona.marketSophistication || "Not specified"}</p>
                )}
              </div>
            </div>
          </div>
        )
      case "strategy":
        return (
          <div className="space-y-4">
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Angle</h2>
              {renderField("Angle", persona.angle || "", "angle", true)}
            </div>

            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Domino Statement</h2>
              {renderField("Domino Statement", persona.dominoStatement || "", "dominoStatement", true)}
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
          <h2 className="text-lg font-semibold">Persona Sections</h2>
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
            <span className="text-sm text-muted-foreground">Personas</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {isNewPersona ? "New Persona" : persona.name || "Untitled Persona"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {!isNewPersona && (
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
          <p className="text-xs text-muted-foreground mr-auto">Persona management powered by Blightstone.</p>
          {isEditMode && (
            <>
              <Button variant="outline" onClick={handleDiscard}>
                {isNewPersona ? "Cancel" : "Discard changes"}
              </Button>
              <Button onClick={handleSave} className="bg-accent hover:bg-[#F5F5F5]/90 text-accent-foreground">
                {isNewPersona ? "Create Persona" : "Save changes"}
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